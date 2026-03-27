const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const r = await pool.query("SELECT message, source, context, created_at FROM error_logs ORDER BY created_at DESC LIMIT 5");
  r.rows.forEach(row => {
    console.log("---");
    console.log("Time:", row.created_at);
    console.log("Source:", row.source);
    console.log("Message:", row.message);
    if (row.context) console.log("Context:", JSON.stringify(row.context).slice(0, 200));
  });
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
