import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  await query("TRUNCATE error_logs RESTART IDENTITY");
  return NextResponse.json({ ok: true });
}
