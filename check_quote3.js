const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  // Check quote 3 full data
  const q = await pool.query(`
    SELECT q.*, u.first_name || ' ' || u.last_name AS customer_name,
           u.email, u.account_manager_id,
           a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    LEFT JOIN users a ON a.id = q.created_by_id
    WHERE q.id = 3
  `);
  console.log("Quote 3:", JSON.stringify(q.rows[0], null, 2));

  // Check tasks for quote 3's customer
  const customerId = q.rows[0]?.customer_id;
  console.log("Customer ID:", customerId);

  const tasks = await pool.query(
    "SELECT id, title, entity_type, entity_id, assigned_to, due_date, status FROM crm_tasks WHERE entity_type='customer' AND entity_id=$1",
    [customerId]
  );
  console.log("Tasks for customer:", JSON.stringify(tasks.rows, null, 2));

  // Check recent errors
  const errs = await pool.query("SELECT message, source, created_at FROM error_logs ORDER BY created_at DESC LIMIT 3");
  console.log("Recent errors:", JSON.stringify(errs.rows, null, 2));

  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
