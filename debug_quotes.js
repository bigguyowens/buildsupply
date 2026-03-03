const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    // Test the exact queries the pages run
    console.log("1. Admin list query...");
    const r1 = await client.query(`
      SELECT q.id, q.status, q.created_at, q.expires_at, q.order_id,
        u.first_name || ' ' || u.last_name AS customer_name, u.email AS customer_email,
        COUNT(qi.id)::int AS item_count,
        COALESCE(SUM(qi.quantity * qi.quoted_price), 0) AS total_quoted
      FROM quotes q
      JOIN users u ON u.id = q.customer_id
      LEFT JOIN quote_items qi ON qi.quote_id = q.id
      GROUP BY q.id, u.first_name, u.last_name, u.email
      ORDER BY q.created_at DESC
    `);
    console.log("  OK - rows:", r1.rowCount);

    console.log("2. Customer list query (user_id=1)...");
    const r2 = await client.query(`
      SELECT q.id, q.status, q.created_at, q.expires_at, q.order_id,
        COUNT(qi.id)::int AS item_count,
        COALESCE(SUM(qi.quantity * qi.quoted_price), 0) AS total_quoted
      FROM quotes q
      LEFT JOIN quote_items qi ON qi.quote_id = q.id
      WHERE q.customer_id = $1 AND q.status != 'draft'
      GROUP BY q.id ORDER BY q.created_at DESC
    `, [1]);
    console.log("  OK - rows:", r2.rowCount);

    console.log("3. Table columns...");
    const r3 = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='quotes' ORDER BY ordinal_position
    `);
    console.log("  columns:", r3.rows.map(r => r.column_name).join(", "));

  } catch(e) {
    console.log("ERROR:", e.message);
  } finally { client.release(); await pool.end(); }
}
run().catch(console.error);
