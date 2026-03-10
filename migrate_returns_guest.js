const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // Make user_id nullable on returns (guests have no account)
    await client.query(`ALTER TABLE returns ALTER COLUMN user_id DROP NOT NULL`);
    console.log("✅ returns.user_id now nullable");

    // Add guest_email for tracking guest returns
    await client.query(`ALTER TABLE returns ADD COLUMN IF NOT EXISTS guest_email TEXT`);
    console.log("✅ returns.guest_email column added");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
