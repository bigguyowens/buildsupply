const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  // Tables
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  console.log("TABLES:", tables.rows.map(x => x.table_name).join(", "));

  // Revenue last 30 days daily
  const rev30 = await client.query(`
    SELECT DATE(created_at) as day, SUM(total)::float as revenue, COUNT(*)::int as orders
    FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY day ORDER BY day
  `);
  console.log("REV30 rows:", rev30.rows.length, "sample:", JSON.stringify(rev30.rows.slice(0,3)));

  // Revenue last 12 months
  const rev12 = await client.query(`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month, SUM(total)::float as revenue, COUNT(*)::int as orders
    FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)
  `);
  console.log("REV12 rows:", rev12.rows.length, "sample:", JSON.stringify(rev12.rows));

  // Top products
  const topProds = await client.query(`
    SELECT p.name, SUM(oi.quantity * oi.price)::float as revenue, SUM(oi.quantity)::int as units
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id WHERE o.status != 'cancelled'
    GROUP BY p.name ORDER BY revenue DESC LIMIT 8
  `);
  console.log("TOP PRODS:", JSON.stringify(topProds.rows.slice(0,3)));

  // Revenue by category
  const byCat = await client.query(`
    SELECT p.category, SUM(oi.quantity * oi.price)::float as revenue
    FROM order_items oi JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id WHERE o.status != 'cancelled'
    GROUP BY p.category ORDER BY revenue DESC LIMIT 8
  `);
  console.log("BY CAT:", JSON.stringify(byCat.rows));

  // New customers per month
  const newCust = await client.query(`
    SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month, COUNT(*)::int as count
    FROM users WHERE role='customer' AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)
  `);
  console.log("NEW CUST:", JSON.stringify(newCust.rows));

  // Order value buckets
  const buckets = await client.query(`
    SELECT 
      CASE WHEN total < 50 THEN 'Under $50'
           WHEN total < 200 THEN '$50-$200'
           WHEN total < 500 THEN '$200-$500'
           WHEN total < 1000 THEN '$500-$1k'
           ELSE 'Over $1k' END as bucket,
      COUNT(*)::int as count
    FROM orders WHERE status != 'cancelled'
    GROUP BY bucket ORDER BY MIN(total)
  `);
  console.log("BUCKETS:", JSON.stringify(buckets.rows));

  client.release(); await pool.end();
}
run().catch(console.error);
