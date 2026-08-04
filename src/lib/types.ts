export type ExamType = "mid" | "final" | "quiz" | "assignment" | "other";
export type PaperStatus = "pending" | "approved" | "rejected";

export type Teacher = {
  id: number;
  name: string;
};

export type Course = {
  id: number;
  name: string;
  code: string;
  slug: string;
  /** Optional metadata only — not used for browsing (sessions differ). */
  semester: number;
  department: string;
  paperCount?: number;
  /** Exam years available for this course, newest first */
  years?: number[];
};

export type Paper = {
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
