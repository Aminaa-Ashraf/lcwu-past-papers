"use server";

import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { dbQuery, isDatabaseConfigured } from "./db";
import { addLocalPaper } from "./local-store";
import type { ExamType } from "./types";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "papers", "uploads");

function assertAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("ADMIN_PASSWORD is not set in .env.local");
  }
  if (password !== expected) {
    throw new Error("Wrong admin password");
  }
}

function sanitizeBaseName(name: string) {
  return name
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function savePdfUpload(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Please choose a PDF file.");
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are allowed.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF must be 10 MB or smaller.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // Basic PDF magic check
  if (bytes.subarray(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("Invalid PDF file.");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const base = sanitizeBaseName(file.name) || "paper";
  const stamp = randomBytes(4).toString("hex");
  const filename = `${base}-${stamp}.pdf`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/papers/uploads/${filename}`;
}

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function addPaperAction(formData: FormData): Promise<ActionResult> {
  try {
    assertAdmin(String(formData.get("password") ?? ""));

    const courseId = Number(formData.get("courseId"));
    const title = String(formData.get("title") ?? "").trim();
    const year = Number(formData.get("year"));
    const examType = String(formData.get("examType") ?? "") as ExamType;
    const pdf = formData.get("pdf");

    if (!courseId || !title || !year || !examType) {
      return {
        ok: false,
        message: "Course, title, year, and exam type are required.",
      };
    }

    if (!(pdf instanceof File)) {
      return { ok: false, message: "Please upload a PDF file." };
    }

    const fileUrl = await savePdfUpload(pdf);

    if (!isDatabaseConfigured()) {
      await addLocalPaper({
        courseId,
        title,
        year,
        examType,
        teacherId: null,
        teacher: null,
        fileUrl,
        status: "approved",
      });
    } else {
      await dbQuery(
        `INSERT INTO papers
          (course_id, title, year, exam_type, teacher_id, teacher, file_url, status)
         VALUES (?, ?, ?, ?, NULL, NULL, ?, 'approved')`,
        [courseId, title, year, examType, fileUrl]
      );
    }

    revalidatePath("/", "layout");
    return { ok: true, message: `Paper “${title}” published.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to add paper.",
    };
  }
}
