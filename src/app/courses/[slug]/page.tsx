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
    <div className="mx-auto max-w-[68rem] px-5 py-12 sm:py-16">
      <Link
        href="/#courses"
        className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
      >
        ← All courses
      </Link>

      <section className="mt-7 max-w-2xl border-b border-[var(--line)] pb-8">
        <span className="course-card__code">{course.code}</span>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          {course.name}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {papers.length} {papers.length === 1 ? "paper" : "papers"}
          {byYear.length > 0
            ? ` · years ${byYear.map(([y]) => y).join(", ")}`
            : ""}
        </p>
      </section>

      {papers.length === 0 ? (
        <p className="mt-14 text-[var(--muted)]">
          No papers for this course yet.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {byYear.map(([year, list]) => (
            <section key={year}>
              <h2 className="year-block__title">
                {year}
                <span className="year-block__label">exam year</span>
              </h2>
              <ul className="mt-3 overflow-hidden border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow)]">
                {list.map((paper) => (
                  <li
                    key={paper.id}
                    className="border-b border-[var(--line)] last:border-b-0"
                  >
                    <Link
                      href={`/papers/${paper.id}`}
                      className="group flex flex-col gap-1 px-5 py-5 transition-colors hover:bg-[var(--accent-soft)] sm:flex-row sm:items-baseline sm:justify-between"
                    >
                      <div>
                        <p className="text-lg font-medium text-[var(--ink)] group-hover:text-[var(--accent)]">
                          {paper.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {examLabel(paper.examType)} · {year}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--accent)]">
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
