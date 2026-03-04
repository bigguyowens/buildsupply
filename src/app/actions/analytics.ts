'use server';

import { query } from "@/lib/db";

export type DailyRevenue    = { day: string; revenue: number; orders: number };
export type MonthlyRevenue  = { month: string; revenue: number; orders: number };
export type TopProduct      = { name: string; revenue: number; units: number };
export type CategoryRevenue = { category: string; revenue: number };
export type OrderBucket     = { bucket: string; count: number };
export type CustomerGrowth  = { month: string; count: number };
export type KpiTrend = {
  rev_cur: number; rev_prev: number;
  ord_cur: number; ord_prev: number;
  cust_total: number; cust_new: number;
  open_quotes: number; pending_apps: number;
  views_30: number; promo_savings: number;
};

// Safely run a query — never throws, returns fallback on error
const safe = <T>(p: Promise<T[]>, fallback: T[] = []): Promise<T[]> =>
  p.catch(e => { console.error("[analytics]", e.message); return fallback; });

export async function getAnalytics() {
  const [
    kpiRows, daily30, monthly12, topProducts,
    byCat, buckets, custGrowth, statusRows,
    viewedProducts, recentOrders, lowStock,
  ] = await Promise.all([

    safe(query<KpiTrend>(`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) AND status != 'cancelled' THEN total END), 0)::float AS rev_cur,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                           AND created_at <  DATE_TRUNC('month', NOW()) AND status != 'cancelled' THEN total END), 0)::float AS rev_prev,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END)::int AS ord_cur,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                    AND created_at <  DATE_TRUNC('month', NOW()) THEN 1 END)::int AS ord_prev,
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS cust_total,
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '30 days') AS cust_new,
        (SELECT COUNT(*)::int FROM quotes WHERE status IN ('draft','sent')) AS open_quotes,
        (SELECT COUNT(*)::int FROM job_applications WHERE status = 'new') AS pending_apps,
        (SELECT COUNT(*)::int FROM product_views WHERE viewed_at >= NOW() - INTERVAL '30 days') AS views_30,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN discount_amount END), 0)::float AS promo_savings
      FROM orders
    `), [{ rev_cur:0, rev_prev:0, ord_cur:0, ord_prev:0, cust_total:0, cust_new:0, open_quotes:0, pending_apps:0, views_30:0, promo_savings:0 }]),

    safe(query<DailyRevenue>(`
      SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'Mon DD') AS day,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY DATE(created_at AT TIME ZONE 'UTC')
    `)),

    safe(query<MonthlyRevenue>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon ''YY') AS month,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)),

    safe(query<TopProduct>(`
      SELECT item->>'name' AS name,
        SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue,
        SUM((item->>'quantity')::int)::int AS units
      FROM orders, jsonb_array_elements(items) AS item
      WHERE status != 'cancelled'
      GROUP BY item->>'name'
      ORDER BY revenue DESC LIMIT 8
    `)),

    safe(query<CategoryRevenue>(`
      SELECT p.category,
        SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue
      FROM orders, jsonb_array_elements(items) AS item
      JOIN products p ON p.id::text = item->>'id'
      WHERE orders.status != 'cancelled'
      GROUP BY p.category ORDER BY revenue DESC LIMIT 7
    `)),

    safe(query<OrderBucket>(`
      SELECT
        CASE WHEN total < 50   THEN 'Under $50'
             WHEN total < 200  THEN '$50-$200'
             WHEN total < 500  THEN '$200-$500'
             WHEN total < 1000 THEN '$500-$1k'
             ELSE 'Over $1k' END AS bucket,
        COUNT(*)::int AS count
      FROM orders WHERE status != 'cancelled'
      GROUP BY bucket ORDER BY MIN(total)
    `)),

    safe(query<CustomerGrowth>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon ''YY') AS month,
        COUNT(*)::int AS count
      FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)),

    safe(query<{ status: string; count: number }>(`
      SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC
    `)),

    safe(query<{ name: string; views: number }>(`
      SELECT p.name, COUNT(*)::int AS views
      FROM product_views pv JOIN products p ON p.id::text = pv.product_id
      WHERE pv.viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY p.name ORDER BY views DESC LIMIT 6
    `)),

    safe(query<{ id: number; status: string; total: number; created_at: string; first_name: string; last_name: string }>(`
      SELECT o.id, o.status, o.total, o.created_at, u.first_name, u.last_name
      FROM orders o LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC LIMIT 6
    `)),

    safe(query<{ id: string; name: string; inventory: number; category: string }>(`
      SELECT id, name, inventory, category FROM products
      WHERE inventory < 20 AND inventory > 0 ORDER BY inventory ASC LIMIT 6
    `)),
  ]);

  return {
    kpi: kpiRows[0],
    daily30,
    monthly12,
    topProducts,
    byCat,
    buckets,
    custGrowth,
    statusRows,
    viewedProducts,
    recentOrders,
    lowStock,
  };
}
