import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

// GET /api/cart — load cart for logged-in user
export async function GET(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ items: [] });

  const rows = await query<{ items: unknown }>(
    "SELECT items FROM carts WHERE user_id = $1",
    [user.id]
  );
  return NextResponse.json({ items: rows[0]?.items ?? [] });
}

// POST /api/cart — save cart for logged-in user
export async function POST(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { items } = await request.json();
  await query(
    `INSERT INTO carts (user_id, items, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET items = $2, updated_at = NOW()`,
    [user.id, JSON.stringify(items)]
  );
  return NextResponse.json({ ok: true });
}
