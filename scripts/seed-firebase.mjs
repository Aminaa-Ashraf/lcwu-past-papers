/**
 * Seeds Firestore with 46 BSCS courses + existing sample papers.
 * Usage: node scripts/seed-firebase.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function readEnvLocal() {
  const raw = await fs.readFile(path.join(root, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

const courses = [
  ["Programming Fundamentals", "CS-101", "programming-fundamentals", 1],
  ["Digital Logic Design", "CS-102", "digital-logic-design", 1],
  ["Application of ICT", "GEDU-104", "application-of-ict", 1],
  ["Functional English", "GEDU-101", "functional-english", 1],
  ["Islamic Studies", "GEDU-102", "islamic-studies", 1],
  ["Object Oriented Programming", "CS-151", "object-oriented-programming", 2],
  ["Computer Organization & Assembly Language", "CS-152", "computer-organization-assembly", 2],
  ["Computer Networks", "CS-153", "computer-networks", 2],
  ["Expository Writing", "GEDU-151", "expository-writing", 2],
  ["Discrete Structures", "GEDU-154", "discrete-structures", 2],
  ["Ideology and Constitution of Pakistan", "GEDU-152", "ideology-constitution-pakistan", 2],
  ["Data Structures", "CS-201", "data-structures", 3],
  ["Artificial Intelligence", "CS-202", "artificial-intelligence", 3],
  ["Software Engineering", "CS-203", "software-engineering", 3],
  ["Applied Physics", "GEDU-205", "applied-physics", 3],
  ["Calculus and Analytic Geometry", "GEDU-202", "calculus", 3],
  ["Introduction to Management", "GEDU-237", "intro-to-management", 3],
  ["Analysis of Algorithms", "CS-251", "analysis-of-algorithms", 4],
  ["Database Systems", "CS-252", "database-systems", 4],
  ["Operating Systems", "CS-253", "operating-systems", 4],
  ["Entrepreneurship", "GEDU-251", "entrepreneurship", 4],
  ["Professional Practices", "GEDU-267", "professional-practices", 4],
  ["Civics and Community Engagement", "GEDU-252", "civics-community-engagement", 4],
  ["Pakistan Studies", "HU-112", "pakistan-studies", 4],
  ["Computer Architecture", "CS-301", "computer-architecture", 5],
  ["Advance Database Management Systems", "CS-302", "advance-database-systems", 5],
  ["Computer Graphics", "CS-321", "computer-graphics", 5],
  ["Information Security", "CS-353", "information-security", 5],
  ["Multivariable Calculus", "MATH-384", "multivariable-calculus", 5],
  ["Technical & Business Writing", "ENG-384", "technical-business-writing", 5],
  ["Theory of Automata", "CS-351", "theory-of-automata", 6],
  ["Object Oriented Analysis and Design", "CS-303", "ooad", 6],
  ["Digital Image Processing", "CS-452", "digital-image-processing", 6],
  ["Web Technologies", "CS-355", "web-technologies", 6],
  ["Probability & Statistics", "STAT-379", "probability-statistics", 6],
  ["Human Computer Interaction", "CS-404", "human-computer-interaction", 6],
  ["Compiler Construction", "CS-401", "compiler-construction", 7],
  ["Parallel and Distributed Computing", "CS-451", "parallel-distributed-computing", 7],
  ["Mobile Application Development", "CS-354", "mobile-application-development", 7],
  ["Linear Algebra", "MATH-378", "linear-algebra", 7],
  ["Internship", "CS-497", "internship", 7],
  ["Final Project (Part I)", "CS-498", "final-project-part-1", 7],
  ["Software Testing & Quality Assurance", "CS-402", "software-testing-qa", 8],
  ["Visual Programming", "CS-352", "visual-programming", 8],
  ["Introduction to Marketing", "MKT-373", "introduction-to-marketing", 8],
  ["Final Project (Part II)", "CS-499", "final-project-part-2", 8],
];

const papers = [
  [1, 17, "Introduction to Management Mid 2024", 2024, "mid", "/papers/by-course/intro-to-management-mid-2024.pdf"],
  [2, 17, "Introduction to Management Final 2024", 2024, "final", "/papers/by-course/intro-to-management-final-2024.pdf"],
  [3, 15, "Applied Physics Mid 2024", 2024, "mid", "/papers/by-course/applied-physics-mid-2024.pdf"],
  [4, 15, "Applied Physics Final 2024", 2024, "final", "/papers/by-course/applied-physics-final-2024.pdf"],
  [5, 12, "Data Structures Final Fall 2024", 2024, "final", "/papers/by-course/data-structures-final-2024.pdf"],
  [6, 16, "Calculus and Analytic Geometry Final 2025", 2025, "final", "/papers/by-course/calculus-final-2025.pdf"],
  [7, 13, "Artificial Intelligence Final Fall 2024", 2024, "final", "/papers/by-course/artificial-intelligence-final-2024.pdf"],
  [8, 23, "Civics & Community Engagement Paper", 2025, "other", "/papers/by-course/civics-paper.pdf"],
  [9, 23, "Civics & Community Engagement Mid 2025", 2025, "mid", "/papers/by-course/civics-mid-2025.pdf"],
  [10, 19, "Database Systems Mid 2025", 2025, "mid", "/papers/by-course/database-systems-mid-2025.pdf"],
  [11, 19, "Database Systems Final 2025", 2025, "final", "/papers/by-course/database-systems-final-2025.pdf"],
  [12, 20, "Operating Systems Final Spring 2025", 2025, "final", "/papers/by-course/operating-systems-final-2025.pdf"],
  [13, 24, "Pakistan Studies Final 2025", 2025, "final", "/papers/by-course/pakistan-studies-final-2025.pdf"],
  [14, 21, "Entrepreneurship Final 2025", 2025, "final", "/papers/by-course/entrepreneurship-final-2025.pdf"],
  [15, 22, "Professional Practices Final Spring 2025", 2025, "final", "/papers/by-course/professional-practices-final-2025.pdf"],
  [16, 25, "Computer Architecture Mid 2025", 2025, "mid", "/papers/by-course/computer-architecture-mid-2025.pdf"],
  [17, 25, "Computer Architecture Final", 2025, "final", "/papers/by-course/computer-architecture-final.pdf"],
  [18, 26, "Advance Database Systems Final 2025", 2025, "final", "/papers/by-course/advance-database-systems-final-2025.pdf"],
  [19, 30, "Technical and Business Writing Final", 2025, "final", "/papers/by-course/technical-business-writing-final.pdf"],
  [20, 28, "Information Security Final 2025", 2025, "final", "/papers/by-course/information-security-final-2025.pdf"],
  [21, 27, "Computer Graphics Mid 2025", 2025, "mid", "/papers/by-course/computer-graphics-mid-2025.pdf"],
];

async function main() {
  const env = await readEnvLocal();
  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  const db = getFirestore();
  const batch = db.batch();

  courses.forEach(([name, code, slug, semester], index) => {
    const ref = db.collection("courses").doc(slug);
    batch.set(ref, {
      id: index + 1,
      name,
      code,
      slug,
      semester,
      department: "Computer Science",
    });
  });

  papers.forEach(([id, courseId, title, year, examType, fileUrl]) => {
    const ref = db.collection("papers").doc(String(id));
    batch.set(ref, {
      id,
      courseId,
      title,
      year,
      examType,
      teacherId: null,
      teacher: null,
      fileUrl,
      status: "approved",
    });
  });

  batch.set(db.collection("meta").doc("counters"), { nextPaperId: 100 }, { merge: true });
  await batch.commit();
  console.log(`Seeded ${courses.length} courses and ${papers.length} papers`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
