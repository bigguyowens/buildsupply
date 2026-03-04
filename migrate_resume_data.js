const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS resume_data  TEXT,
      ADD COLUMN IF NOT EXISTS resume_mime  TEXT
    `);
    console.log("✓ resume_data + resume_mime columns added");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
