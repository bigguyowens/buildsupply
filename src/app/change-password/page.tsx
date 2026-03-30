import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { ChangePasswordClient } from "./change-password-client";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Check if this is a forced change
  const rows = await query<{ force_password_change: boolean; temp_password_expires_at: string | null }>(
    `SELECT force_password_change, temp_password_expires_at FROM users WHERE id = $1`,
    [session.id]
  );
  const forced   = rows[0]?.force_password_change ?? false;
  const expiresAt = rows[0]?.temp_password_expires_at ?? null;

  // If not forced and they navigate here manually, redirect them to their home
  // (they can still change password from account settings)
  // We'll allow voluntary access too — just don't force redirect if not needed

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <ChangePasswordClient
      forced={forced}
      isExpired={isExpired}
      expiresAt={expiresAt}
      userRole={session.role}
    />
  );
}
