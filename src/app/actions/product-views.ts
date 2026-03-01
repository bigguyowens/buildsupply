'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Product } from "@/lib/products";

const PRODUCT_SELECT = `
  SELECT id, name, slug, description, price, currency, category, subcategory,
         tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit
  FROM products
`;

function mapProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as Omit<Product, "tags"|"gallery"|"ratingCount">),
    price:       Number(row.price),
    rating:      Number(row.rating),
    ratingCount: Number(row.rating_count),
    inventory:   Number(row.inventory),
    tags:    Array.isArray(row.tags)    ? (row.tags as string[])    : JSON.parse((row.tags as string)    ?? "[]"),
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : JSON.parse((row.gallery as string) ?? "[]"),
  };
}

// ── Record a view (called client-side on PDP mount) ───────────────────────
export async function recordProductView(productId: string): Promise<void> {
  const session = await getSession();
  if (!session) return; // guests not tracked
  try {
    // Upsert: update viewed_at if seen in last hour, otherwise insert new row
    await query(`
      INSERT INTO product_views (user_id, product_id)
      SELECT $1, $2
      WHERE NOT EXISTS (
        SELECT 1 FROM product_views
        WHERE user_id = $1 AND product_id = $2
          AND viewed_at > NOW() - INTERVAL '1 hour'
      )
    `, [session.id, productId]);
  } catch { /* silently ignore */ }
}

// ── Get products in the same category (for "Similar Products" carousel) ───
export async function getSimilarProducts(category: string, excludeId: string, limit = 12): Promise<Product[]> {
  const rows = await query<Record<string, unknown>>(`
    ${PRODUCT_SELECT}
    WHERE LOWER(category) = LOWER($1)
      AND id != $2
      AND inventory > 0
    ORDER BY featured DESC, rating DESC, RANDOM()
    LIMIT $3
  `, [category, excludeId, limit]);
  return rows.map(mapProduct);
}

// ── Get recently viewed products for the current session user ─────────────
export async function getRecentlyViewed(excludeId: string, limit = 12): Promise<Product[]> {
  const session = await getSession();
  if (!session) return [];
  const rows = await query<Record<string, unknown>>(`
    SELECT DISTINCT ON (p.id) p.id, p.name, p.slug, p.description, p.price, p.currency,
           p.category, p.subcategory, p.tags, p.image, p.gallery, p.rating,
           p.rating_count, p.inventory, p.featured, p.brand, p.sku, p.unit,
           pv.viewed_at
    FROM product_views pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.user_id = $1 AND pv.product_id != $2
    ORDER BY p.id, pv.viewed_at DESC
    LIMIT $3
  `, [session.id, excludeId, limit]);
  // Sort by most-recent view after DISTINCT ON
  const sorted = rows.slice().sort((a, b) =>
    new Date(b.viewed_at as string).getTime() - new Date(a.viewed_at as string).getTime()
  );
  return sorted.map(mapProduct);
}

// ── Admin: get full view history for a specific customer ──────────────────
export async function adminGetProductViews(userId: number): Promise<{
  product_id: string; product_name: string; slug: string; image: string;
  category: string; price: number; viewed_at: string; view_count: number;
}[]> {
  const session = await getSession();
  if (!session || session.role !== "admin") return [];
  return query(`
    SELECT
      pv.product_id,
      p.name  AS product_name,
      p.slug,
      p.image,
      p.category,
      p.price::numeric AS price,
      MAX(pv.viewed_at) AS viewed_at,
      COUNT(*)::int     AS view_count
    FROM product_views pv
    JOIN products p ON p.id = pv.product_id
    WHERE pv.user_id = $1
    GROUP BY pv.product_id, p.name, p.slug, p.image, p.category, p.price
    ORDER BY viewed_at DESC
    LIMIT 50
  `, [userId]);
}
