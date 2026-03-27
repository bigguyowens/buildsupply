const { Pool } = require("pg");
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function test() {
  // Test 1: generate_series LEFT JOIN (the tricky one)
  try {
    const r1 = await p.query(`
      SELECT TO_CHAR(gs.month_date, 'Mon YY') AS month,
             gs.month_date,
             COALESCE(SUM(o.total),0)::numeric AS revenue,
             COUNT(o.id)::int AS orders
      FROM generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
        DATE_TRUNC('month', NOW()),
        '1 month'
      ) AS gs(month_date)
      LEFT JOIN orders o ON DATE_TRUNC('month', o.created_at) = gs.month_date
        AND o.status != 'cancelled'
      GROUP BY gs.month_date ORDER BY gs.month_date ASC
    `);
    console.log("Test 1 (monthly revenue) OK:", r1.rowCount, "rows");
  } catch(e) { console.error("Test 1 FAILED:", e.message); }

  // Test 2: revenue by AM
  try {
    const r2 = await p.query(`
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
    console.log("Test 2 (revenue by AM) OK:", r2.rowCount, "rows");
  } catch(e) { console.error("Test 2 FAILED:", e.message); }

  // Test 3: quote pipeline
  try {
    const r3 = await p.query(`
      SELECT q.status,
             COUNT(q.id)::int AS count,
             COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS value
      FROM quotes q
      LEFT JOIN quote_items qi ON qi.quote_id = q.id
      WHERE q.status != 'draft'
      GROUP BY q.status
    `);
    console.log("Test 3 (pipeline) OK:", r3.rowCount, "rows");
  } catch(e) { console.error("Test 3 FAILED:", e.message); }

  // Test 4: top customers
  try {
    const r4 = await p.query(`
      SELECT u.first_name || ' ' || u.last_name AS name,
             u.email,
             COALESCE(SUM(o.total),0)::numeric AS revenue,
             COUNT(o.id)::int AS orders
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
      WHERE u.role NOT IN ('admin','account_manager','manager')
      GROUP BY u.id ORDER BY revenue DESC LIMIT 8
    `);
    console.log("Test 4 (top customers) OK:", r4.rowCount, "rows");
  } catch(e) { console.error("Test 4 FAILED:", e.message); }

  // Test 5: win rate
  try {
    const r5 = await p.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status='accepted')::int AS accepted,
             COUNT(*) FILTER (WHERE status='declined')::int AS declined,
             COUNT(*) FILTER (WHERE status='sent')::int AS pending
      FROM quotes WHERE status != 'draft'
    `);
    console.log("Test 5 (win rate) OK:", JSON.stringify(r5.rows[0]));
  } catch(e) { console.error("Test 5 FAILED:", e.message); }

  await p.end();
}
test();
