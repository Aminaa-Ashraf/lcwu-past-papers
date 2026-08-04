import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaperById } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaperPage({ params }: Props) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isFinite(paperId)) notFound();

  const paper = await getPaperById(paperId);
  if (!paper) notFound();

  return (
    <div className="mx-auto max-w-[68rem] px-5 py-12 sm:py-16">
      {paper.course ? (
        <Link
          href={`/courses/${paper.course.slug}`}
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← {paper.course.name}
        </Link>
      ) : (
        <Link
          href="/"
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          ← All courses
        </Link>
      )}

      <section className="mt-7 flex flex-col gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            {paper.year} · {paper.examType}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {paper.title}
          </h1>
        </div>

        <a href={paper.fileUrl} download className="btn-primary">
          Download PDF
        </a>
      </section>

      <div className="mt-10 overflow-hidden border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow)]">
        <iframe
          title={paper.title}
          src={paper.fileUrl}
          className="h-[75vh] w-full bg-white"
        />
      </div>
    </div>
  );
}
