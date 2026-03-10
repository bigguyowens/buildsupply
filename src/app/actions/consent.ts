"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { PRIVACY_POLICY_VERSION } from "@/lib/consent";

/**
 * Record consent for the currently logged-in user.
 * Called from the ConsentBanner after user clicks "Accept".
 */
export async function recordConsent() {
  const session = await getSession();
  if (!session) return { ok: false, reason: "not_logged_in" };

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  await query(
    `UPDATE users
        SET privacy_consent    = TRUE,
            privacy_consent_at = NOW(),
            privacy_consent_ip = $2,
            privacy_policy_ver = $3
      WHERE id = $1`,
    [session.id, ip, PRIVACY_POLICY_VERSION]
  );

  return { ok: true };
}
