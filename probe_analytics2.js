const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();

  // Find order-related tables
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%order%'`);
  console.log("ORDER TABLES:", tables.rows.map(x => x.table_name).join(", "));

  // Check columns of orders table
  const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position`);
  console.log("ORDERS COLS:", cols.rows.map(x => `${x.column_name}(${x.data_type})`).join(", "));

  // Check product_views cols
  const pvcols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'product_views' ORDER BY ordinal_position`);
  console.log("PRODUCT_VIEWS COLS:", pvcols.rows.map(x => x.column_name).join(", "));

  // Check promotions table
  const promcols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'promotions' ORDER BY ordinal_position`);
  console.log("PROMOTIONS COLS:", promcols.rows.map(x => x.column_name).join(", "));

  // Sample orders
  const sampleOrder = await client.query(`SELECT * FROM orders LIMIT 1`);
  console.log("SAMPLE ORDER:", JSON.stringify(sampleOrder.rows[0]));

  client.release(); await pool.end();
}
run().catch(console.error);
