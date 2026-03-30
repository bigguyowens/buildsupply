const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ
  `);
  console.log("✓ Added force_password_change + temp_password_expires_at to users");
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
