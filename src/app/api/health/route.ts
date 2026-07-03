import { NextResponse } from "next/server";

export function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return NextResponse.json({
    service: "taxiro-web",
    status: configured ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
    checks: { publicDatabaseConfiguration: configured },
  }, { status: configured ? 200 : 503 });
}
