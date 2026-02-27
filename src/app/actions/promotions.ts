'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type Promotion = {
  id:               number;
  code:             string;
  description:      string;
  discount_percent: number;
  max_uses:         number | null;
  used_count:       number;
  one_per_customer: boolean;
  expires_at:       string | null;
  active:           boolean;
  created_at:       string;
};

export type PromoUse = {
  id:           number;
  promotion_id: number;
  user_id:      number | null;
  order_id:     number | null;
  used_at:      string;
  user_email:   string | null;
  user_name:    string | null;
};

export type ValidatedPromo = {
  id:               number;
  code:             string;
  discount_percent: number;
  description:      string;
};

// ── Public: validate a promo code ──────────────────────────────────────────
export async function validatePromoCode(
  code: string,
  userId?: number
): Promise<{ ok: boolean; promo?: ValidatedPromo; error?: string }> {
  const rows = await query<Promotion>(
    `SELECT * FROM promotions WHERE UPPER(code) = UPPER($1) LIMIT 1`,
    [code.trim()]
  );
  if (!rows.length) return { ok: false, error: "Invalid promo code." };

  const promo = rows[0];
  if (!promo.active)                                      return { ok: false, error: "This code is no longer active." };
  if (promo.expires_at && new Date(promo.expires_at) < new Date())
                                                          return { ok: false, error: "This code has expired." };
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
                                                          return { ok: false, error: "This code has reached its usage limit." };

  // One-per-customer check
  if (promo.one_per_customer && userId) {
    const used = await query(
      `SELECT id FROM promotion_uses WHERE promotion_id=$1 AND user_id=$2 LIMIT 1`,
      [promo.id, userId]
    );
    if (used.length) return { ok: false, error: "You have already used this code." };
  }

  return {
    ok: true,
    promo: {
      id:               promo.id,
      code:             promo.code.toUpperCase(),
      discount_percent: Number(promo.discount_percent),
      description:      promo.description,
    },
  };
}

// ── Record a promo use (called when order is placed) ──────────────────────
export async function recordPromoUse(
  promoId: number,
  userId: number | null,
  orderId: number | null
): Promise<void> {
  await query(
    `INSERT INTO promotion_uses (promotion_id, user_id, order_id) VALUES ($1,$2,$3)`,
    [promoId, userId, orderId]
  );
  await query(
    `UPDATE promotions SET used_count = used_count + 1 WHERE id=$1`,
    [promoId]
  );
}

// ── Admin: list all promos ────────────────────────────────────────────────
export async function getPromotions(): Promise<Promotion[]> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  return query<Promotion>(`SELECT * FROM promotions ORDER BY created_at DESC`);
}

// ── Admin: get uses for a promo ───────────────────────────────────────────
export async function getPromoUses(promoId: number): Promise<PromoUse[]> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  return query<PromoUse>(`
    SELECT pu.*, u.email AS user_email,
           CONCAT(u.first_name, ' ', u.last_name) AS user_name
    FROM promotion_uses pu
    LEFT JOIN users u ON u.id = pu.user_id
    WHERE pu.promotion_id = $1
    ORDER BY pu.used_at DESC
  `, [promoId]);
}

// ── Admin: get all promo uses for a customer ──────────────────────────────
export async function getCustomerPromoUses(userId: number): Promise<(PromoUse & { code: string; discount_percent: number })[]> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
  return query(`
    SELECT pu.*, p.code, p.discount_percent
    FROM promotion_uses pu
    JOIN promotions p ON p.id = pu.promotion_id
    WHERE pu.user_id = $1
    ORDER BY pu.used_at DESC
  `, [userId]);
}

// ── Admin: create promo ───────────────────────────────────────────────────
export async function createPromotion(data: {
  code: string; description: string; discount_percent: number;
  max_uses: number | null; one_per_customer: boolean; expires_at: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false, error: "Unauthorized" };
  try {
    await query(
      `INSERT INTO promotions (code, description, discount_percent, max_uses, one_per_customer, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5, $6)`,
      [data.code.trim(), data.description.trim(), data.discount_percent,
       data.max_uses, data.one_per_customer, data.expires_at || null]
    );
    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "Error";
    return { ok: false, error: msg.includes("unique") ? "Code already exists." : msg };
  }
}

// ── Admin: toggle active ──────────────────────────────────────────────────
export async function togglePromoActive(id: number, active: boolean): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false };
  await query(`UPDATE promotions SET active=$1 WHERE id=$2`, [active, id]);
  revalidatePath("/admin/promotions");
  return { ok: true };
}

// ── Admin: delete promo ───────────────────────────────────────────────────
export async function deletePromotion(id: number): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false, error: "Unauthorized" };
  await query(`DELETE FROM promotions WHERE id=$1`, [id]);
  revalidatePath("/admin/promotions");
  return { ok: true };
}
