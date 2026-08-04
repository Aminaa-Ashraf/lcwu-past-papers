import { NextResponse } from "next/server";
import { isDatabaseConfigured, testConnection } from "@/lib/db";

/**
 * GET /api/health — quick check that the app / database are reachable.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message: "Running without DATABASE_URL (sample data mode).",
    });
  }

  try {
    await testConnection();
    return NextResponse.json({
      ok: true,
      mode: "mysql",
      message: "Database connection OK.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, mode: "mysql", message },
      { status: 500 }
    );
  }
}
