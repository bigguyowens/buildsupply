import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.cookies.get("bs_token")?.value;
    const user  = token ? verifyToken(token) : null;

    await logError({
      level:   body.level   ?? "error",
      source:  body.source  ?? "client",
      message: body.message ?? "Unknown error",
      stack:   body.stack,
      context: body.context,
      url:     body.url ?? request.headers.get("referer") ?? undefined,
      user_id: user?.id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
