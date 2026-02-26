import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, reason, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
    }

    await query(
      `INSERT INTO contact_submissions (name, email, phone, company, reason, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, email, phone || null, company || null, reason || null, message]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
