const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='quote_items' ORDER BY ordinal_position`);
    console.log("quote_items columns:", r.rows.map(r => r.column_name).join(", "));
    const r2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='quotes' ORDER BY ordinal_position`);
    console.log("quotes columns:", r2.rows.map(r => r.column_name).join(", "));
  } finally { client.release(); await pool.end(); }
}
run().catch(console.error);
