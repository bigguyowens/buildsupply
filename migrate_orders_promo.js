const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS promo_id        INT     NULL REFERENCES promotions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS promo_code      TEXT    NULL,
        ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0
    `);
    console.log("✓ orders table updated with promo columns");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
