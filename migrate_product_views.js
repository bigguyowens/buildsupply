const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_views (
        id         SERIAL PRIMARY KEY,
        user_id    INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        viewed_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_views_user   ON product_views(user_id, viewed_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id)`);
    console.log("✓ product_views table + indexes ready");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
