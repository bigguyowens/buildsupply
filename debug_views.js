const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    const r1 = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='products' AND column_name='id'`);
    console.log("products.id type:", JSON.stringify(r1.rows));
    const r2 = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='product_views' AND column_name='product_id'`);
    console.log("product_views.product_id type:", JSON.stringify(r2.rows));
    const r3 = await client.query(`SELECT * FROM product_views LIMIT 5`);
    console.log("sample rows:", JSON.stringify(r3.rows));
  } finally { client.release(); await pool.end(); }
}
run().catch(console.error);
