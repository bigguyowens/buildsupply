const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_score_config (
      id              INT PRIMARY KEY DEFAULT 1,
      -- Max points per factor
      pts_recency     INT NOT NULL DEFAULT 25,
      pts_frequency   INT NOT NULL DEFAULT 20,
      pts_spend       INT NOT NULL DEFAULT 20,
      pts_onboarding  INT NOT NULL DEFAULT 15,
      pts_engagement  INT NOT NULL DEFAULT 10,
      pts_quotes      INT NOT NULL DEFAULT 10,
      -- Recency day thresholds (days since last order)
      recency_great   INT NOT NULL DEFAULT 30,
      recency_good    INT NOT NULL DEFAULT 60,
      recency_ok      INT NOT NULL DEFAULT 90,
      -- Points for each recency tier (great/good/ok/stale)
      recency_pts_great  INT NOT NULL DEFAULT 25,
      recency_pts_good   INT NOT NULL DEFAULT 18,
      recency_pts_ok     INT NOT NULL DEFAULT 10,
      recency_pts_stale  INT NOT NULL DEFAULT 3,
      -- Frequency order thresholds
      freq_high       INT NOT NULL DEFAULT 5,
      freq_mid        INT NOT NULL DEFAULT 3,
      freq_low        INT NOT NULL DEFAULT 1,
      -- Points for each frequency tier (high/mid/low/none)
      freq_pts_high   INT NOT NULL DEFAULT 20,
      freq_pts_mid    INT NOT NULL DEFAULT 14,
      freq_pts_low    INT NOT NULL DEFAULT 8,
      -- Engagement day thresholds
      engage_great    INT NOT NULL DEFAULT 14,
      engage_good     INT NOT NULL DEFAULT 30,
      engage_ok       INT NOT NULL DEFAULT 60,
      -- Points for each engagement tier
      engage_pts_great INT NOT NULL DEFAULT 10,
      engage_pts_good  INT NOT NULL DEFAULT 7,
      engage_pts_ok    INT NOT NULL DEFAULT 4,
      engage_pts_note  INT NOT NULL DEFAULT 2,
      -- Label thresholds
      threshold_healthy   INT NOT NULL DEFAULT 75,
      threshold_at_risk   INT NOT NULL DEFAULT 40,
      -- Metadata
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by_name TEXT
    )
  `);
  console.log("Created health_score_config table");

  // Seed default row
  await pool.query(`
    INSERT INTO health_score_config (id) VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log("Seeded default config row");

  const row = await pool.query("SELECT * FROM health_score_config WHERE id = 1");
  console.log("Config:", JSON.stringify(row.rows[0], null, 2));
  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
