'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  reason: string | null;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  notes: string | null;
  created_at: string;
};

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  await assertAdmin();
  return query<ContactSubmission>(
    `SELECT id, name, email, phone, company, reason, message, status, notes, created_at
     FROM contact_submissions ORDER BY created_at DESC`
  );
}

export async function updateSubmissionStatus(
  id: number,
  status: string,
  notes?: string
): Promise<void> {
  await assertAdmin();
  await query(
    `UPDATE contact_submissions
     SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
     WHERE id = $3`,
    [status, notes ?? null, id]
  );
}
