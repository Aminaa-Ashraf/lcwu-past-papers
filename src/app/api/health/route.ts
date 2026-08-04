import { NextResponse } from "next/server";
import { isDatabaseConfigured, testConnection } from "@/lib/db";

/**
 * GET /api/health
 * Confirms whether the app is using mock data or a live MySQL connection.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      message:
        "Using dummy data. Set DATABASE_URL and USE_MOCK_DATA=false to connect Aiven.",
    });
  }

  try {
    await testConnection();
    return NextResponse.json({
      ok: true,
      mode: "mysql",
      message: "SELECT 1 succeeded — Aiven MySQL is connected.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, mode: "mysql", message },
      { status: 500 }
    );
  }
}
