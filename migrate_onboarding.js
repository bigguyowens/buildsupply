const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_templates (
        id          SERIAL PRIMARY KEY,
        type        TEXT NOT NULL CHECK (type IN ('customer','company')),
        step_order  INT NOT NULL,
        title       TEXT NOT NULL,
        description TEXT,
        required    BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS onboarding_progress (
        id           SERIAL PRIMARY KEY,
        entity_type  TEXT NOT NULL CHECK (entity_type IN ('customer','company')),
        entity_id    INT NOT NULL,
        template_id  INT NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
        status       TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','in_progress','complete','skipped')),
        note         TEXT,
        completed_by INT REFERENCES users(id) ON DELETE SET NULL,
        completed_at TIMESTAMPTZ,
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(entity_type, entity_id, template_id)
      );

      CREATE INDEX IF NOT EXISTS idx_onboarding_entity ON onboarding_progress(entity_type, entity_id);
    `);
    console.log("Onboarding tables created.");

    // ── Customer onboarding steps ─────────────────────────────────────────
    const customerSteps = [
      { order: 1, title: "Profile Complete",        desc: "Customer has filled out name, email, and contact info",          required: true  },
      { order: 2, title: "AM Introduction",          desc: "Account manager has made first contact with the customer",       required: true  },
      { order: 3, title: "First Order Placed",       desc: "Customer has placed their first order on the platform",         required: true  },
      { order: 4, title: "First Quote Requested",    desc: "Customer has submitted or received a custom quote",             required: false },
      { order: 5, title: "Wishlist Created",         desc: "Customer has saved products to a wishlist",                     required: false },
      { order: 6, title: "Repeat Order Placed",      desc: "Customer has placed a second order — showing retention",        required: true  },
      { order: 7, title: "30-Day Check-in",          desc: "AM has completed a 30-day satisfaction check-in",              required: true  },
    ];

    // ── Company onboarding steps ──────────────────────────────────────────
    const companySteps = [
      { order: 1, title: "Company Profile Verified",  desc: "Company details, domain, and industry have been confirmed",    required: true  },
      { order: 2, title: "Primary Contact Set",       desc: "A company admin has been designated as primary contact",      required: true  },
      { order: 3, title: "Team Members Added",        desc: "At least one additional team member has been added",          required: false },
      { order: 4, title: "Kickoff Call Logged",       desc: "AM has logged a kickoff call with the company",              required: true  },
      { order: 5, title: "First Company Order",       desc: "A member of the company has placed their first order",        required: true  },
      { order: 6, title: "Billing / Terms Agreed",    desc: "Payment terms or net terms have been established",            required: true  },
      { order: 7, title: "First Bulk/Quote Order",    desc: "Company has submitted or accepted a bulk quote",              required: false },
      { order: 8, title: "30-Day Business Review",    desc: "AM has completed a 30-day business review with the company",  required: true  },
    ];

    // Insert templates
    for (const s of customerSteps) {
      await client.query(
        `INSERT INTO onboarding_templates (type, step_order, title, description, required)
         VALUES ('customer', $1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [s.order, s.title, s.desc, s.required]
      );
    }
    for (const s of companySteps) {
      await client.query(
        `INSERT INTO onboarding_templates (type, step_order, title, description, required)
         VALUES ('company', $1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [s.order, s.title, s.desc, s.required]
      );
    }
    console.log(`Seeded ${customerSteps.length} customer steps, ${companySteps.length} company steps.`);

    // ── Auto-provision progress rows for existing customers + companies ───
    const templates = await client.query("SELECT id, type FROM onboarding_templates");
    const customers = await client.query("SELECT id FROM users WHERE role NOT IN ('admin','account_manager')");
    const companies = await client.query("SELECT id FROM companies");

    const custTemplateIds = templates.rows.filter(t => t.type === 'customer').map(t => t.id);
    const coTemplateIds   = templates.rows.filter(t => t.type === 'company').map(t => t.id);

    for (const c of customers.rows) {
      for (const tid of custTemplateIds) {
        await client.query(
          `INSERT INTO onboarding_progress (entity_type, entity_id, template_id)
           VALUES ('customer', $1, $2) ON CONFLICT DO NOTHING`,
          [c.id, tid]
        );
      }
    }
    for (const co of companies.rows) {
      for (const tid of coTemplateIds) {
        await client.query(
          `INSERT INTO onboarding_progress (entity_type, entity_id, template_id)
           VALUES ('company', $1, $2) ON CONFLICT DO NOTHING`,
          [co.id, tid]
        );
      }
    }
    console.log(`Provisioned progress rows for ${customers.rows.length} customers, ${companies.rows.length} companies.`);

    // ── Auto-complete obvious steps based on existing data ────────────────
    // Mark "Profile Complete" for all existing customers
    const profileStep = await client.query("SELECT id FROM onboarding_templates WHERE type='customer' AND step_order=1");
    if (profileStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress SET status='complete', completed_at=NOW()
         WHERE template_id=$1 AND entity_type='customer'`,
        [profileStep.rows[0].id]
      );
    }

    // Mark "First Order Placed" for customers who have orders
    const orderStep = await client.query("SELECT id FROM onboarding_templates WHERE type='customer' AND step_order=3");
    if (orderStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress op
         SET status='complete', completed_at=(SELECT MIN(created_at) FROM orders WHERE user_id=op.entity_id)
         WHERE op.template_id=$1 AND op.entity_type='customer'
           AND EXISTS (SELECT 1 FROM orders WHERE user_id=op.entity_id)`,
        [orderStep.rows[0].id]
      );
    }

    // Mark "Repeat Order Placed" for customers with 2+ orders
    const repeatStep = await client.query("SELECT id FROM onboarding_templates WHERE type='customer' AND step_order=6");
    if (repeatStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress op
         SET status='complete', completed_at=NOW()
         WHERE op.template_id=$1 AND op.entity_type='customer'
           AND (SELECT COUNT(*) FROM orders WHERE user_id=op.entity_id) >= 2`,
        [repeatStep.rows[0].id]
      );
    }

    // Mark "Company Profile Verified" for all companies
    const coProfileStep = await client.query("SELECT id FROM onboarding_templates WHERE type='company' AND step_order=1");
    if (coProfileStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress SET status='complete', completed_at=NOW()
         WHERE template_id=$1 AND entity_type='company'`,
        [coProfileStep.rows[0].id]
      );
    }

    // Mark "Primary Contact Set" for companies that have a company_admin
    const contactStep = await client.query("SELECT id FROM onboarding_templates WHERE type='company' AND step_order=2");
    if (contactStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress op
         SET status='complete', completed_at=NOW()
         WHERE op.template_id=$1 AND op.entity_type='company'
           AND EXISTS (SELECT 1 FROM users WHERE company_id=op.entity_id AND role='company_admin')`,
        [contactStep.rows[0].id]
      );
    }

    // Mark "Team Members Added" for companies with 2+ members
    const teamStep = await client.query("SELECT id FROM onboarding_templates WHERE type='company' AND step_order=3");
    if (teamStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress op
         SET status='complete', completed_at=NOW()
         WHERE op.template_id=$1 AND op.entity_type='company'
           AND (SELECT COUNT(*) FROM users WHERE company_id=op.entity_id) >= 2`,
        [teamStep.rows[0].id]
      );
    }

    // Mark "First Company Order" for companies where any member has an order
    const coOrderStep = await client.query("SELECT id FROM onboarding_templates WHERE type='company' AND step_order=5");
    if (coOrderStep.rows.length) {
      await client.query(
        `UPDATE onboarding_progress op
         SET status='complete', completed_at=NOW()
         WHERE op.template_id=$1 AND op.entity_type='company'
           AND EXISTS (SELECT 1 FROM orders o JOIN users u ON u.id=o.user_id WHERE u.company_id=op.entity_id)`,
        [coOrderStep.rows[0].id]
      );
    }

    console.log("Auto-completed existing data steps.");
    console.log("\n✅ Onboarding system ready.");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
