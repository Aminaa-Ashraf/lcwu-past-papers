import type { RowDataPacket } from "mysql2/promise";
import { dbQuery, isDatabaseConfigured } from "./db";
import { getLocalPapers, getLocalTeachers } from "./local-store";
import { mockCourses, mockPapers, mockTeachers } from "./mock-data";
import type { Course, ExamType, Paper, PaperStatus, Teacher } from "./types";

type CourseRow = RowDataPacket & {
  id: number;
  name: string;
  code: string;
  slug: string;
  semester: number;
  department: string;
  paper_count?: number;
  years?: string | null;
};

type PaperRow = RowDataPacket & {
  id: number;
  course_id: number;
  title: string;
  year: number;
  exam_type: ExamType;
  teacher_id: number | null;
  teacher: string | null;
  file_url: string;
  status: PaperStatus;
};

type TeacherRow = RowDataPacket & {
  id: number;
  name: string;
};

function parseYears(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((y) => Number(y.trim()))
    .filter((y) => Number.isFinite(y));
}

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    slug: row.slug,
    semester: row.semester,
    department: row.department,
    paperCount: row.paper_count,
    years: parseYears(row.years),
  };
}

function mapPaper(row: PaperRow): Paper {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    year: row.year,
    examType: row.exam_type,
    teacherId: row.teacher_id,
    teacher: row.teacher,
    fileUrl: row.file_url,
    status: row.status,
  };
}

async function getMockPapersMerged(): Promise<Paper[]> {
  const local = await getLocalPapers();
  return [...mockPapers, ...local];
}

async function getMockTeachersMerged(): Promise<Teacher[]> {
  const local = await getLocalTeachers();
  const byName = new Map<string, Teacher>();
  for (const t of [...mockTeachers, ...local]) {
    byName.set(t.name.toLowerCase(), t);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function withDbFallback<T>(
  dbFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  if (!isDatabaseConfigured()) {
    return fallbackFn();
  }
  try {
    return await dbFn();
  } catch (error) {
    console.error("Database unavailable, using local data:", error);
    return fallbackFn();
  }
}

export async function getTeachers(): Promise<Teacher[]> {
  return withDbFallback(async () => {
    const [rows] = await dbQuery<TeacherRow[]>(
      `SELECT id, name FROM teachers ORDER BY name ASC`
    );
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }, getMockTeachersMerged);
}

async function getLocalCourses(): Promise<Course[]> {
  const papers = await getMockPapersMerged();
  return mockCourses
    .map((c) => {
      const coursePapers = papers.filter(
        (p) => p.courseId === c.id && p.status === "approved"
      );
      const years = [...new Set(coursePapers.map((p) => p.year))].sort(
        (a, b) => b - a
      );
      return {
        ...c,
        paperCount: coursePapers.length,
        years,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCourses(): Promise<Course[]> {
  return withDbFallback(async () => {
    const [rows] = await dbQuery<CourseRow[]>(
      `SELECT c.*,
              COUNT(p.id) AS paper_count,
              GROUP_CONCAT(DISTINCT p.year ORDER BY p.year DESC) AS years
       FROM courses c
       LEFT JOIN papers p
         ON p.course_id = c.id AND p.status = 'approved'
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return rows.map(mapCourse);
  }, getLocalCourses);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return withDbFallback(
    async () => {
      const [rows] = await dbQuery<CourseRow[]>(
        `SELECT * FROM courses WHERE slug = ? LIMIT 1`,
        [slug]
      );
      return rows[0] ? mapCourse(rows[0]) : null;
    },
    async () => mockCourses.find((c) => c.slug === slug) ?? null
  );
}

export async function getPapersByCourseId(courseId: number): Promise<Paper[]> {
  return withDbFallback(
    async () => {
      const [rows] = await dbQuery<PaperRow[]>(
        `SELECT * FROM papers
         WHERE course_id = ? AND status = 'approved'
         ORDER BY year DESC, exam_type ASC`,
        [courseId]
      );
      return rows.map(mapPaper);
    },
    async () => {
      const papers = await getMockPapersMerged();
      return papers
        .filter((p) => p.courseId === courseId && p.status === "approved")
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
    }
  );
}

export async function getPaperById(
  id: number
): Promise<(Paper & { course?: Course }) | null> {
  return withDbFallback(
    async () => getPaperByIdFromDb(id),
    async () => {
      const papers = await getMockPapersMerged();
      const paper = papers.find((p) => p.id === id && p.status === "approved");
      if (!paper) return null;
      const course = mockCourses.find((c) => c.id === paper.courseId);
      return { ...paper, course };
    }
  );
}

async function getPaperByIdFromDb(
  id: number
): Promise<(Paper & { course?: Course }) | null> {
  const [rows] = await dbQuery<
    (PaperRow & {
      c_id: number;
      c_name: string;
      c_code: string;
      c_slug: string;
      c_semester: number;
      c_department: string;
    })[]
  >(
    `SELECT p.*,
            c.id AS c_id, c.name AS c_name, c.code AS c_code,
            c.slug AS c_slug, c.semester AS c_semester,
            c.department AS c_department
     FROM papers p
     JOIN courses c ON c.id = p.course_id
     WHERE p.id = ? AND p.status = 'approved'
     LIMIT 1`,
    [id]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    ...mapPaper(row),
    course: {
      id: row.c_id,
      name: row.c_name,
      code: row.c_code,
      slug: row.c_slug,
      semester: row.c_semester,
      department: row.c_department,
    },
  };
}
