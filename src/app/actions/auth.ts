"use server";

import { redirect } from "next/navigation";
import { createUser, verifyCredentials, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type ActionResult = {
  error?: string;
};

// ── Register ─────────────────────────────────────────────
export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName  = (formData.get("lastName")  as string)?.trim();
  const email     = (formData.get("email")     as string)?.trim();
  const password  = (formData.get("password")  as string);
  const confirm   = (formData.get("confirm")   as string);

  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  try {
    const user = await createUser(email, password, firstName, lastName);
    await setSessionCookie(user);
  } catch (err) {
    await logger.warn("Registration failed", { source: "auth/register", context: { email } });
    return { error: err instanceof Error ? err.message : "Registration failed." };
  }

  redirect("/account");
}

// ── Login ─────────────────────────────────────────────────
export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email    = (formData.get("email")    as string)?.trim();
  const password = (formData.get("password") as string);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let role = "";
  let forceChange = false;
  try {
    const user = await verifyCredentials(email, password);
    await setSessionCookie(user);
    role = user.role;
    forceChange = user.forcePasswordChange;
  } catch (err) {
    await logger.warn("Login failed", { source: "auth/login", context: { email } });
    return { error: err instanceof Error ? err.message : "Login failed." };
  }

  // Force password change takes priority over all redirects
  if (forceChange) redirect("/change-password");

  // Normal role-based redirect
  if (role === "admin")                                 redirect("/admin");
  if (role === "account_manager" || role === "manager") redirect("/crm");
  redirect("/account");
}

// ── Logout ────────────────────────────────────────────────
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
