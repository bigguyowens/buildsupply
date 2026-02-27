import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/app/actions/promotions";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ ok: false, error: "No code provided." }, { status: 400 });
  const session = await getSession();
  const result = await validatePromoCode(code, session?.id);
  return NextResponse.json(result);
}
