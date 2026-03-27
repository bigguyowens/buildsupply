const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Create hub_inventory table ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS hub_inventory (
        id           SERIAL PRIMARY KEY,
        location_id  INT NOT NULL REFERENCES distribution_centers(id) ON DELETE CASCADE,
        product_id   TEXT NOT NULL,
        quantity     INT NOT NULL DEFAULT 0,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(location_id, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_hub_inventory_location ON hub_inventory(location_id);
      CREATE INDEX IF NOT EXISTS idx_hub_inventory_product  ON hub_inventory(product_id);
    `);
    console.log("hub_inventory table created.");

    // ── 2. Fetch hubs and products ─────────────────────────────────────────
    const hubs = await client.query(
      "SELECT id, name, city, state FROM distribution_centers ORDER BY sort_order ASC"
    );
    const products = await client.query(
      "SELECT id::text AS id, inventory, category FROM products"
    );

    console.log(`Seeding ${hubs.rows.length} hubs × ${products.rows.length} products...`);

    // ── 3. Hub weighting — simulates regional demand patterns ──────────────
    // Each hub gets a weight factor; higher = gets more stock allocated
    const hubWeights = hubs.rows.map((h, i) => {
      // Southeast and West Coast get more; small hubs get less
      const weights = [0.22, 0.20, 0.18, 0.16, 0.14, 0.10];
      return { ...h, weight: weights[i] || 0.10 };
    });

    // ── 4. Distribute inventory across hubs ────────────────────────────────
    for (const product of products.rows) {
      const totalQty = parseInt(product.inventory) || 0;
      
      // Some products are only stocked at certain hubs (20% chance of being regional)
      const isRegional = Math.random() < 0.2;
      const activeHubs = isRegional
        ? hubWeights.filter(() => Math.random() < 0.5).slice(0, 3)
        : hubWeights;

      if (activeHubs.length === 0) activeHubs.push(...hubWeights.slice(0, 2));

      // Distribute with noise
      const totalWeight = activeHubs.reduce((s, h) => s + h.weight, 0);
      let remaining = totalQty;

      for (let i = 0; i < activeHubs.length; i++) {
        const hub = activeHubs[i];
        let qty;

        if (i === activeHubs.length - 1) {
          qty = remaining; // last hub gets remainder
        } else {
          const base = Math.round((hub.weight / totalWeight) * totalQty);
          const noise = Math.floor((Math.random() - 0.5) * base * 0.4); // ±20% noise
          qty = Math.max(0, base + noise);
          qty = Math.min(qty, remaining);
        }

        remaining -= qty;

        if (qty > 0 || Math.random() < 0.3) { // 30% chance of zero-stock entry
          await client.query(
            `INSERT INTO hub_inventory (location_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (location_id, product_id) DO UPDATE SET quantity = $3`,
            [hub.id, product.id, Math.max(0, qty)]
          );
        }
      }
    }

    // ── 5. Summary ─────────────────────────────────────────────────────────
    const summary = await client.query(`
      SELECT dc.name, dc.city,
             COUNT(hi.id)::int AS sku_count,
             SUM(hi.quantity)::int AS total_units,
             COUNT(hi.id) FILTER (WHERE hi.quantity = 0)::int AS out_of_stock,
             COUNT(hi.id) FILTER (WHERE hi.quantity > 0 AND hi.quantity <= 10)::int AS low_stock
      FROM distribution_centers dc
      LEFT JOIN hub_inventory hi ON hi.location_id = dc.id
      GROUP BY dc.id ORDER BY dc.sort_order
    `);

    console.log("\nHub inventory summary:");
    summary.rows.forEach(r =>
      console.log(`  ${r.name} (${r.city}): ${r.sku_count} SKUs, ${r.total_units} units, ${r.out_of_stock} OOS, ${r.low_stock} low`)
    );
    console.log("\n✅ Hub inventory seeded.");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
