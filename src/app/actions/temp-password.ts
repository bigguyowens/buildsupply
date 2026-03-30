'use server';

import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Generates a human-readable temp password: 3 words-style chunks
// e.g. "Hawk-7291-Blue"
function generateTempPassword(): string {
  const adjectives = ["Swift","Bold","Bright","Clear","Sharp","Prime","Grand","Quick","Smart","Strong"];
  const nouns      = ["Hawk","Peak","Stone","Ridge","Forge","Gate","Crest","Bridge","Blaze","Storm"];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = String(Math.floor(1000 + Math.random() * 9000));
  return `${adj}-${num}-${noun}`;
}

export async function issueTempPassword(
  targetUserId: number
): Promise<{ ok: boolean; tempPassword?: string; error?: string }> {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const tempPassword = generateTempPassword();
  const hashed       = await bcrypt.hash(tempPassword, 12);
  const expiresAt    = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await query(
    `UPDATE users
     SET password = $1,
         force_password_change = TRUE,
         temp_password_expires_at = $2
     WHERE id = $3`,
    [hashed, expiresAt.toISOString(), targetUserId]
  );

  revalidatePath(`/admin/customers/${targetUserId}`);
  revalidatePath(`/crm/customers/${targetUserId}`);
  return { ok: true, tempPassword };
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Not logged in" };

  if (data.newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters" };
  }

  // Fetch current hashed password
  const rows = await query<{
    password: string;
    force_password_change: boolean;
    temp_password_expires_at: string | null;
  }>(
    `SELECT password, force_password_change, temp_password_expires_at FROM users WHERE id = $1`,
    [session.id]
  );
  if (!rows.length) return { ok: false, error: "User not found" };

  const user = rows[0];

  // Check temp password hasn't expired
  if (user.force_password_change && user.temp_password_expires_at) {
    if (new Date(user.temp_password_expires_at) < new Date()) {
      return { ok: false, error: "Temporary password has expired. Please contact your administrator." };
    }
  }

  // Verify current password
  const valid = await bcrypt.compare(data.currentPassword, user.password);
  if (!valid) return { ok: false, error: "Current password is incorrect" };

  // Don't allow reusing the temp password as new password
  const sameAsTemp = await bcrypt.compare(data.newPassword, user.password);
  if (sameAsTemp) {
    return { ok: false, error: "New password cannot be the same as your temporary password" };
  }

  const hashed = await bcrypt.hash(data.newPassword, 12);
  await query(
    `UPDATE users
     SET password = $1,
         force_password_change = FALSE,
         temp_password_expires_at = NULL
     WHERE id = $2`,
    [hashed, session.id]
  );

  return { ok: true };
}
