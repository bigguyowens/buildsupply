const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    // Update status check constraint and add new columns
    await client.query(`ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check`);
    await client.query(`
      ALTER TABLE job_applications
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS start_date      DATE
    `);
    // Update any old statuses to map cleanly
    await client.query(`UPDATE job_applications SET status = 'new'          WHERE status = 'new'`);
    await client.query(`UPDATE job_applications SET status = 'phone_review' WHERE status = 'reviewing'`);
    await client.query(`UPDATE job_applications SET status = 'interview_1'  WHERE status = 'interviewed'`);
    await client.query(`UPDATE job_applications SET status = 'offer_sent'   WHERE status = 'offered'`);
    await client.query(`UPDATE job_applications SET status = 'declined'     WHERE status = 'rejected'`);
    console.log("✓ Pipeline columns + status migration done");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
