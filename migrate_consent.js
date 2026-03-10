const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS privacy_consent     BOOLEAN     NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS privacy_consent_at  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS privacy_consent_ip  TEXT,
        ADD COLUMN IF NOT EXISTS privacy_policy_ver  TEXT
    `);
    console.log("✅ Consent columns added to users table");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
