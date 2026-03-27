const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_notes (
        id          SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id   INT REFERENCES users(id) ON DELETE SET NULL,
        body        TEXT NOT NULL,
        pinned      BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crm_notes_customer ON crm_notes(customer_id);

      CREATE TABLE IF NOT EXISTS crm_activities (
        id          SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_id   INT REFERENCES users(id) ON DELETE SET NULL,
        type        TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata    JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crm_activities_customer ON crm_activities(customer_id);
      CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(type);
    `);
    console.log("CRM tables created.");

    // Backfill activity log from existing orders
    const orders = await client.query(
      `SELECT o.id, o.user_id, o.created_at, o.total, o.status
       FROM orders o WHERE o.user_id IS NOT NULL`
    );
    for (const o of orders.rows) {
      await client.query(
        `INSERT INTO crm_activities (customer_id, type, description, metadata, created_at)
         VALUES ($1, 'order_placed', $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [o.user_id, `Placed order #${o.id} for $${Number(o.total).toFixed(2)}`,
         JSON.stringify({ order_id: o.id, total: o.total, status: o.status }), o.created_at]
      );
    }
    console.log(`Backfilled ${orders.rows.length} order activities.`);

    // Backfill from contact submissions
    const contacts = await client.query(
      `SELECT cs.id, cs.email, cs.name, cs.created_at, u.id as user_id
       FROM contact_submissions cs
       LEFT JOIN users u ON LOWER(u.email) = LOWER(cs.email)`
    );
    for (const c of contacts.rows) {
      if (!c.user_id) continue;
      await client.query(
        `INSERT INTO crm_activities (customer_id, type, description, metadata, created_at)
         VALUES ($1, 'contact_form', $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [c.user_id, `Submitted contact form`,
         JSON.stringify({ submission_id: c.id }), c.created_at]
      );
    }
    console.log("Contact activity backfill done.");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err); process.exit(1); });
