"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type WishlistResult = { success?: boolean; error?: string };

// ── Get all wishlists for current user ───────────────────
export async function getUserWishlists() {
  const session = await getSession();
  if (!session) return [];
  return query<{ id: number; name: string; item_count: number }>(
    `SELECT w.id, w.name, COUNT(wi.id)::int AS item_count
     FROM wishlists w
     LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
     WHERE w.user_id = $1
     GROUP BY w.id ORDER BY w.created_at ASC`,
    [session.id]
  );
}

// ── Get product IDs in any wishlist for current user ─────
export async function getUserWishlistProductIds(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];
  const rows = await query<{ product_id: string }>(
    `SELECT DISTINCT wi.product_id
     FROM wishlist_items wi
     JOIN wishlists w ON w.id = wi.wishlist_id
     WHERE w.user_id = $1`,
    [session.id]
  );
  return rows.map(r => r.product_id);
}

// ── Get wishlist IDs that contain a specific product ─────
export async function getWishlistsContaining(productId: string): Promise<number[]> {
  const session = await getSession();
  if (!session) return [];
  const rows = await query<{ wishlist_id: number }>(
    `SELECT wi.wishlist_id FROM wishlist_items wi
     JOIN wishlists w ON w.id = wi.wishlist_id
     WHERE w.user_id = $1 AND wi.product_id = $2`,
    [session.id, productId]
  );
  return rows.map(r => r.wishlist_id);
}

// ── Create a new list ────────────────────────────────────
export async function createWishlistAction(
  _prev: WishlistResult,
  formData: FormData
): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "List name is required." };

  await query(
    "INSERT INTO wishlists (user_id, name) VALUES ($1, $2)",
    [session.id, name]
  );
  revalidatePath("/account/wishlist");
  return { success: true };
}

// ── Delete a list ─────────────────────────────────────────
export async function deleteWishlistAction(wishlistId: number): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  await query(
    "DELETE FROM wishlists WHERE id = $1 AND user_id = $2",
    [wishlistId, session.id]
  );
  revalidatePath("/account/wishlist");
  return { success: true };
}

// ── Add product to a list ────────────────────────────────
export async function addToWishlistAction(
  wishlistId: number,
  productId: string
): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  // Verify list belongs to user
  const owns = await query<{ id: number }>(
    "SELECT id FROM wishlists WHERE id = $1 AND user_id = $2",
    [wishlistId, session.id]
  );
  if (!owns.length) return { error: "List not found." };

  await query(
    "INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [wishlistId, productId]
  );
  revalidatePath("/account/wishlist");
  return { success: true };
}

// ── Remove product from a list ───────────────────────────
export async function removeFromWishlistAction(
  wishlistId: number,
  productId: string
): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  await query(
    `DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2
     AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = $3)`,
    [wishlistId, productId, session.id]
  );
  revalidatePath("/account/wishlist");
  return { success: true };
}
