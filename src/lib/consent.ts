// lib/consent.ts — shared consent utilities (not "use server")
import { query } from "@/lib/db";

export const PRIVACY_POLICY_VERSION = "1.0"; // bump this when the policy changes

export async function getConsentStatus(userId: number) {
  const rows = await query<{
    privacy_consent: boolean;
    privacy_consent_at: string | null;
    privacy_policy_ver: string | null;
  }>(
    `SELECT privacy_consent, privacy_consent_at, privacy_policy_ver
       FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}
