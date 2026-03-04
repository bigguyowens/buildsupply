const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    // Add resume_url column if it doesn't exist
    await client.query(`
      ALTER TABLE job_applications
      ADD COLUMN IF NOT EXISTS resume_url TEXT,
      ADD COLUMN IF NOT EXISTS resume_filename TEXT,
      ADD COLUMN IF NOT EXISTS resume_size INT
    `);
    console.log("✓ resume_url, resume_filename, resume_size columns added to job_applications");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
