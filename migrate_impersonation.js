const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS impersonation_tokens (
      id             SERIAL PRIMARY KEY,
      token          TEXT NOT NULL UNIQUE,
      target_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_by     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at     TIMESTAMPTZ NOT NULL,
      used_at        TIMESTAMPTZ,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_imp_tokens ON impersonation_tokens(token)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS impersonation_log (
      id                SERIAL PRIMARY KEY,
      target_user_id    INT NOT NULL,
      target_name       TEXT,
      impersonated_by   INT NOT NULL,
      impersonator_name TEXT,
      started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at          TIMESTAMPTZ
    )
  `);
  console.log("✓ impersonation_tokens");
  console.log("✓ impersonation_log");
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
