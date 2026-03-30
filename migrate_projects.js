const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  // Main projects table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_projects (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      description  TEXT,
      status       TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','on_hold','completed','cancelled')),
      value        NUMERIC(12,2),
      entity_type  TEXT NOT NULL CHECK (entity_type IN ('customer','company')),
      entity_id    INT NOT NULL,
      assigned_to  INT REFERENCES users(id) ON DELETE SET NULL,
      created_by   INT REFERENCES users(id) ON DELETE SET NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log("✓ customer_projects");

  // Junction tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_quotes (
      project_id INT NOT NULL REFERENCES customer_projects(id) ON DELETE CASCADE,
      quote_id   INT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, quote_id)
    )
  `);
  console.log("✓ project_quotes");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_orders (
      project_id INT NOT NULL REFERENCES customer_projects(id) ON DELETE CASCADE,
      order_id   INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, order_id)
    )
  `);
  console.log("✓ project_orders");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_tasks (
      project_id INT NOT NULL REFERENCES customer_projects(id) ON DELETE CASCADE,
      task_id    INT NOT NULL REFERENCES crm_tasks(id) ON DELETE CASCADE,
      added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, task_id)
    )
  `);
  console.log("✓ project_tasks");

  // Add project_id to crm_notes (nullable — notes can be standalone or project-linked)
  await pool.query(`
    ALTER TABLE crm_notes
    ADD COLUMN IF NOT EXISTS project_id INT REFERENCES customer_projects(id) ON DELETE SET NULL
  `);
  console.log("✓ crm_notes.project_id");

  // Indexes for fast lookups
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_entity ON customer_projects(entity_type, entity_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_projects_assigned ON customer_projects(assigned_to)`);
  console.log("✓ indexes");

  console.log("\nAll done!");
  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
