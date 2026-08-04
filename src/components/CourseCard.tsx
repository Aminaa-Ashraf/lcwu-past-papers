import Link from "next/link";
import type { Course } from "@/lib/types";

export function CourseCard({ course }: { course: Course }) {
  const count = course.paperCount ?? 0;
  const years = course.years ?? [];

  return (
    <Link href={`/courses/${course.slug}`} className="course-card">
      <div className="course-card__top">
        <span className="course-card__code">{course.code}</span>
        <span className="course-card__count">
          {count} {count === 1 ? "paper" : "papers"}
          <span aria-hidden> →</span>
        </span>
      </div>

      <h3 className="course-card__name">{course.name}</h3>

      <div className="course-card__years">
        {years.length > 0 ? (
          years.map((year) => (
            <span key={year} className="year-chip year-chip--accent">
              {year}
            </span>
          ))
        ) : (
          <span className="year-chip">No years yet</span>
        )}
      </div>
    </Link>
  );
}
