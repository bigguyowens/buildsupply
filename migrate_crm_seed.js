const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Add account_manager_id to users ─────────────────────────────────
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_manager_id INT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log("account_manager_id column added.");

    const hash = await bcrypt.hash("BuildSupply2025!", 12);

    // ── 2. Seed Account Managers ────────────────────────────────────────────
    const accountManagers = [
      { first: "Sarah",   last: "Mitchell",  email: "sarah.mitchell@buildsupply.dev"  },
      { first: "James",   last: "Torres",    email: "james.torres@buildsupply.dev"    },
      { first: "Rachel",  last: "Nguyen",    email: "rachel.nguyen@buildsupply.dev"   },
    ];

    const amIds = [];
    for (const am of accountManagers) {
      const existing = await client.query("SELECT id FROM users WHERE LOWER(email) = $1", [am.email]);
      if (existing.rows.length) {
        await client.query("UPDATE users SET role = 'account_manager' WHERE id = $1", [existing.rows[0].id]);
        amIds.push(existing.rows[0].id);
        console.log(`Updated ${am.email} to account_manager`);
      } else {
        const r = await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role)
           VALUES ($1,$2,$3,$4,'account_manager') RETURNING id`,
          [am.email, hash, am.first, am.last]
        );
        amIds.push(r.rows[0].id);
        console.log(`Created account manager: ${am.first} ${am.last} (id: ${r.rows[0].id})`);
      }
    }

    // ── 3. Seed Customers ───────────────────────────────────────────────────
    const customers = [
      { first: "Brandon", last: "Carter",    email: "brandon.carter@hartconstruction.com",  company: "Hart Construction" },
      { first: "Lisa",    last: "Fernandez", email: "lisa.fernandez@apexbuilders.com",       company: "Apex Builders" },
      { first: "Marcus",  last: "Webb",      email: "marcus.webb@goldenstatecontract.com",   company: "Golden State Contracting" },
      { first: "Tanya",   last: "Brooks",    email: "tanya.brooks@primestructures.com",      company: "Prime Structures" },
      { first: "Derek",   last: "Hoffman",   email: "derek.hoffman@midwestpro.com",          company: "Midwest Pro Services" },
      { first: "Angela",  last: "Kim",       email: "angela.kim@skylinedev.com",             company: "Skyline Development" },
      { first: "Carlos",  last: "Vega",      email: "carlos.vega@vegatradingco.com",         company: "Vega Trading Co" },
      { first: "Natalie", last: "Simmons",   email: "natalie.simmons@buildright.com",        company: "BuildRight LLC" },
      { first: "Tyler",   last: "Grant",     email: "tyler.grant@grantwholesale.com",        company: "Grant Wholesale" },
      { first: "Monica",  last: "Pierce",    email: "monica.pierce@piercecontractors.com",   company: "Pierce Contractors" },
      { first: "Jason",   last: "Murray",    email: "jason.murray@murraysupply.com",         company: "Murray Supply Group" },
      { first: "Heather", last: "Lawson",    email: "heather.lawson@lawsonmaterials.com",    company: "Lawson Materials" },
    ];

    const customerIds = [];
    for (const c of customers) {
      const existing = await client.query("SELECT id FROM users WHERE LOWER(email) = $1", [c.email]);
      if (existing.rows.length) {
        customerIds.push(existing.rows[0].id);
        console.log(`Customer already exists: ${c.email}`);
      } else {
        const r = await client.query(
          `INSERT INTO users (email, password, first_name, last_name, role)
           VALUES ($1,$2,$3,$4,'customer') RETURNING id`,
          [c.email, hash, c.first, c.last]
        );
        customerIds.push(r.rows[0].id);
        console.log(`Created customer: ${c.first} ${c.last} (id: ${r.rows[0].id})`);
      }
    }

    // ── 4. Assign customers to account managers (round-robin) ──────────────
    for (let i = 0; i < customerIds.length; i++) {
      const amId = amIds[i % amIds.length];
      await client.query(
        "UPDATE users SET account_manager_id = $1 WHERE id = $2",
        [amId, customerIds[i]]
      );
    }
    // Also assign existing customers to AMs
    const existingCustomers = await client.query(
      "SELECT id FROM users WHERE role = 'customer' AND account_manager_id IS NULL"
    );
    for (let i = 0; i < existingCustomers.rows.length; i++) {
      const amId = amIds[i % amIds.length];
      await client.query("UPDATE users SET account_manager_id = $1 WHERE id = $2", [amId, existingCustomers.rows[i].id]);
    }

    console.log(`\n✅ Done! ${amIds.length} account managers, ${customerIds.length} new customers seeded.`);
    console.log(`Assigned all customers to account managers (round-robin).`);
    console.log(`\nAccount manager login password: BuildSupply2025!`);
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
