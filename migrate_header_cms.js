const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DEFAULTS = {
  promo_bar: {
    text: "Free shipping on orders $500+",
    link: "",
  },
  announcement: {
    enabled:  false,
    text:     "🔥 Summer Sale — 20% off all Power Tools this week only!",
    link:     "/categories/power-tools",
    bgColor:  "#f97316",
    textColor: "#ffffff",
  },
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS header_cms (
        key        TEXT PRIMARY KEY,
        content    JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ header_cms table created");
    for (const [key, content] of Object.entries(DEFAULTS)) {
      await client.query(
        `INSERT INTO header_cms (key, content) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(content)]
      );
    }
    console.log("✓ seeded header_cms defaults");
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
