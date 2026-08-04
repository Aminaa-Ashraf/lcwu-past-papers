/**
 * Seeds all 46 BSCS 2023-27 courses from LCWU CS scheme of study.
 * Remaps existing papers to the new course rows by slug.
 *
 * Usage: node scripts/seed-all-courses.mjs
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

/** [name, code, slug, semester] */
const courses = [
  // Semester I
  ["Programming Fundamentals", "CS-101", "programming-fundamentals", 1],
  ["Digital Logic Design", "CS-102", "digital-logic-design", 1],
  ["Application of ICT", "GEDU-104", "application-of-ict", 1],
  ["Functional English", "GEDU-101", "functional-english", 1],
  ["Islamic Studies", "GEDU-102", "islamic-studies", 1],
  // Semester II
  ["Object Oriented Programming", "CS-151", "object-oriented-programming", 2],
  ["Computer Organization & Assembly Language", "CS-152", "computer-organization-assembly", 2],
  ["Computer Networks", "CS-153", "computer-networks", 2],
  ["Expository Writing", "GEDU-151", "expository-writing", 2],
  ["Discrete Structures", "GEDU-154", "discrete-structures", 2],
  ["Ideology and Constitution of Pakistan", "GEDU-152", "ideology-constitution-pakistan", 2],
  // Semester III
  ["Data Structures", "CS-201", "data-structures", 3],
  ["Artificial Intelligence", "CS-202", "artificial-intelligence", 3],
  ["Software Engineering", "CS-203", "software-engineering", 3],
  ["Applied Physics", "GEDU-205", "applied-physics", 3],
  ["Calculus and Analytic Geometry", "GEDU-202", "calculus", 3],
  ["Introduction to Management", "GEDU-237", "intro-to-management", 3],
  // Semester IV
  ["Analysis of Algorithms", "CS-251", "analysis-of-algorithms", 4],
  ["Database Systems", "CS-252", "database-systems", 4],
  ["Operating Systems", "CS-253", "operating-systems", 4],
  ["Entrepreneurship", "GEDU-251", "entrepreneurship", 4],
  ["Professional Practices", "GEDU-267", "professional-practices", 4],
  ["Civics and Community Engagement", "GEDU-252", "civics-community-engagement", 4],
  ["Pakistan Studies", "HU-112", "pakistan-studies", 4],
  // Semester V
  ["Computer Architecture", "CS-301", "computer-architecture", 5],
  ["Advance Database Management Systems", "CS-302", "advance-database-systems", 5],
  ["Computer Graphics", "CS-321", "computer-graphics", 5],
  ["Information Security", "CS-353", "information-security", 5],
  ["Multivariable Calculus", "MATH-384", "multivariable-calculus", 5],
  ["Technical & Business Writing", "ENG-384", "technical-business-writing", 5],
  // Semester VI
  ["Theory of Automata", "CS-351", "theory-of-automata", 6],
  ["Object Oriented Analysis and Design", "CS-303", "ooad", 6],
  ["Digital Image Processing", "CS-452", "digital-image-processing", 6],
  ["Web Technologies", "CS-355", "web-technologies", 6],
  ["Probability & Statistics", "STAT-379", "probability-statistics", 6],
  ["Human Computer Interaction", "CS-404", "human-computer-interaction", 6],
  // Semester VII
  ["Compiler Construction", "CS-401", "compiler-construction", 7],
  ["Parallel and Distributed Computing", "CS-451", "parallel-distributed-computing", 7],
  ["Mobile Application Development", "CS-354", "mobile-application-development", 7],
  ["Linear Algebra", "MATH-378", "linear-algebra", 7],
  ["Internship", "CS-497", "internship", 7],
  ["Final Project (Part I)", "CS-498", "final-project-part-1", 7],
  // Semester VIII
  ["Software Testing & Quality Assurance", "CS-402", "software-testing-qa", 8],
  ["Visual Programming", "CS-352", "visual-programming", 8],
  ["Introduction to Marketing", "MKT-373", "introduction-to-marketing", 8],
  ["Final Project (Part II)", "CS-499", "final-project-part-2", 8],
];

const aliases = {
  "programming-fundamentals": ["pf", "programming"],
  "digital-logic-design": ["dld", "logic design"],
  "application-of-ict": ["ict", "aic"],
  "functional-english": ["english", "fe"],
  "islamic-studies": ["islamiyat", "is"],
  "object-oriented-programming": ["oop", "oops"],
  "computer-organization-assembly": ["coa", "assembly"],
  "computer-networks": ["cn", "networks"],
  "expository-writing": ["ew"],
  "discrete-structures": ["ds", "discrete", "qr1"],
  "ideology-constitution-pakistan": ["ideology", "constitution"],
  "data-structures": ["dsa", "data structure"],
  "artificial-intelligence": ["ai"],
  "software-engineering": ["se"],
  "applied-physics": ["physics", "ap"],
  calculus: ["calc", "analytic geometry", "qr2"],
  "intro-to-management": ["management", "itm"],
  "analysis-of-algorithms": ["aoa", "algorithms"],
  "database-systems": ["db", "dbms", "database"],
  "operating-systems": ["os"],
  entrepreneurship: ["ent"],
  "professional-practices": ["pp"],
  "civics-community-engagement": ["civics", "cce"],
  "pakistan-studies": ["pak studies", "ps"],
  "computer-architecture": ["ca", "architecture"],
  "advance-database-systems": ["adv db", "adbms", "advanced database"],
  "computer-graphics": ["cg", "graphics"],
  "information-security": ["is", "info sec", "security"],
  "multivariable-calculus": ["mvc", "multi calc"],
  "technical-business-writing": ["tbw", "technical writing"],
  "theory-of-automata": ["toa", "automata"],
  ooad: ["object oriented analysis"],
  "digital-image-processing": ["dip", "image processing"],
  "web-technologies": ["web", "wt"],
  "probability-statistics": ["stats", "probability"],
  "human-computer-interaction": ["hci"],
  "compiler-construction": ["compiler", "cc"],
  "parallel-distributed-computing": ["pdc", "parallel computing"],
  "mobile-application-development": ["mad", "mobile app"],
  "linear-algebra": ["la"],
  internship: ["intern"],
  "final-project-part-1": ["fyp1", "project 1"],
  "software-testing-qa": ["stqa", "software testing"],
  "visual-programming": ["vp"],
  "introduction-to-marketing": ["marketing"],
  "final-project-part-2": ["fyp2", "project 2"],
};

/** Old slug -> new slug (for remapping papers already in DB) */
const slugRemap = {
  calculus: "calculus",
  "intro-to-management": "intro-to-management",
  "applied-physics": "applied-physics",
  "data-structures": "data-structures",
  "artificial-intelligence": "artificial-intelligence",
  "civics-community-engagement": "civics-community-engagement",
  "database-systems": "database-systems",
  "operating-systems": "operating-systems",
  "pakistan-studies": "pakistan-studies",
  entrepreneurship: "entrepreneurship",
  "professional-practices": "professional-practices",
  "computer-architecture": "computer-architecture",
  "advance-database-systems": "advance-database-systems",
  "technical-business-writing": "technical-business-writing",
  "information-security": "information-security",
  "computer-graphics": "computer-graphics",
};

async function main() {
  if (courses.length !== 46) {
    throw new Error(`Expected 46 courses, got ${courses.length}`);
  }

  const env = await readEnvLocal();
  const cfg = parseMysqlUrl(env.DATABASE_URL);
  const conn = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to", cfg.database);

  // Remember papers by old course slug
  const [paperRows] = await conn.query(`
    SELECT p.id, c.slug AS old_slug
    FROM papers p
    JOIN courses c ON c.id = p.course_id
  `);

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
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

  for (const [slug, list] of Object.entries(aliases)) {
    const courseId = idBySlug[slug];
    if (!courseId) continue;
    for (const alias of list) {
      await conn.query(
        `INSERT INTO course_aliases (course_id, alias) VALUES (?, ?)`,
        [courseId, alias]
      );
    }
  }

  // Remap existing papers to new course ids
  let remapped = 0;
  for (const row of paperRows) {
    const newSlug = slugRemap[row.old_slug] || row.old_slug;
    const newId = idBySlug[newSlug];
    if (!newId) {
      console.warn(`No mapping for paper #${row.id} (old slug: ${row.old_slug})`);
      continue;
    }
    await conn.query(`UPDATE papers SET course_id = ? WHERE id = ?`, [
      newId,
      row.id,
    ]);
    remapped += 1;
  }

  const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM courses`);
  console.log(`Courses: ${n}`);
  console.log(`Papers remapped: ${remapped}`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
