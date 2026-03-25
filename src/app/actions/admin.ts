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
  await query(
    `UPDATE orders
     SET status = $1,
         updated_at = NOW(),
         status_history = status_history || $2::jsonb
     WHERE id = $3`,
    [status, JSON.stringify([{ status, timestamp: new Date().toISOString() }]), orderId]
  );
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
}

// ── Products ─────────────────────────────────────────────
export async function updateProductAction(
  productId: string,
  fields: {
    price?: number; inventory?: number; featured?: boolean;
    name?: string; description?: string; category?: string; subcategory?: string;
    brand?: string; sku?: string; currency?: string; unit?: string;
    tags?: string[]; image?: string; gallery?: string[];
    rating?: number; ratingCount?: number;
  }
) {
  await assertAdmin();
  const colMap: Record<string, string> = {
    price: "price", inventory: "inventory", featured: "featured",
    name: "name", description: "description", category: "category",
    subcategory: "subcategory", brand: "brand", sku: "sku",
    currency: "currency", unit: "unit", image: "image",
    rating: "rating", ratingCount: "rating_count",
  };
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  for (const [key, col] of Object.entries(colMap)) {
    if (fields[key as keyof typeof fields] !== undefined) {
      sets.push(`${col} = $${i++}`);
      vals.push(fields[key as keyof typeof fields]);
    }
  }
  if (fields.tags    !== undefined) { sets.push(`tags = $${i++}`);    vals.push(JSON.stringify(fields.tags)); }
  if (fields.gallery !== undefined) { sets.push(`gallery = $${i++}`); vals.push(JSON.stringify(fields.gallery)); }
  if (!sets.length) return;
  vals.push(productId);
  await query(`UPDATE products SET ${sets.join(", ")} WHERE id = $${i}`, vals);
  revalidatePath("/admin/products");
}
