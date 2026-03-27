const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  // Test the monthly revenue query that's likely broken
  try {
    const r = await pool.query(`
      SELECT TO_CHAR(gs.month_date, 'Mon YY') AS month,
             COALESCE(SUM(o.total),0)::numeric AS revenue,
             COUNT(o.id)::int AS orders
      FROM generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
        DATE_TRUNC('month', NOW()),
        '1 month'
      ) AS gs(month_date)
      LEFT JOIN orders o ON DATE_TRUNC('month', o.created_at) = gs.month_date
        AND o.status != 'cancelled'
      GROUP BY gs.month_date
      ORDER BY gs.month_date ASC
    `);
    console.log("Monthly revenue OK:", r.rows.length, "rows");
    console.log(JSON.stringify(r.rows.slice(-3)));
  } catch(e) { console.error("Monthly revenue FAILED:", e.message); }

  // Test admin KPI query
  try {
    const r = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS cust_total,
        (SELECT COUNT(*)::int FROM users WHERE role NOT IN ('admin','account_manager','manager')) AS all_customers
    `);
    console.log("KPI query OK:", JSON.stringify(r.rows[0]));
  } catch(e) { console.error("KPI FAILED:", e.message); }

  // Test revenueByAM query
  try {
    const r = await pool.query(`
      SELECT COALESCE(am.first_name || ' ' || am.last_name, 'Unassigned') AS am_name,
             COALESCE(SUM(o.total),0)::numeric AS revenue,
             COUNT(DISTINCT o.id)::int AS orders,
             COUNT(DISTINCT u.id)::int AS customers
      FROM users am
      JOIN users u ON u.account_manager_id = am.id
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
      WHERE am.role IN ('account_manager','manager','admin')
      GROUP BY am.id, am.first_name, am.last_name
      ORDER BY revenue DESC
    `);
    console.log("revenueByAM OK:", r.rows.length, "rows");
  } catch(e) { console.error("revenueByAM FAILED:", e.message); }

  // Test winRate query
  try {
    const r = await pool.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status='accepted')::int AS accepted,
             COUNT(*) FILTER (WHERE status='declined')::int AS declined,
             COUNT(*) FILTER (WHERE status='sent')::int AS pending
      FROM quotes WHERE status != 'draft'
    `);
    console.log("winRate OK:", JSON.stringify(r.rows[0]));
  } catch(e) { console.error("winRate FAILED:", e.message); }

  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
