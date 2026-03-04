const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' ORDER BY ordinal_position`);
  console.log("COLS:", cols.rows.map(r => `${r.column_name}(${r.data_type})`).join(", "));
  const sample = await client.query(`SELECT id, name, category, brand, sku FROM products LIMIT 20`);
  console.log("SAMPLE:", JSON.stringify(sample.rows));
  const categories = await client.query(`SELECT DISTINCT category FROM products ORDER BY category`);
  console.log("CATS:", categories.rows.map(r => r.category).join(", "));
  client.release(); await pool.end();
}
run().catch(console.error);
