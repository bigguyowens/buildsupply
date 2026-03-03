const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    console.log("Dropping old tables...");
    await client.query(`DROP TABLE IF EXISTS quote_items CASCADE`);
    await client.query(`DROP TABLE IF EXISTS quotes CASCADE`);

    console.log("Creating quotes...");
    await client.query(`
      CREATE TABLE quotes (
        id               SERIAL PRIMARY KEY,
        customer_id      INT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_by_id    INT  NOT NULL REFERENCES users(id),
        status           TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','sent','accepted','declined','expired')),
        expires_at       TIMESTAMP,
        notes            TEXT,
        internal_notes   TEXT,
        order_id         INT  REFERENCES orders(id),
        created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log("Creating quote_items...");
    await client.query(`
      CREATE TABLE quote_items (
        id             SERIAL PRIMARY KEY,
        quote_id       INT  NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        product_id     TEXT NOT NULL,
        product_name   TEXT NOT NULL,
        product_sku    TEXT,
        product_image  TEXT,
        product_slug   TEXT,
        quantity       INT  NOT NULL DEFAULT 1,
        original_price NUMERIC(10,2) NOT NULL,
        quoted_price   NUMERIC(10,2) NOT NULL
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quotes_status   ON quotes(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quote_items     ON quote_items(quote_id)`);

    console.log("✓ Done - quotes and quote_items recreated with correct schema");
  } catch(e) {
    console.error("ERROR:", e.message);
  } finally { client.release(); await pool.end(); }
}
run().catch(console.error);
