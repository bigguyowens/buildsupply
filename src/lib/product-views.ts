import { query } from "@/lib/db";
import type { Product } from "@/lib/products";

const PRODUCT_SELECT = `
  SELECT id, name, slug, description, price, currency, category, subcategory,
         tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit
  FROM products
`;

export function mapProductViewRow(row: Record<string, unknown>): Product {
  return {
    ...(row as Omit<Product, "tags"|"gallery"|"ratingCount">),
    price:       Number(row.price),
    rating:      Number(row.rating),
    ratingCount: Number(row.rating_count),
    inventory:   Number(row.inventory),
    tags:    Array.isArray(row.tags)    ? (row.tags as string[])    : JSON.parse((row.tags    as string) ?? "[]"),
    gallery: Array.isArray(row.gallery) ? (row.gallery as string[]) : JSON.parse((row.gallery as string) ?? "[]"),
  };
}

export async function getSimilarProducts(category: string, excludeId: string, limit = 12): Promise<Product[]> {
  try {
    const rows = await query<Record<string, unknown>>(`
      ${PRODUCT_SELECT}
      WHERE LOWER(category) = LOWER($1)
        AND id::text != $2
        AND inventory > 0
      ORDER BY featured DESC, rating DESC, RANDOM()
      LIMIT $3
    `, [category, excludeId, limit]);
    return rows.map(mapProductViewRow);
  } catch { return []; }
}

export async function getRecentlyViewedProducts(userId: number, excludeId: string, limit = 12): Promise<Product[]> {
  try {
    const rows = await query<Record<string, unknown>>(`
      SELECT DISTINCT ON (p.id)
        p.id, p.name, p.slug, p.description, p.price, p.currency,
        p.category, p.subcategory, p.tags, p.image, p.gallery, p.rating,
        p.rating_count, p.inventory, p.featured, p.brand, p.sku, p.unit,
        pv.viewed_at
      FROM product_views pv
      JOIN products p ON p.id::text = pv.product_id
      WHERE pv.user_id = $1 AND pv.product_id != $2
      ORDER BY p.id, pv.viewed_at DESC
      LIMIT $3
    `, [userId, excludeId, limit]);
    return rows
      .slice()
      .sort((a, b) => new Date(b.viewed_at as string).getTime() - new Date(a.viewed_at as string).getTime())
      .map(mapProductViewRow);
  } catch { return []; }
}

export async function adminGetProductViews(userId: number): Promise<{
  product_id: string; product_name: string; slug: string; image: string;
  category: string; price: number; viewed_at: string; view_count: number;
}[]> {
  try {
    return query(`
      SELECT
        pv.product_id,
        p.name        AS product_name,
        p.slug,
        p.image,
        p.category,
        p.price::numeric AS price,
        MAX(pv.viewed_at) AS viewed_at,
        COUNT(*)::int     AS view_count
      FROM product_views pv
      JOIN products p ON p.id::text = pv.product_id
      WHERE pv.user_id = $1
      GROUP BY pv.product_id, p.name, p.slug, p.image, p.category, p.price
      ORDER BY viewed_at DESC
      LIMIT 50
    `, [userId]);
  } catch { return []; }
}
