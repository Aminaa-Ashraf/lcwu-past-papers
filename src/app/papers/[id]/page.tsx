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
    <div className="mx-auto max-w-272 px-5 py-12 sm:py-16">
      {paper.course ? (
        <Link
          href={`/courses/${paper.course.slug}`}
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          ← {paper.course.name}
        </Link>
      ) : (
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-accent"
        >
          ← All courses
        </Link>
      )}

      <section className="mt-7 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {paper.year} · {paper.examType}
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {paper.title}
          </h1>
        </div>

        <a href={paper.fileUrl} download className="btn-primary">
          Download PDF
        </a>
      </section>

      <div className="mt-10 overflow-hidden border border-line bg-paper shadow-panel">
        <iframe
          title={paper.title}
          src={paper.fileUrl}
          className="h-[75vh] w-full bg-white"
        />
      </div>
    </div>
  );
}
