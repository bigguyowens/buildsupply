const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const client = await pool.connect();
  try {
    // Drop old type constraint, add expanded one
    await client.query(`
      ALTER TABLE crm_activities DROP CONSTRAINT IF EXISTS crm_activities_type_check;
      ALTER TABLE crm_activities ADD CONSTRAINT crm_activities_type_check
        CHECK (type IN ('note','email_sent','contact_form','order','quote','call','return','review','order_placed','quote_created','return_requested'));
    `);
    console.log("Constraint updated.");

    // Backfill order activities
    const orders = await client.query(
      `SELECT o.id, o.user_id, o.created_at, o.total, o.status
       FROM orders o WHERE o.user_id IS NOT NULL`
    );
    let inserted = 0;
    for (const o of orders.rows) {
      const existing = await client.query(
        `SELECT id FROM crm_activities WHERE customer_id=$1 AND type='order_placed' AND (metadata->>'order_id')::int=$2`,
        [o.user_id, o.id]
      );
      if (!existing.rows.length) {
        await client.query(
          `INSERT INTO crm_activities (customer_id, type, description, metadata, created_at)
           VALUES ($1, 'order_placed', $2, $3, $4)`,
          [o.user_id, `Placed order #${o.id} for $${Number(o.total).toFixed(2)}`,
           JSON.stringify({ order_id: o.id, total: o.total, status: o.status }), o.created_at]
        );
        inserted++;
      }
    }
    console.log(`Backfilled ${inserted} order activities.`);
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
