const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    // Simulate exactly what adminGetProductViews runs
    const userId = 1;
    console.log("Testing adminGetProductViews query...");
    const r = await client.query(`
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
    console.log("SUCCESS - rows:", r.rows.length);
    console.log("Sample:", JSON.stringify(r.rows[0]));
  } catch(e) {
    console.log("QUERY ERROR:", e.message);
  } finally { client.release(); await pool.end(); }
}
run().catch(console.error);
