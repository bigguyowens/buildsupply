const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id              SERIAL PRIMARY KEY,
        order_id        INT         NOT NULL REFERENCES orders(id),
        user_id         INT         NOT NULL REFERENCES users(id),
        status          TEXT        NOT NULL DEFAULT 'requested',
        reason          TEXT        NOT NULL,
        notes           TEXT,
        refund_amount   NUMERIC(10,2),
        admin_notes     TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ returns table created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS return_items (
        id          SERIAL PRIMARY KEY,
        return_id   INT  NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
        product_id  TEXT NOT NULL,
        name        TEXT NOT NULL,
        sku         TEXT NOT NULL,
        image       TEXT,
        price       NUMERIC(10,2) NOT NULL,
        quantity    INT  NOT NULL,
        reason      TEXT
      )
    `);
    console.log("✅ return_items table created");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
