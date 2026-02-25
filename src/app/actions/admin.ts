"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  return session;
}

// ── Orders ───────────────────────────────────────────────
export async function updateOrderStatusAction(orderId: number, status: string) {
  await assertAdmin();
  const valid = ["pending", "processing", "shipped", "completed", "cancelled"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  await query("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

// ── Products ─────────────────────────────────────────────
export async function updateProductAction(
  productId: string,
  fields: { price?: number; inventory?: number; featured?: boolean }
) {
  await assertAdmin();
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (fields.price     !== undefined) { sets.push(`price = $${i++}`);     vals.push(fields.price); }
  if (fields.inventory !== undefined) { sets.push(`inventory = $${i++}`); vals.push(fields.inventory); }
  if (fields.featured  !== undefined) { sets.push(`featured = $${i++}`);  vals.push(fields.featured); }
  if (!sets.length) return;
  vals.push(productId);
  await query(`UPDATE products SET ${sets.join(", ")} WHERE id = $${i}`, vals);
  revalidatePath("/admin/products");
}
