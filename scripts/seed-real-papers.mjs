/**
 * Seeds Session 2023-2027 courses + per-course PDF papers.
 * Teacher names left NULL — add later from /admin.
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

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

function parseMysqlUrl(urlString) {
  const cleaned = urlString
    .replace(/[?&]ssl-mode=[^&]*/gi, "")
    .replace(/[?&]sslmode=[^&]*/gi, "");
  const u = new URL(cleaned);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "lcwu_past_papers",
  };
}

const courses = [
  // Semester 3
  ["Introduction to Management", "MGT-203", "intro-to-management", 3],
  ["Applied Physics", "GEDU-205", "applied-physics", 3],
  ["Data Structures and Algorithms", "CS-202", "data-structures", 3],
  ["Calculus and Analytical Geometry", "GEDU-202", "calculus", 3],
  ["Artificial Intelligence", "CS-301", "artificial-intelligence", 3],
  // Semester 4
  ["Civics & Community Engagement", "GEDU-2XX", "civics-community-engagement", 4],
  ["Database Systems", "CS-302", "database-systems", 4],
  ["Operating Systems", "CS-303", "operating-systems", 4],
  ["Pakistan Studies", "GEDU-239", "pakistan-studies", 4],
  ["Entrepreneurship", "GEDU-251", "entrepreneurship", 4],
  ["Professional Practices", "CS-304", "professional-practices", 4],
  // Semester 5
  ["Computer Architecture", "CS-401", "computer-architecture", 5],
  ["Advance Database Systems", "CS-402", "advance-database-systems", 5],
  ["Technical and Business Writing", "ENG-384", "technical-business-writing", 5],
  ["Information Security", "CS-425", "information-security", 5],
  ["Computer Graphics", "CS-405", "computer-graphics", 5],
];

const aliases = [
  ["intro-to-management", ["management", "intro management"]],
  ["applied-physics", ["physics", "ap"]],
  ["data-structures", ["dsa", "ds", "data structures"]],
  ["calculus", ["calc", "analytical geometry"]],
  ["artificial-intelligence", ["ai"]],
  ["civics-community-engagement", ["civics", "cce"]],
  ["database-systems", ["db", "dbms", "database"]],
  ["operating-systems", ["os"]],
  ["pakistan-studies", ["pak studies", "ps"]],
  ["entrepreneurship", ["ent", "gedu-251"]],
  ["professional-practices", ["pp", "professional practice"]],
  ["computer-architecture", ["ca", "architecture"]],
  ["advance-database-systems", ["adv db", "advanced database", "adbms"]],
  ["technical-business-writing", ["tbw", "technical writing", "business writing"]],
  ["information-security", ["is", "info sec", "security"]],
  ["computer-graphics", ["cg", "graphics"]],
];

/** One PDF per paper (split from semester packs). Teacher = null. */
const papers = [
  ["intro-to-management", "Introduction to Management Mid 2024", 2024, "mid", "/papers/by-course/intro-to-management-mid-2024.pdf"],
  ["intro-to-management", "Introduction to Management Final 2024", 2024, "final", "/papers/by-course/intro-to-management-final-2024.pdf"],
  ["applied-physics", "Applied Physics Mid 2024", 2024, "mid", "/papers/by-course/applied-physics-mid-2024.pdf"],
  ["applied-physics", "Applied Physics Final 2024", 2024, "final", "/papers/by-course/applied-physics-final-2024.pdf"],
  ["data-structures", "Data Structures and Algorithms Final Fall 2024", 2024, "final", "/papers/by-course/data-structures-final-2024.pdf"],
  ["calculus", "Calculus and Analytical Geometry Final 2025", 2025, "final", "/papers/by-course/calculus-final-2025.pdf"],
  ["artificial-intelligence", "Artificial Intelligence Final Fall 2024", 2024, "final", "/papers/by-course/artificial-intelligence-final-2024.pdf"],

  ["civics-community-engagement", "Civics & Community Engagement Paper", 2025, "other", "/papers/by-course/civics-paper.pdf"],
  ["civics-community-engagement", "Civics & Community Engagement Mid 2025", 2025, "mid", "/papers/by-course/civics-mid-2025.pdf"],
  ["database-systems", "Database Systems Mid 2025", 2025, "mid", "/papers/by-course/database-systems-mid-2025.pdf"],
  ["database-systems", "Database Systems Final 2025", 2025, "final", "/papers/by-course/database-systems-final-2025.pdf"],
  ["operating-systems", "Operating Systems Final Spring 2025", 2025, "final", "/papers/by-course/operating-systems-final-2025.pdf"],
  ["pakistan-studies", "Pakistan Studies Final 2025", 2025, "final", "/papers/by-course/pakistan-studies-final-2025.pdf"],
  ["entrepreneurship", "Entrepreneurship Final 2025", 2025, "final", "/papers/by-course/entrepreneurship-final-2025.pdf"],
  ["professional-practices", "Professional Practices Final Spring 2025", 2025, "final", "/papers/by-course/professional-practices-final-2025.pdf"],

  ["computer-architecture", "Computer Architecture Mid 2025", 2025, "mid", "/papers/by-course/computer-architecture-mid-2025.pdf"],
  ["computer-architecture", "Computer Architecture Final", 2025, "final", "/papers/by-course/computer-architecture-final.pdf"],
  ["advance-database-systems", "Advance Database Systems Final 2025", 2025, "final", "/papers/by-course/advance-database-systems-final-2025.pdf"],
  ["technical-business-writing", "Technical and Business Writing Final", 2025, "final", "/papers/by-course/technical-business-writing-final.pdf"],
  ["information-security", "Information Security Final 2025", 2025, "final", "/papers/by-course/information-security-final-2025.pdf"],
  ["computer-graphics", "Computer Graphics Mid 2025", 2025, "mid", "/papers/by-course/computer-graphics-mid-2025.pdf"],
];

async function main() {
  const env = await readEnvLocal();
  const cfg = parseMysqlUrl(env.DATABASE_URL);
  const conn = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to", cfg.database);

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  await conn.query("TRUNCATE TABLE papers");
  await conn.query("TRUNCATE TABLE course_aliases");
  await conn.query("TRUNCATE TABLE courses");
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");

  for (const [name, code, slug, semester] of courses) {
    await conn.query(
      `INSERT INTO courses (name, code, slug, semester, department)
       VALUES (?, ?, ?, ?, 'Computer Science')`,
      [name, code, slug, semester]
    );
  }

  const [courseRows] = await conn.query(`SELECT id, slug FROM courses`);
  const idBySlug = Object.fromEntries(courseRows.map((r) => [r.slug, r.id]));

  for (const [slug, list] of aliases) {
    const courseId = idBySlug[slug];
    for (const alias of list) {
      await conn.query(
        `INSERT INTO course_aliases (course_id, alias) VALUES (?, ?)`,
        [courseId, alias]
      );
    }
  }

  for (const [slug, title, year, examType, fileUrl] of papers) {
    await conn.query(
      `INSERT INTO papers
        (course_id, title, year, exam_type, teacher_id, teacher, file_url, status)
       VALUES (?, ?, ?, ?, NULL, NULL, ?, 'approved')`,
      [idBySlug[slug], title, year, examType, fileUrl]
    );
  }

  const [counts] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM courses) AS courses,
      (SELECT COUNT(*) FROM papers) AS papers
  `);
  console.log("Seeded:", counts[0]);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
