const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id            SERIAL PRIMARY KEY,
        product_id    TEXT NOT NULL,
        user_id       INT REFERENCES users(id) ON DELETE SET NULL,
        guest_name    TEXT,
        guest_email   TEXT,
        rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title         TEXT,
        body          TEXT NOT NULL,
        status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
        flag_reason   TEXT,
        helpful_count INT NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_product  ON product_reviews(product_id, status);
      CREATE INDEX IF NOT EXISTS idx_reviews_status   ON product_reviews(status);
      CREATE INDEX IF NOT EXISTS idx_reviews_user     ON product_reviews(user_id);
    `);
    console.log("product_reviews table created.");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err); process.exit(1); });
