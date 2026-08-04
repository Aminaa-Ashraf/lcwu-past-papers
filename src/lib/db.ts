import mysql, { type Pool, type QueryResult, type RowDataPacket } from "mysql2/promise";

/**
 * Aiven MySQL pool for Next.js.
 * Free-tier connections often drop idle — we retry once after reset.
 */

let pool: Pool | null = null;

function hasMysqlEnv(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      process.env.MYSQL_PASSWORD &&
      process.env.MYSQL_DATABASE
  );
}

export function isDatabaseConfigured(): boolean {
  if (process.env.USE_MOCK_DATA === "true") return false;
  const url = process.env.DATABASE_URL?.trim();
  return Boolean(url) || hasMysqlEnv();
}

function sslConfig() {
  const ca = process.env.AIVEN_CA_CERT?.replace(/\\n/g, "\n");
  if (ca) {
    return { ca, rejectUnauthorized: true as const };
  }
  return {
    rejectUnauthorized: process.env.DATABASE_SSL_STRICT === "true",
  };
}

function cleanDatabaseUrl(raw: string): string {
  return raw
    .replace(/[?&]ssl-mode=[^&]*/gi, "")
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

const poolExtras = {
  waitForConnections: true,
  connectionLimit: 3,
  maxIdle: 1,
  idleTimeout: 30_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
} as const;

function createPool(): Pool {
  const ssl = sslConfig();

  if (hasMysqlEnv()) {
    return mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl,
      ...poolExtras,
    });
  }

  return mysql.createPool({
    uri: cleanDatabaseUrl(process.env.DATABASE_URL!.trim()),
    ssl,
    ...poolExtras,
  });
}

export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Database not configured. Set DATABASE_URL in .env.local and USE_MOCK_DATA=false."
    );
  }
  if (!pool) pool = createPool();
  return pool;
}

async function resetPool() {
  const old = pool;
  pool = null;
  if (old) {
    try {
      await old.end();
    } catch {
      // ignore close errors on a dead pool
    }
  }
}

function isRetryableDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  const code = err.code ?? "";
  const message = err.message ?? "";
  return (
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR" ||
    message.includes("ECONNRESET") ||
    message.includes("Connection lost") ||
    message.includes("Pool is closed")
  );
}

/** Run a query; on dropped Aiven connection, recreate pool and retry once. */
export async function dbQuery<T extends QueryResult = RowDataPacket[]>(
  sql: string,
  params?: unknown[]
): Promise<[T, mysql.FieldPacket[]]> {
  try {
    return await getPool().query<T>(sql, params);
  } catch (error) {
    if (!isRetryableDbError(error)) throw error;
    await resetPool();
    return getPool().query<T>(sql, params);
  }
}

export async function testConnection(): Promise<boolean> {
  const [rows] = await dbQuery<RowDataPacket[]>("SELECT 1 AS ok");
  return Array.isArray(rows) && rows.length > 0;
}
