/**
 * Creates lcwu_past_papers DB on your existing Aiven MySQL,
 * then runs schema + seed.
 *
 * Usage: node scripts/setup-aiven.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function readEnvLocal() {
  try {
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
  } catch {
    return {};
  }
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
  };
}

function splitSql(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

async function main() {
  const fileEnv = await readEnvLocal();
  const url =
    process.env.AIVEN_SETUP_URL ||
    process.env.DATABASE_URL ||
    fileEnv.DATABASE_URL;

  if (!url) {
    console.error("No DATABASE_URL found. Set it in .env.local first.");
    process.exit(1);
  }

  const base = parseMysqlUrl(url);
  const targetDb = "lcwu_past_papers";

  console.log(`Connecting to Aiven host ${base.host}:${base.port}…`);

  const admin = await mysql.createConnection({
    host: base.host,
    port: base.port,
    user: base.user,
    password: base.password,
    database: "defaultdb",
    ssl: { rejectUnauthorized: false },
  });

  await admin.query(`DROP DATABASE IF EXISTS \`${targetDb}\``);
  await admin.query(
    `CREATE DATABASE \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`Database recreated: ${targetDb}`);
  await admin.end();

  const conn = await mysql.createConnection({
    host: base.host,
    port: base.port,
    user: base.user,
    password: base.password,
    database: targetDb,
    ssl: { rejectUnauthorized: false },
  });

  const schemaSql = await fs.readFile(
    path.join(root, "sql", "schema.sql"),
    "utf8"
  );
  console.log("Running schema.sql…");
  for (const statement of splitSql(schemaSql)) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 60);
    try {
      await conn.query(statement);
      console.log(`  ok: ${preview}…`);
    } catch (err) {
      console.error(`  FAIL: ${preview}…`);
      throw err;
    }
  }

  const [tables] = await conn.query("SHOW TABLES");
  console.log(
    "Tables:",
    tables.map((r) => Object.values(r)[0]).join(", ")
  );

  const seedSql = await fs.readFile(path.join(root, "sql", "seed.sql"), "utf8");
  console.log("Running seed.sql…");
  for (const statement of splitSql(seedSql)) {
    await conn.query(statement);
  }

  const [counts] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM teachers) AS teachers,
      (SELECT COUNT(*) FROM courses) AS courses,
      (SELECT COUNT(*) FROM papers) AS papers
  `);
  console.log("Counts:", counts[0]);
  console.log(`Done. App DATABASE_URL should end with /${targetDb}`);
  await conn.end();
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
