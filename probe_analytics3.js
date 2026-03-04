const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();

  const queries = {
    "KPI": `SELECT
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) AND status != 'cancelled' THEN total END), 0)::float AS rev_cur,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                           AND created_at < DATE_TRUNC('month', NOW()) AND status != 'cancelled' THEN total END), 0)::float AS rev_prev,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END)::int AS ord_cur,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month'
                    AND created_at < DATE_TRUNC('month', NOW()) THEN 1 END)::int AS ord_prev,
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS cust_total,
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '30 days') AS cust_new,
        (SELECT COUNT(*)::int FROM quotes WHERE status IN ('draft','sent')) AS open_quotes,
        (SELECT COUNT(*)::int FROM job_applications WHERE status = 'new') AS pending_apps,
        (SELECT COUNT(*)::int FROM product_views WHERE viewed_at >= NOW() - INTERVAL '30 days') AS views_30,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN discount_amount END), 0)::float AS promo_savings
      FROM orders`,

    "DAILY30": `SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'Mon DD') AS day,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC') ORDER BY DATE(created_at AT TIME ZONE 'UTC')`,

    "MONTHLY12": `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon ''YY') AS month,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total END), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`,

    "TOP_PRODUCTS": `SELECT item->>'name' AS name,
        SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue,
        SUM((item->>'quantity')::int)::int AS units
      FROM orders, jsonb_array_elements(items) AS item
      WHERE status != 'cancelled'
      GROUP BY item->>'name' ORDER BY revenue DESC LIMIT 8`,

    "BY_CAT": `SELECT p.category,
        SUM((item->>'price')::float * (item->>'quantity')::int)::float AS revenue
      FROM orders, jsonb_array_elements(items) AS item
      JOIN products p ON p.id::text = item->>'id'
      WHERE orders.status != 'cancelled'
      GROUP BY p.category ORDER BY revenue DESC LIMIT 7`,

    "BUCKETS": `SELECT CASE WHEN total < 50 THEN 'Under $50' WHEN total < 200 THEN '$50–$200'
          WHEN total < 500 THEN '$200–$500' WHEN total < 1000 THEN '$500–$1k' ELSE 'Over $1k' END AS bucket,
        COUNT(*)::int AS count FROM orders WHERE status != 'cancelled' GROUP BY bucket ORDER BY MIN(total)`,

    "CUST_GROWTH": `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon ''YY') AS month, COUNT(*)::int AS count
      FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`,

    "STATUS": `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC`,

    "VIEWED": `SELECT p.name, COUNT(*)::int AS views FROM product_views pv JOIN products p ON p.id = pv.product_id
      WHERE pv.viewed_at >= NOW() - INTERVAL '30 days' GROUP BY p.name ORDER BY views DESC LIMIT 6`,
  };

  for (const [name, sql] of Object.entries(queries)) {
    try {
      const r = await client.query(sql);
      console.log(`✓ ${name}: ${r.rows.length} rows`);
    } catch (e) {
      console.error(`✗ ${name}: ${e.message}`);
    }
  }

  client.release();
  await pool.end();
}
run().catch(console.error);
