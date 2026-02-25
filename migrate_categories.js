const { Pool } = require('pg');

const local = new Pool({ host: 'localhost', user: 'postgres', password: '147258', database: 'nextjs_ecomm', port: 5432 });
const neon  = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const lc = await local.connect();
  const nc = await neon.connect();
  try {
    // Create categories table
    await nc.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image       TEXT
      )
    `);

    const { rows } = await lc.query('SELECT * FROM categories ORDER BY id ASC');
    console.log(`Found ${rows.length} categories locally`);

    await nc.query('TRUNCATE categories RESTART IDENTITY CASCADE');
    for (const row of rows) {
      await nc.query(
        `INSERT INTO categories (id, name, slug, description, image) VALUES ($1,$2,$3,$4,$5)`,
        [row.id, row.name, row.slug, row.description, row.image]
      );
    }
    await nc.query(`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`);
    console.log(`✓ Migrated ${rows.length} categories to Neon`);
  } finally {
    lc.release(); nc.release();
    await local.end(); await neon.end();
  }
}
run().catch(console.error);
