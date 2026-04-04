import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ctxCookie = req.cookies.get("bs_impersonating")?.value;

  let returnUrl = "/crm";
  let logId: number | null = null;

  if (ctxCookie) {
    try {
      const ctx = JSON.parse(ctxCookie);
      returnUrl = ctx.returnUrl ?? `/crm/customers/${ctx.targetUserId}`;
      logId = ctx.logId ?? null;
    } catch {}
  }

  // Mark impersonation session as ended
  if (logId) {
    await query(
      `UPDATE impersonation_log SET ended_at = NOW() WHERE id = $1`,
      [logId]
    ).catch(() => {}); // Non-blocking
  }

  const res = NextResponse.redirect(new URL(returnUrl, req.url));

  // Clear customer session
  res.cookies.set("bs_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Clear impersonation context
  res.cookies.set("bs_impersonating", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return res;
}
