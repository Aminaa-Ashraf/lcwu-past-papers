import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase-admin";

export async function GET() {
  if (!isFirebaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "local",
      message: "Running without Firebase credentials (local course list).",
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "firebase",
    message: "Firebase env is set.",
  });
}
