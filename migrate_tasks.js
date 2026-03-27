const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_tasks (
        id            SERIAL PRIMARY KEY,
        title         TEXT NOT NULL,
        description   TEXT,
        type          TEXT NOT NULL DEFAULT 'follow_up'
                        CHECK (type IN ('call','email','follow_up','demo','check_in','proposal','other')),
        priority      TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high')),
        status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','complete')),
        due_date      DATE,
        entity_type   TEXT CHECK (entity_type IN ('customer','company')),
        entity_id     INT,
        entity_name   TEXT,
        assigned_to   INT REFERENCES users(id) ON DELETE SET NULL,
        created_by    INT REFERENCES users(id) ON DELETE SET NULL,
        completed_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_crm_tasks_entity    ON crm_tasks(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned  ON crm_tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_crm_tasks_due       ON crm_tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_crm_tasks_status    ON crm_tasks(status);
    `);
    console.log("crm_tasks table created.");

    // Seed some realistic tasks across customers and companies
    const ams = await client.query("SELECT id FROM users WHERE role = 'account_manager' ORDER BY id");
    const customers = await client.query("SELECT id, first_name, last_name FROM users WHERE role IN ('customer','company_admin') ORDER BY id LIMIT 12");
    const companies = await client.query("SELECT id, name FROM companies ORDER BY id LIMIT 6");

    const taskTemplates = [
      { title: "Intro call",             type: "call",       priority: "high",   daysOffset: -2  },
      { title: "Send product catalog",   type: "email",      priority: "medium", daysOffset: 0   },
      { title: "Follow up on quote",     type: "follow_up",  priority: "high",   daysOffset: 1   },
      { title: "30-day check-in call",   type: "check_in",   priority: "medium", daysOffset: 3   },
      { title: "Present bulk pricing",   type: "demo",       priority: "high",   daysOffset: 5   },
      { title: "Send proposal",          type: "proposal",   priority: "medium", daysOffset: 7   },
      { title: "Quarterly review",       type: "check_in",   priority: "low",    daysOffset: 14  },
      { title: "Confirm onboarding steps", type: "follow_up", priority: "medium", daysOffset: 2  },
    ];

    let taskCount = 0;
    const amIds = ams.rows.map(r => r.id);

    // Seed customer tasks
    for (let i = 0; i < Math.min(customers.rows.length, 10); i++) {
      const c = customers.rows[i];
      const template = taskTemplates[i % taskTemplates.length];
      const amId = amIds[i % amIds.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.daysOffset);
      const status = template.daysOffset < -1 ? "pending" : "pending";

      await client.query(
        `INSERT INTO crm_tasks (title, type, priority, status, due_date, entity_type, entity_id, entity_name, assigned_to, created_by)
         VALUES ($1,$2,$3,$4,$5,'customer',$6,$7,$8,$8)`,
        [
          `${template.title} — ${c.first_name} ${c.last_name}`,
          template.type, template.priority, status,
          dueDate.toISOString().split("T")[0],
          c.id, `${c.first_name} ${c.last_name}`, amId,
        ]
      );
      taskCount++;
    }

    // Seed company tasks
    for (let i = 0; i < companies.rows.length; i++) {
      const co = companies.rows[i];
      const template = taskTemplates[(i + 2) % taskTemplates.length];
      const amId = amIds[i % amIds.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.daysOffset);

      await client.query(
        `INSERT INTO crm_tasks (title, type, priority, status, due_date, entity_type, entity_id, entity_name, assigned_to, created_by)
         VALUES ($1,$2,$3,'pending',$4,'company',$5,$6,$7,$7)`,
        [
          `${template.title} — ${co.name}`,
          template.type, template.priority,
          dueDate.toISOString().split("T")[0],
          co.id, co.name, amId,
        ]
      );
      taskCount++;
    }

    // Mark a couple as complete for realism
    await client.query(`UPDATE crm_tasks SET status='complete', completed_at=NOW() WHERE id IN (SELECT id FROM crm_tasks ORDER BY id LIMIT 3)`);

    console.log(`Seeded ${taskCount} tasks.`);
    console.log("\n✅ Tasks system ready.");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(err => { console.error(err.message); process.exit(1); });
