const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS geo_city        TEXT,
        ADD COLUMN IF NOT EXISTS geo_region      TEXT,
        ADD COLUMN IF NOT EXISTS geo_region_code TEXT,
        ADD COLUMN IF NOT EXISTS geo_country     TEXT,
        ADD COLUMN IF NOT EXISTS geo_zip         TEXT,
        ADD COLUMN IF NOT EXISTS geo_lat         NUMERIC(9,6),
        ADD COLUMN IF NOT EXISTS geo_lon         NUMERIC(9,6),
        ADD COLUMN IF NOT EXISTS geo_updated_at  TIMESTAMPTZ
    `);
    console.log("✅ Geo columns added to users table");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
