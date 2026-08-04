"use client";

import { useState, useTransition } from "react";
import { addPaperAction } from "@/lib/admin";

type CourseOption = {
  id: number;
  name: string;
  code: string;
};

export function AddPaperForm({ courses }: { courses: CourseOption[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await addPaperAction(formData);
          setOk(result.ok);
          setMessage(result.message);
          if (result.ok) {
            setFileName(null);
          }
        });
      }}
    >
      <label className="form-field">
        <span>Course</span>
        <select name="courseId" required defaultValue="">
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Paper title</span>
        <input name="title" required placeholder="Paper title" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="form-field">
          <span>Year</span>
          <input
            name="year"
            type="number"
            required
            placeholder="e.g. 2025"
            min={2000}
          />
        </label>
        <label className="form-field">
          <span>Exam type</span>
          <select name="examType" required defaultValue="">
            <option value="" disabled>
              Select type
            </option>
            <option value="mid">Mid</option>
            <option value="final">Final</option>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <div className="upload-zone">
        <label className="form-field">
          <span>Upload PDF</span>
          <input
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setFileName(file ? file.name : null);
            }}
          />
        </label>
        <p className="upload-zone__hint">
          {fileName
            ? `Selected: ${fileName}`
            : "Choose a PDF from your computer (max 10 MB)."}
        </p>
      </div>

      <label className="form-field">
        <span>Admin password</span>
        <input
          name="password"
          type="password"
          required
          placeholder="Your admin password"
          autoComplete="current-password"
        />
      </label>

      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Uploading…" : "Publish paper"}
      </button>

      {message ? (
        <p className={`text-sm ${ok ? "text-accent" : "text-red-600"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
