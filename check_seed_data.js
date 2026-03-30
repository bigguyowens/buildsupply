const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const customers = await pool.query(`
    SELECT u.id, u.first_name, u.last_name, u.email, u.account_manager_id,
           am.first_name || ' ' || am.last_name AS am_name
    FROM users u
    LEFT JOIN users am ON am.id = u.account_manager_id
    WHERE u.role NOT IN ('admin','account_manager','manager')
    ORDER BY u.first_name LIMIT 20
  `);
  console.log("Customers:", JSON.stringify(customers.rows, null, 2));

  const companies = await pool.query(`
    SELECT c.id, c.name, c.account_manager_id,
           am.first_name || ' ' || am.last_name AS am_name
    FROM companies c
    LEFT JOIN users am ON am.id = c.account_manager_id
    ORDER BY c.name
  `);
  console.log("Companies:", JSON.stringify(companies.rows, null, 2));

  const ams = await pool.query(`SELECT id, first_name, last_name FROM users WHERE role = 'account_manager'`);
  console.log("AMs:", JSON.stringify(ams.rows, null, 2));

  const quotes = await pool.query(`SELECT id, customer_id, status FROM quotes WHERE status != 'draft' LIMIT 10`);
  console.log("Quotes:", JSON.stringify(quotes.rows, null, 2));

  const orders = await pool.query(`SELECT id, user_id, status, total FROM orders ORDER BY created_at DESC LIMIT 10`);
  console.log("Orders:", JSON.stringify(orders.rows, null, 2));

  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
