'use server';

import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendContactReplyEmail } from "@/lib/email";

export async function sendContactReply(
  submissionId: number,
  toEmail: string,
  _toName: string,
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !["admin", "account_manager"].includes(session.role)) return { ok: false, error: "Unauthorized" };

  try {
    await sendContactReplyEmail(toEmail, subject, body);

    await query(
      `UPDATE contact_submissions SET status = 'replied', updated_at = NOW() WHERE id = $1`,
      [submissionId]
    );

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
