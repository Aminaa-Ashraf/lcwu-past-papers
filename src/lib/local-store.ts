import { promises as fs } from "fs";
import path from "path";
import type { ExamType, Paper, PaperStatus, Teacher } from "./types";

/**
 * Local JSON store when Firebase is not configured.
 * Fine for laptop demos; use MySQL for production.
 */

const STORE_PATH = path.join(process.cwd(), "data", "local-store.json");

export type LocalStore = {
  teachers: Teacher[];
  papers: Paper[];
  nextTeacherId: number;
  nextPaperId: number;
};

async function readStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return {
      teachers: [],
      papers: [],
      nextTeacherId: 100,
      nextPaperId: 100,
    };
  }
}

async function writeStore(store: LocalStore): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getLocalTeachers(): Promise<Teacher[]> {
  const store = await readStore();
  return store.teachers;
}

export async function addLocalTeacher(name: string): Promise<Teacher> {
  const store = await readStore();
  const trimmed = name.trim();
  const existing = store.teachers.find(
    (t) => t.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing;

  const teacher: Teacher = { id: store.nextTeacherId, name: trimmed };
  store.teachers.push(teacher);
  store.nextTeacherId += 1;
  await writeStore(store);
  return teacher;
}

export async function getLocalPapers(): Promise<Paper[]> {
  const store = await readStore();
  return store.papers;
}

export async function addLocalPaper(input: {
  courseId: number;
  title: string;
  year: number;
  examType: ExamType;
  teacherId: number | null;
  teacher: string | null;
  fileUrl: string;
  status?: PaperStatus;
}): Promise<Paper> {
  const store = await readStore();
  const paper: Paper = {
    id: store.nextPaperId,
    courseId: input.courseId,
    title: input.title.trim(),
    year: input.year,
    examType: input.examType,
    teacherId: input.teacherId,
    teacher: input.teacher,
    fileUrl: input.fileUrl,
    status: input.status ?? "approved",
  };
  store.papers.push(paper);
  store.nextPaperId += 1;
  await writeStore(store);
  return paper;
}
