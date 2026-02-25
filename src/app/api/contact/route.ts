import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, subject, message, reason } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
    }

    // Log to DB so admin can see inquiries
    await query(
      `INSERT INTO error_logs (level, source, message, context, url)
       VALUES ('info', 'contact-form', $1, $2, '/contact')`,
      [
        `Contact form: ${subject || reason || "General Inquiry"} from ${name} <${email}>`,
        JSON.stringify({ name, email, phone, company, subject, message, reason, submittedAt: new Date().toISOString() }),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
