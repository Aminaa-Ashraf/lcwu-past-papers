import { getLocalPapers, getLocalTeachers } from "./local-store";
import { mockCourses, mockPapers, mockTeachers } from "./mock-data";
import { getDb, isFirebaseConfigured } from "./firebase-admin";
import type { Course, ExamType, Paper, PaperStatus, Teacher } from "./types";

type CourseDoc = {
  id: number;
  name: string;
  code: string;
  slug: string;
  semester: number;
  department: string;
};

type PaperDoc = {
  id: number;
  courseId: number;
  title: string;
  year: number;
  examType: ExamType;
  teacherId: number | null;
  teacher: string | null;
  fileUrl: string;
  status: PaperStatus;
};

function mapCourse(
  data: CourseDoc,
  extras?: { paperCount?: number; years?: number[] }
): Course {
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    slug: data.slug,
    semester: data.semester,
    department: data.department,
    paperCount: extras?.paperCount,
    years: extras?.years,
  };
}

function mapPaper(data: PaperDoc): Paper {
  return {
    id: data.id,
    courseId: data.courseId,
    title: data.title,
    year: data.year,
    examType: data.examType,
    teacherId: data.teacherId ?? null,
    teacher: data.teacher ?? null,
    fileUrl: data.fileUrl,
    status: data.status,
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

async function withFirebaseFallback<T>(
  firebaseFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  if (!isFirebaseConfigured()) {
    return fallbackFn();
  }
  try {
    return await firebaseFn();
  } catch (error) {
    console.error("Firebase unavailable, using local data:", error);
    return fallbackFn();
  }
}

export async function getTeachers(): Promise<Teacher[]> {
  return getMockTeachersMerged();
}

export async function getCourses(): Promise<Course[]> {
  return withFirebaseFallback(async () => {
    const db = getDb();
    const [courseSnap, paperSnap] = await Promise.all([
      db.collection("courses").get(),
      db.collection("papers").where("status", "==", "approved").get(),
    ]);

    const papers = paperSnap.docs.map((d) => d.data() as PaperDoc);
    return courseSnap.docs
      .map((doc) => {
        const course = doc.data() as CourseDoc;
        const coursePapers = papers.filter((p) => p.courseId === course.id);
        const years = [...new Set(coursePapers.map((p) => p.year))].sort(
          (a, b) => b - a
        );
        return mapCourse(course, {
          paperCount: coursePapers.length,
          years,
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, getLocalCourses);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return withFirebaseFallback(
    async () => {
      const snap = await getDb().collection("courses").doc(slug).get();
      if (!snap.exists) return null;
      return mapCourse(snap.data() as CourseDoc);
    },
    async () => mockCourses.find((c) => c.slug === slug) ?? null
  );
}

export async function getPapersByCourseId(courseId: number): Promise<Paper[]> {
  return withFirebaseFallback(
    async () => {
      const snap = await getDb()
        .collection("papers")
        .where("courseId", "==", courseId)
        .where("status", "==", "approved")
        .get();
      return snap.docs
        .map((d) => mapPaper(d.data() as PaperDoc))
        .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
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
  return withFirebaseFallback(
    async () => {
      const snap = await getDb()
        .collection("papers")
        .where("id", "==", id)
        .where("status", "==", "approved")
        .limit(1)
        .get();
      if (snap.empty) return null;
      const paper = mapPaper(snap.docs[0].data() as PaperDoc);
      const courseSnap = await getDb()
        .collection("courses")
        .where("id", "==", paper.courseId)
        .limit(1)
        .get();
      const course = courseSnap.empty
        ? undefined
        : mapCourse(courseSnap.docs[0].data() as CourseDoc);
      return { ...paper, course };
    },
    async () => {
      const papers = await getMockPapersMerged();
      const paper = papers.find((p) => p.id === id && p.status === "approved");
      if (!paper) return null;
      const course = mockCourses.find((c) => c.id === paper.courseId);
      return { ...paper, course };
    }
  );
}

export async function addFirebasePaper(input: {
  courseId: number;
  title: string;
  year: number;
  examType: ExamType;
  fileUrl: string;
}): Promise<number> {
  const db = getDb();
  const courseSnap = await db
    .collection("courses")
    .where("id", "==", input.courseId)
    .limit(1)
    .get();
  if (courseSnap.empty) {
    throw new Error("Course not found.");
  }

  const counterRef = db.collection("meta").doc("counters");
  const nextId = await db.runTransaction(async (tx) => {
    const counter = await tx.get(counterRef);
    const current = Number(counter.data()?.nextPaperId ?? 100);
    tx.set(counterRef, { nextPaperId: current + 1 }, { merge: true });
    return current;
  });

  const paper: PaperDoc = {
    id: nextId,
    courseId: input.courseId,
    title: input.title,
    year: input.year,
    examType: input.examType,
    teacherId: null,
    teacher: null,
    fileUrl: input.fileUrl,
    status: "approved",
  };

  await db.collection("papers").doc(String(nextId)).set(paper);
  return nextId;
}
