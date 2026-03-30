'use server';

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

// ── Send reset email ────────────────────────────────────────────────────
export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!email?.trim()) return { ok: false, error: "Email is required" };

  // Look up user — always return ok to avoid email enumeration
  const users = await query<{ id: number; first_name: string; email: string }>(
    `SELECT id, first_name, email FROM users WHERE LOWER(email) = LOWER($1)`,
    [email.trim()]
  );

  if (users.length) {
    const user = users[0];

    // Invalidate any existing unused tokens
    await query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Create new token — expires in 1 hour
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt.toISOString()]
    );

    // Send email (fire and forget on error — still return ok)
    try {
      const { sendPasswordResetEmail } = await import("@/lib/email");
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.buildsupply.dev"}/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        to:        user.email,
        firstName: user.first_name,
        resetUrl,
        expiresAt: expiresAt.toLocaleString("en-US", {
          month: "short", day: "numeric",
          hour: "numeric", minute: "2-digit", timeZoneName: "short",
        }),
      });
    } catch (err) {
      console.error("[reset] email failed:", err);
    }
  }

  // Always return ok — don't leak whether email exists
  return { ok: true };
}

// ── Validate token (used on reset page load) ────────────────────────────
export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; expired?: boolean; error?: string }> {
  if (!token) return { valid: false, error: "No token provided" };

  const rows = await query<{ expires_at: string; used_at: string | null }>(
    `SELECT expires_at, used_at FROM password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (!rows.length)            return { valid: false, error: "Invalid or expired link" };
  if (rows[0].used_at)         return { valid: false, error: "This link has already been used" };
  if (new Date(rows[0].expires_at) < new Date()) return { valid: false, expired: true, error: "This link has expired" };

  return { valid: true };
}

// ── Reset password using token ──────────────────────────────────────────
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token)                     return { ok: false, error: "No token provided" };
  if (!newPassword)               return { ok: false, error: "Password is required" };
  if (newPassword.length < 8)     return { ok: false, error: "Password must be at least 8 characters" };

  const rows = await query<{
    id: number; user_id: number; expires_at: string; used_at: string | null;
  }>(
    `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1`,
    [token]
  );

  if (!rows.length)            return { ok: false, error: "Invalid or expired link" };
  if (rows[0].used_at)         return { ok: false, error: "This link has already been used" };
  if (new Date(rows[0].expires_at) < new Date()) return { ok: false, error: "This link has expired — request a new one" };

  const { id: tokenId, user_id } = rows[0];
  const hashed = await bcrypt.hash(newPassword, 12);

  // Update password, clear force_password_change if set, mark token used
  await Promise.all([
    query(
      `UPDATE users
       SET password = $1, force_password_change = FALSE, temp_password_expires_at = NULL
       WHERE id = $2`,
      [hashed, user_id]
    ),
    query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [tokenId]
    ),
  ]);

  return { ok: true };
}
