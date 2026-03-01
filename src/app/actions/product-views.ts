'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Only client-callable server action lives here.
// Data-fetching functions (getSimilarProducts, getRecentlyViewedProducts, adminGetProductViews)
// are in src/lib/product-views.ts — safe for direct import by server components.

export async function recordProductView(productId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
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
