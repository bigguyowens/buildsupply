const { Pool } = require('pg');
const neon = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const nc = await neon.connect();
  try {
    await nc.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id         SERIAL PRIMARY KEY,
        level      VARCHAR(20) DEFAULT 'error',
        source     VARCHAR(100),
        message    TEXT NOT NULL,
        stack      TEXT,
        context    JSONB DEFAULT '{}',
        url        TEXT,
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✓ error_logs table created in Neon');
  } finally { nc.release(); await neon.end(); }
}
run().catch(console.error);
