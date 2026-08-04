import { getCourses } from "@/lib/data";
import { AddPaperForm } from "@/components/admin/AddPaperForm";

export default async function AdminPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Admin
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-[var(--ink)]">
          Add a paper
        </h1>
      </section>

      <section className="mt-10 border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow)]">
        <AddPaperForm
          courses={courses.map((c) => ({
            id: c.id,
            name: c.name,
            code: c.code,
          }))}
        />
      </section>
    </div>
  );
}
