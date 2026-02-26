// Run: node migrate_contact.js
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT,
      company     TEXT,
      reason      TEXT,
      message     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'new',
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log("✓ contact_submissions table ready");
  await pool.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
