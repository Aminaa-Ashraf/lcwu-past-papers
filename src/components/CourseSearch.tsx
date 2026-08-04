"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import type { Course } from "@/lib/types";

export function CourseSearch({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [courses, query]);

  return (
    <div>
      <div className="course-search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses by name or code…"
          aria-label="Search courses"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--muted)]">No courses match “{query}”.</p>
      ) : (
        <div className="course-list">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
