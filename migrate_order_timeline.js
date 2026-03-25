const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
    console.log("Columns added.");

    // Backfill existing orders — seed status_history from created_at
    const orders = await client.query(`SELECT id, status, created_at FROM orders`);
    for (const o of orders.rows) {
      const history = [{ status: o.status, timestamp: o.created_at }];
      await client.query(
        `UPDATE orders SET status_history = $1, updated_at = $2 WHERE id = $3`,
        [JSON.stringify(history), o.created_at, o.id]
      );
    }
    console.log(`Backfilled ${orders.rows.length} orders.`);
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err); process.exit(1); });
