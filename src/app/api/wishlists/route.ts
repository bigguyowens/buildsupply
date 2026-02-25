import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json([]);

  const rows = await query<{ id: number; name: string; item_count: number }>(
    `SELECT w.id, w.name, COUNT(wi.id)::int AS item_count
     FROM wishlists w
     LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
     WHERE w.user_id = $1
     GROUP BY w.id ORDER BY w.created_at ASC`,
    [user.id]
  );
  return NextResponse.json(rows);
}
