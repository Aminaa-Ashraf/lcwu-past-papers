import { getCourses } from "@/lib/data";
import { AddPaperForm } from "@/components/admin/AddPaperForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const courses = await getCourses();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <section className="max-w-2xl">
        <p className="tracking-label text-sm font-semibold uppercase text-accent">
          Admin
        </p>
        <h1 className="font-display mt-3 text-4xl font-semibold text-ink">
          Add a paper
        </h1>
      </section>

      <section className="shadow-panel mt-10 border border-line bg-paper p-6">
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
