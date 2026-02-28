const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_theme (
        id                  INT  PRIMARY KEY DEFAULT 1,
        color_primary       TEXT NOT NULL DEFAULT '#002244',
        color_accent        TEXT NOT NULL DEFAULT '#e8561c',
        color_background    TEXT NOT NULL DEFAULT '#f4f5f6',
        color_foreground    TEXT NOT NULL DEFAULT '#111827',
        heading_font        TEXT NOT NULL DEFAULT 'Geist',
        body_font           TEXT NOT NULL DEFAULT 'Geist',
        updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
        CHECK (id = 1)
      )
    `);
    await client.query(`
      INSERT INTO site_theme (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("✓ site_theme table ready");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
