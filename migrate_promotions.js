const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id               SERIAL PRIMARY KEY,
        code             TEXT    NOT NULL UNIQUE,
        description      TEXT    NOT NULL DEFAULT '',
        discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
        max_uses         INT     NULL,        -- NULL = unlimited
        used_count       INT     NOT NULL DEFAULT 0,
        one_per_customer BOOLEAN NOT NULL DEFAULT true,
        expires_at       TIMESTAMP NULL,      -- NULL = never expires
        active           BOOLEAN NOT NULL DEFAULT true,
        created_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ promotions table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS promotion_uses (
        id           SERIAL PRIMARY KEY,
        promotion_id INT  NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
        user_id      INT  NULL     REFERENCES users(id) ON DELETE SET NULL,
        order_id     INT  NULL,
        used_at      TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ promotion_uses table created");

    // Seed a couple of demo codes
    await client.query(`
      INSERT INTO promotions (code, description, discount_percent, max_uses, one_per_customer, expires_at)
      VALUES
        ('WELCOME10', 'New customer welcome discount', 10, NULL, true, NULL),
        ('SUMMER20',  '20% off summer sale',           20, 100,  true, NOW() + INTERVAL '90 days')
      ON CONFLICT (code) DO NOTHING
    `);
    console.log("✓ seeded 2 demo promo codes");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
