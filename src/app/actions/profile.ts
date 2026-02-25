"use server";

import { query } from "@/lib/db";
import { getSession, setSessionCookie, verifyCredentials } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ProfileResult = { success?: string; error?: string };

// ── Update name / email ──────────────────────────────────
export async function updateProfileAction(
  _prev: ProfileResult,
  formData: FormData
): Promise<ProfileResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName  = (formData.get("lastName")  as string)?.trim();
  const email     = (formData.get("email")     as string)?.trim().toLowerCase();

  if (!firstName || !lastName || !email) return { error: "All fields are required." };

  // Check email not already taken by another user
  const existing = await query<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2",
    [email, session.id]
  );
  if (existing.length) return { error: "That email is already in use." };

  const rows = await query<{ id: number; email: string; first_name: string; last_name: string; role: string }>(
    `UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, first_name, last_name, role`,
    [firstName, lastName, email, session.id]
  );

  // Refresh the session cookie with updated info
  await setSessionCookie({
    id: rows[0].id,
    email: rows[0].email,
    firstName: rows[0].first_name,
    lastName: rows[0].last_name,
    role: rows[0].role,
  });

  revalidatePath("/account/profile");
  return { success: "Profile updated successfully." };
}

// ── Change password ──────────────────────────────────────
export async function changePasswordAction(
  _prev: ProfileResult,
  formData: FormData
): Promise<ProfileResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const current = formData.get("current")  as string;
  const newPass  = formData.get("newPass")  as string;
  const confirm  = formData.get("confirm")  as string;

  if (!current || !newPass || !confirm) return { error: "All fields are required." };
  if (newPass.length < 8) return { error: "New password must be at least 8 characters." };
  if (newPass !== confirm) return { error: "Passwords do not match." };

  // Verify current password
  try {
    await verifyCredentials(session.email, current);
  } catch {
    return { error: "Current password is incorrect." };
  }

  const hashed = await bcrypt.hash(newPass, 12);
  await query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [hashed, session.id]);

  return { success: "Password changed successfully." };
}
