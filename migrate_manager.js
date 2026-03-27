const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // 1. Add manager_id to users
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INT REFERENCES users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
    `);
    console.log("manager_id column added.");

    const hash = await bcrypt.hash("BuildSupply2025!", 12);

    // 2. Seed 2 managers
    const managers = [
      { first: "David",    last: "Chen",     email: "david.chen@buildsupply.dev"    },
      { first: "Patricia", last: "Wallace",  email: "patricia.wallace@buildsupply.dev" },
    ];

    const managerIds = [];
    for (const m of managers) {
      const existing = await client.query("SELECT id FROM users WHERE LOWER(email)=$1", [m.email]);
      if (existing.rows.length) {
        await client.query("UPDATE users SET role='manager' WHERE id=$1", [existing.rows[0].id]);
        managerIds.push(existing.rows[0].id);
        console.log(`Updated ${m.email} to manager`);
      } else {
        const r = await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role)
           VALUES ($1,$2,$3,$4,'manager') RETURNING id`,
          [m.email, hash, m.first, m.last]
        );
        managerIds.push(r.rows[0].id);
        console.log(`Created manager: ${m.first} ${m.last} (id: ${r.rows[0].id})`);
      }
    }

    // 3. Assign AMs to managers (split round robin)
    const ams = await client.query("SELECT id, first_name, last_name FROM users WHERE role='account_manager' ORDER BY id");
    for (let i = 0; i < ams.rows.length; i++) {
      const managerId = managerIds[i % managerIds.length];
      await client.query("UPDATE users SET manager_id=$1 WHERE id=$2", [managerId, ams.rows[i].id]);
      console.log(`  AM ${ams.rows[i].first_name} ${ams.rows[i].last_name} → manager ${managerId}`);
    }

    // 4. Seed realistic historical order data spread across 12 months for analytics
    // Check if we have enough data
    const orderCount = await client.query("SELECT COUNT(*) FROM orders");
    console.log(`\nExisting orders: ${orderCount.rows[0].count}`);

    if (parseInt(orderCount.rows[0].count) < 50) {
      console.log("Seeding additional historical orders for analytics...");
      const customers = await client.query(
        "SELECT id FROM users WHERE role NOT IN ('admin','account_manager','manager') ORDER BY id LIMIT 20"
      );
      const products = await client.query("SELECT id, price FROM products ORDER BY RANDOM() LIMIT 30");

      for (let monthsAgo = 11; monthsAgo >= 1; monthsAgo--) {
        const ordersThisMonth = Math.floor(Math.random() * 8) + 4;
        for (let o = 0; o < ordersThisMonth; o++) {
          const customer = customers.rows[Math.floor(Math.random() * customers.rows.length)];
          const numItems = Math.floor(Math.random() * 3) + 1;
          const items = [];
          let total = 0;
          for (let i = 0; i < numItems; i++) {
            const product = products.rows[Math.floor(Math.random() * products.rows.length)];
            const qty = Math.floor(Math.random() * 5) + 1;
            const price = parseFloat(product.price);
            items.push({ product_id: product.id, quantity: qty, price });
            total += qty * price;
          }
          const orderDate = new Date();
          orderDate.setMonth(orderDate.getMonth() - monthsAgo);
          orderDate.setDate(Math.floor(Math.random() * 28) + 1);
          const statuses = ['completed','completed','completed','completed','shipped','cancelled'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          const orderRes = await client.query(
            `INSERT INTO orders (user_id, status, total, items, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$5) RETURNING id`,
            [customer.id, status, total.toFixed(2), JSON.stringify(items), orderDate.toISOString()]
          );

          // Insert order items
          for (const item of items) {
            await client.query(
              `INSERT INTO order_items (order_id, product_id, quantity, price)
               VALUES ($1,$2,$3,$4)
               ON CONFLICT DO NOTHING`,
              [orderRes.rows[0].id, item.product_id, item.quantity, item.price]
            ).catch(() => {}); // silently skip if table/col mismatch
          }
        }
      }
      const newCount = await client.query("SELECT COUNT(*) FROM orders");
      console.log(`Orders after seeding: ${newCount.rows[0].count}`);
    }

    console.log("\n✅ Manager role + analytics data ready.");
    console.log("Managers: david.chen@buildsupply.dev, patricia.wallace@buildsupply.dev");
    console.log("Password: BuildSupply2025!");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(e => { console.error(e.message); pool.end(); });
