"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMyCompany() {
  const session = await getSession();
  if (!session) return null;

  const rows = await query<{
    id: number; name: string; domain: string | null; industry: string | null;
    phone: string | null; city: string | null; state: string | null;
    account_manager_name: string | null;
  }>(
    `SELECT c.id, c.name, c.domain, c.industry, c.phone, c.city, c.state,
            am.first_name || ' ' || am.last_name AS account_manager_name
     FROM companies c
     LEFT JOIN users am ON am.id = c.account_manager_id
     WHERE c.id = (SELECT company_id FROM users WHERE id = $1)`,
    [session.id]
  );
  return rows[0] ?? null;
}

export async function getMyCompanyMembers() {
  const session = await getSession();
  if (!session) return [];

  return query<{ id: number; first_name: string; last_name: string; email: string; role: string; created_at: string }>(
    `SELECT id, first_name, last_name, email, role, created_at
     FROM users
     WHERE company_id = (SELECT company_id FROM users WHERE id = $1)
     ORDER BY role DESC, first_name ASC`,
    [session.id]
  );
}

export async function updateMemberRole(memberId: number, role: "customer" | "company_admin") {
  const session = await getSession();
  if (!session || session.role !== "company_admin") return { error: "Unauthorized" };

  // Ensure target is in same company
  const rows = await query<{ company_id: number }>(
    "SELECT company_id FROM users WHERE id = $1",
    [memberId]
  );
  const myCompany = await query<{ company_id: number }>(
    "SELECT company_id FROM users WHERE id = $1",
    [session.id]
  );
  if (!rows.length || rows[0].company_id !== myCompany[0]?.company_id) {
    return { error: "Cannot manage users outside your company" };
  }

  await query("UPDATE users SET role = $1 WHERE id = $2", [role, memberId]);
  revalidatePath("/account/company");
  return { ok: true };
}
