const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Create companies table ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id                  SERIAL PRIMARY KEY,
        name                TEXT NOT NULL,
        domain              TEXT,
        industry            TEXT,
        phone               TEXT,
        address             TEXT,
        city                TEXT,
        state               TEXT,
        zip                 TEXT,
        account_manager_id  INT REFERENCES users(id) ON DELETE SET NULL,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INT REFERENCES companies(id) ON DELETE SET NULL;
    `);
    console.log("companies table + users.company_id added.");

    const hash = await bcrypt.hash("BuildSupply2025!", 12);

    // ── 2. Get AM IDs ──────────────────────────────────────────────────────
    const ams = await client.query("SELECT id, email FROM users WHERE role = 'account_manager' ORDER BY id");
    const amIds = ams.rows.map(r => r.id); // [7, 8, 9]
    console.log("Account managers:", amIds);

    // ── 3. Company definitions ─────────────────────────────────────────────
    const companies = [
      {
        name: "Hart Construction",     domain: "hartconstruction.com",    industry: "General Contracting",
        phone: "(404) 555-0110",       city: "Atlanta",    state: "GA", zip: "30301",
        existingUserId: 10, // Brandon Carter
        extras: [
          { first: "Kevin",  last: "Hart",    email: "kevin.hart@hartconstruction.com",   role: "customer" },
          { first: "Dana",   last: "Morris",  email: "dana.morris@hartconstruction.com",  role: "customer" },
        ]
      },
      {
        name: "Apex Builders",          domain: "apexbuilders.com",        industry: "Residential Construction",
        phone: "(312) 555-0211",        city: "Chicago",    state: "IL", zip: "60601",
        existingUserId: 11, // Lisa Fernandez
        extras: [
          { first: "Tom",    last: "Apex",    email: "tom.jensen@apexbuilders.com",       role: "customer" },
        ]
      },
      {
        name: "Golden State Contracting", domain: "goldenstatecontract.com", industry: "Commercial Construction",
        phone: "(213) 555-0312",          city: "Los Angeles", state: "CA", zip: "90001",
        existingUserId: 12, // Marcus Webb
        extras: [
          { first: "Sofia",  last: "Reyes",   email: "sofia.reyes@goldenstatecontract.com", role: "customer" },
          { first: "Andre",  last: "Johnson", email: "andre.johnson@goldenstatecontract.com", role: "customer" },
        ]
      },
      {
        name: "Prime Structures",       domain: "primestructures.com",     industry: "Structural Engineering",
        phone: "(214) 555-0413",        city: "Dallas",    state: "TX", zip: "75201",
        existingUserId: 13, // Tanya Brooks
        extras: [
          { first: "Ray",    last: "Brooks",  email: "ray.brooks@primestructures.com",    role: "customer" },
        ]
      },
      {
        name: "Midwest Pro Services",   domain: "midwestpro.com",          industry: "Industrial Maintenance",
        phone: "(614) 555-0514",        city: "Columbus",  state: "OH", zip: "43215",
        existingUserId: 14, // Derek Hoffman
        extras: [
          { first: "Carla",  last: "Riggs",   email: "carla.riggs@midwestpro.com",        role: "customer" },
        ]
      },
      {
        name: "Skyline Development",    domain: "skylinedev.com",          industry: "Real Estate Development",
        phone: "(415) 555-0615",        city: "San Francisco", state: "CA", zip: "94102",
        existingUserId: 15, // Angela Kim
        extras: [
          { first: "David",  last: "Park",    email: "david.park@skylinedev.com",          role: "customer" },
          { first: "Jenny",  last: "Liu",     email: "jenny.liu@skylinedev.com",            role: "customer" },
        ]
      },
      {
        name: "Vega Trading Co",        domain: "vegatradingco.com",       industry: "Building Materials Supply",
        phone: "(305) 555-0716",        city: "Miami",     state: "FL", zip: "33101",
        existingUserId: 16, // Carlos Vega
        extras: [
          { first: "Maria",  last: "Vega",    email: "maria.vega@vegatradingco.com",       role: "customer" },
        ]
      },
      {
        name: "BuildRight LLC",         domain: "buildright.com",          industry: "General Contracting",
        phone: "(602) 555-0817",        city: "Phoenix",   state: "AZ", zip: "85001",
        existingUserId: 17, // Natalie Simmons
        extras: [
          { first: "Eric",   last: "Walsh",   email: "eric.walsh@buildright.com",          role: "customer" },
          { first: "Paula",  last: "Chen",    email: "paula.chen@buildright.com",           role: "customer" },
        ]
      },
      {
        name: "Grant Wholesale",        domain: "grantwholesale.com",      industry: "Wholesale Distribution",
        phone: "(503) 555-0918",        city: "Portland",  state: "OR", zip: "97201",
        existingUserId: 18, // Tyler Grant
        extras: [
          { first: "Megan",  last: "Grant",   email: "megan.grant@grantwholesale.com",     role: "customer" },
        ]
      },
      {
        name: "Pierce Contractors",     domain: "piercecontractors.com",   industry: "Specialty Contracting",
        phone: "(702) 555-1019",        city: "Las Vegas", state: "NV", zip: "89101",
        existingUserId: 19, // Monica Pierce
        extras: [
          { first: "Steve",  last: "Pierce",  email: "steve.pierce@piercecontractors.com", role: "customer" },
          { first: "Lisa",   last: "Ford",    email: "lisa.ford@piercecontractors.com",     role: "customer" },
        ]
      },
      {
        name: "Murray Supply Group",    domain: "murraysupply.com",        industry: "Construction Supply",
        phone: "(615) 555-1120",        city: "Nashville", state: "TN", zip: "37201",
        existingUserId: 20, // Jason Murray
        extras: [
          { first: "Beth",   last: "Murray",  email: "beth.murray@murraysupply.com",       role: "customer" },
        ]
      },
      {
        name: "Lawson Materials",       domain: "lawsonmaterials.com",     industry: "Building Materials",
        phone: "(206) 555-1221",        city: "Seattle",   state: "WA", zip: "98101",
        existingUserId: 21, // Heather Lawson
        extras: [
          { first: "Jack",   last: "Lawson",  email: "jack.lawson@lawsonmaterials.com",    role: "customer" },
          { first: "Nina",   last: "Torres",  email: "nina.torres@lawsonmaterials.com",    role: "customer" },
        ]
      },
    ];

    // ── 4. Seed companies + assign users ──────────────────────────────────
    for (let i = 0; i < companies.length; i++) {
      const co = companies[i];
      const amId = amIds[i % amIds.length];

      // Create company
      const coRes = await client.query(
        `INSERT INTO companies (name, domain, industry, phone, city, state, zip, account_manager_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [co.name, co.domain, co.industry, co.phone, co.city, co.state, co.zip, amId]
      );
      const companyId = coRes.rows[0].id;

      // Make existing user company_admin
      await client.query(
        `UPDATE users SET company_id=$1, role='company_admin' WHERE id=$2`,
        [companyId, co.existingUserId]
      );
      console.log(`  → ${co.name} (id:${companyId}) — company_admin: user ${co.existingUserId}`);

      // Create + assign extra employees
      for (const emp of co.extras) {
        const existing = await client.query("SELECT id FROM users WHERE LOWER(email)=$1", [emp.email]);
        let userId;
        if (existing.rows.length) {
          userId = existing.rows[0].id;
        } else {
          const r = await client.query(
            `INSERT INTO users (email, password, first_name, last_name, role)
             VALUES ($1,$2,$3,$4,$5) RETURNING id`,
            [emp.email, hash, emp.first, emp.last, emp.role]
          );
          userId = r.rows[0].id;
        }
        await client.query(
          `UPDATE users SET company_id=$1, account_manager_id=$2 WHERE id=$3`,
          [companyId, amId, userId]
        );
      }
    }
    console.log(`\n✅ Seeded ${companies.length} companies.`);

    // ── 5. Also update account_manager_id on company_admins ───────────────
    for (let i = 0; i < companies.length; i++) {
      const co = companies[i];
      const amId = amIds[i % amIds.length];
      await client.query(
        `UPDATE users SET account_manager_id=$1 WHERE id=$2`,
        [amId, co.existingUserId]
      );
    }

    // ── 6. Summary ─────────────────────────────────────────────────────────
    const summary = await client.query(
      `SELECT c.name, COUNT(u.id)::int as employee_count,
              am.first_name || ' ' || am.last_name as account_manager
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       LEFT JOIN users am ON am.id = c.account_manager_id
       GROUP BY c.id, am.first_name, am.last_name ORDER BY c.id`
    );
    console.log("\nCompany summary:");
    summary.rows.forEach(r => console.log(`  ${r.name}: ${r.employee_count} employees → AM: ${r.account_manager}`));
    console.log("\nAll company admin and employee logins: BuildSupply2025!");

  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
