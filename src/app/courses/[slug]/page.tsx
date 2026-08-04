import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getPapersByCourseId } from "@/lib/data";
import type { Paper } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
};

function groupByYear(papers: Paper[]) {
  const map = new Map<number, Paper[]>();
  for (const paper of papers) {
    const list = map.get(paper.year) ?? [];
    list.push(paper);
    map.set(paper.year, list);
  }
  return [...map.entries()].sort(([a], [b]) => b - a);
}

function examLabel(type: Paper["examType"]) {
  const labels: Record<Paper["examType"], string> = {
    mid: "Mid",
    final: "Final",
    quiz: "Quiz",
    assignment: "Assignment",
    other: "Other",
  };
  return labels[type];
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const papers = await getPapersByCourseId(course.id);
  const byYear = groupByYear(papers);

  return (
    <div className="page-wrap">
      <Link
        href="/#courses"
        className="hover-text-accent text-sm font-medium text-muted transition-colors"
      >
        ← All courses
      </Link>

      <section className="mt-7 max-w-2xl border-b border-line pb-8">
        <span className="course-card__code">{course.code}</span>
        <h1 className="font-display mt-4 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          {course.name}
        </h1>
        <p className="mt-3 text-muted">
          {papers.length} {papers.length === 1 ? "paper" : "papers"}
          {byYear.length > 0
            ? ` · years ${byYear.map(([y]) => y).join(", ")}`
            : ""}
        </p>
      </section>

      {papers.length === 0 ? (
        <p className="mt-14 text-muted">No papers for this course yet.</p>
      ) : (
        <div className="mt-10 space-y-10">
          {byYear.map(([year, list]) => (
            <section key={year}>
              <h2 className="year-block__title">
                {year}
                <span className="year-block__label">exam year</span>
              </h2>
              <ul className="shadow-panel mt-3 overflow-hidden border border-line bg-paper">
                {list.map((paper) => (
                  <li
                    key={paper.id}
                    className="border-b border-line last:border-b-0"
                  >
                    <Link
                      href={`/papers/${paper.id}`}
                      className="hover-bg-accent-soft group flex flex-col gap-1 px-5 py-5 transition-colors sm:flex-row sm:items-baseline sm:justify-between"
                    >
                      <div>
                        <p className="group-hover-text-accent text-lg font-medium text-ink">
                          {paper.title}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {examLabel(paper.examType)} · {year}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-accent">
                        View PDF →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
