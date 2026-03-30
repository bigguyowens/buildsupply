const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Build a realistic status history based on final status + created_at
function buildHistory(status, createdAt) {
  const base = new Date(createdAt).getTime();
  const hrs = (h) => new Date(base + h * 3600000).toISOString();

  const placed = { status: "pending", timestamp: new Date(createdAt).toISOString() };

  if (status === "pending") {
    return [placed];
  }
  if (status === "processing") {
    return [placed, { status: "processing", timestamp: hrs(2 + Math.random() * 4) }];
  }
  if (status === "shipped") {
    return [
      placed,
      { status: "processing", timestamp: hrs(2 + Math.random() * 4) },
      { status: "shipped",     timestamp: hrs(26 + Math.random() * 24) },
    ];
  }
  if (status === "completed") {
    const procHrs  = 2 + Math.random() * 4;
    const shipHrs  = procHrs + 24 + Math.random() * 24;
    const doneHrs  = shipHrs + 48 + Math.random() * 48;
    return [
      placed,
      { status: "processing", timestamp: hrs(procHrs) },
      { status: "shipped",    timestamp: hrs(shipHrs) },
      { status: "completed",  timestamp: hrs(doneHrs) },
    ];
  }
  if (status === "cancelled") {
    const cancelHrs = 1 + Math.random() * 12;
    return [
      placed,
      { status: "cancelled",  timestamp: hrs(cancelHrs) },
    ];
  }
  return [placed];
}

async function run() {
  const orders = await pool.query(`SELECT id, status, created_at FROM orders ORDER BY id`);
  console.log(`Backfilling history for ${orders.rows.length} orders...`);

  for (const o of orders.rows) {
    const history = buildHistory(o.status, o.created_at);
    await pool.query(
      `UPDATE orders SET status_history = $1 WHERE id = $2`,
      [JSON.stringify(history), o.id]
    );
  }

  console.log("✅ Done — verifying sample:");
  const sample = await pool.query(`SELECT id, status, status_history FROM orders WHERE id IN (6,7,10,14) ORDER BY id`);
  console.log(JSON.stringify(sample.rows, null, 2));
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
