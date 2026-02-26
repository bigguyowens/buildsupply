'use server';

import { Resend } from "resend";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactReply(
  submissionId: number,
  toEmail: string,
  toName: string,
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false, error: "Unauthorized" };

  try {
    await resend.emails.send({
      from: "BuildSupply <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="border-bottom:3px solid #f97316;padding-bottom:16px;margin-bottom:24px">
            <span style="font-size:20px;font-weight:800;color:#0f172a">
              <span style="color:#f97316">Build</span>Supply
            </span>
          </div>
          <p style="font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap">${body.replace(/\n/g, "<br/>")}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
          <p style="font-size:12px;color:#94a3b8">
            This message was sent by the BuildSupply team in response to your inquiry.<br/>
            Please reply directly to this email if you have further questions.
          </p>
        </div>
      `,
    });

    // Mark as replied
    await query(
      `UPDATE contact_submissions SET status = 'replied', updated_at = NOW() WHERE id = $1`,
      [submissionId]
    );

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
