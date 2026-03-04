const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_postings (
        id           SERIAL PRIMARY KEY,
        title        TEXT NOT NULL,
        slug         TEXT NOT NULL UNIQUE,
        department   TEXT NOT NULL,
        location     TEXT NOT NULL DEFAULT 'Remote',
        type         TEXT NOT NULL DEFAULT 'Full-Time'
                       CHECK (type IN ('Full-Time','Part-Time','Contract','Internship')),
        status       TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','active','closed')),
        description  TEXT NOT NULL DEFAULT '',
        requirements TEXT NOT NULL DEFAULT '',
        salary_range TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id          SERIAL PRIMARY KEY,
        posting_id  INT  NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        phone       TEXT,
        linkedin    TEXT,
        portfolio   TEXT,
        cover_letter TEXT,
        resume_text  TEXT,
        status      TEXT NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','reviewing','interviewed','offered','rejected')),
        admin_notes TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_job_apps_posting    ON job_applications(posting_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_job_apps_status     ON job_applications(status)`);

    console.log("✓ job_postings + job_applications tables ready");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
