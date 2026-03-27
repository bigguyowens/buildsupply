const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  // Check role constraint
  const constraint = await pool.query(`
    SELECT pg_get_constraintdef(oid) as def FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND conname LIKE '%role%'
  `);
  console.log("Role constraint:", JSON.stringify(constraint.rows));

  // Check existing columns
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='users' ORDER BY ordinal_position
  `);
  console.log("Users columns:", cols.rows.map(r => r.column_name).join(", "));

  // Revenue sample
  const rev = await pool.query(`
    SELECT DATE_TRUNC('month', created_at) as month, COUNT(*)::int as orders, SUM(total)::numeric as revenue
    FROM orders GROUP BY 1 ORDER BY 1 DESC LIMIT 6
  `);
  console.log("Revenue by month:", JSON.stringify(rev.rows));

  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
