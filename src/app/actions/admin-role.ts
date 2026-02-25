"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleAdminRoleAction(userId: number, makeAdmin: boolean) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  if (session.id === userId) throw new Error("Cannot change your own role");

  const newRole = makeAdmin ? "admin" : "customer";
  await query("UPDATE users SET role = $1 WHERE id = $2", [newRole, userId]);
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
}
