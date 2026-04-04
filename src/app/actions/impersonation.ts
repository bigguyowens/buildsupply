'use server';

import crypto from "crypto";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function createImpersonationToken(
  targetUserId: number
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  // Verify target is a real customer (not another staff member)
  const targets = await query<{ id: number; first_name: string; last_name: string; role: string }>(
    `SELECT id, first_name, last_name, role FROM users WHERE id = $1`,
    [targetUserId]
  );
  if (!targets.length) return { ok: false, error: "User not found" };
  const target = targets[0];

  // Only allow impersonating actual customers
  if (["admin", "account_manager", "manager"].includes(target.role)) {
    return { ok: false, error: "Cannot impersonate staff members" };
  }

  // Invalidate any existing unused tokens for this target by this user
  await query(
    `UPDATE impersonation_tokens SET used_at = NOW()
     WHERE created_by = $1 AND target_user_id = $2 AND used_at IS NULL`,
    [session.id, targetUserId]
  );

  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await query(
    `INSERT INTO impersonation_tokens (token, target_user_id, created_by, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [token, targetUserId, session.id, expiresAt.toISOString()]
  );

  return { ok: true, token };
}
