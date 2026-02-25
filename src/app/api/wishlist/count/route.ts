import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: null }, { status: 401 });

  const rows = await query<{ count: number }>(
    `SELECT COUNT(wi.id)::int AS count
     FROM wishlist_items wi
     JOIN wishlists w ON w.id = wi.wishlist_id
     WHERE w.user_id = $1`,
    [session.id]
  );
  return NextResponse.json({ count: rows[0]?.count ?? 0 });
}
