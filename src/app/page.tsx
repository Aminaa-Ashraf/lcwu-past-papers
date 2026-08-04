import { CourseSearch } from "@/components/CourseSearch";
import { getCourses } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await getCourses();
  const totalPapers = courses.reduce((sum, c) => sum + (c.paperCount ?? 0), 0);
  const coursesWithPapers = courses.filter((c) => (c.paperCount ?? 0) > 0).length;
  const coveragePct =
    courses.length === 0
      ? 0
      : Math.round((coursesWithPapers / courses.length) * 100);

  return (
    <div>
      <section className="hero">
        <div aria-hidden className="hero__ornament" />
        <div className="hero__inner">
          <div>
            <p className="hero__eyebrow animate-fade-up">
              Lahore College for Women University
            </p>
            <h1 className="hero__title animate-fade-up-delay">
              LCWU Past Papers
            </h1>
            <p className="hero__lead animate-fade-up-delay-2">
              Past papers for LCWU Computer Science. Pick a course, open the
              year, and download the PDF.
            </p>
            <div className="hero__actions animate-fade-up-delay-2">
              <a href="#courses" className="btn-primary">
                Browse courses
              </a>
            </div>
          </div>

          <aside className="hero__panel animate-fade-up-delay-2">
            <div className="hero__panel-top">
              <p className="hero__panel-label">Archive</p>
              <span className="hero__panel-badge">BSCS</span>
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <p className="hero__stat-value">{courses.length}</p>
                <p className="hero__stat-label">Courses</p>
              </div>
              <div className="hero__stat-divider" aria-hidden />
              <div className="hero__stat">
                <p className="hero__stat-value">{totalPapers}</p>
                <p className="hero__stat-label">Papers</p>
              </div>
            </div>

            <div className="hero__coverage">
              <div className="hero__coverage-meta">
                <span>
                  {coursesWithPapers}/{courses.length} have papers
                </span>
                <span>{coveragePct}%</span>
              </div>
              <div className="hero__coverage-track">
                <div
                  className="hero__coverage-fill"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
              <p className="hero__panel-note">
                Sorted by course and exam year. New PDFs go up from Admin.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div id="courses" className="course-section">
        <div className="course-section__head">
          <div>
            <h2 className="course-section__title">All courses</h2>
            <p className="course-section__meta mt-1">
              Search by name or code, then open a course
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <p className="text-muted">No courses yet.</p>
        ) : (
          <CourseSearch courses={courses} />
        )}
      </div>
    </div>
  );
}
