const { Pool } = require('pg');

const local = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '147258',
  database: 'nextjs_ecomm',
  port: 5432,
});

const neon = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const lc = await local.connect();
  const nc = await neon.connect();

  try {
    console.log('🔌 Connected to both databases\n');

    // ── Create schema on Neon ──────────────────────────────
    console.log('📐 Creating schema...');
    await nc.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name  VARCHAR(100) NOT NULL,
        email      VARCHAR(255) UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        role       VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(255) NOT NULL,
        slug         VARCHAR(255) UNIQUE NOT NULL,
        description  TEXT,
        price        NUMERIC(10,2) NOT NULL,
        currency     VARCHAR(10) DEFAULT 'USD',
        category     VARCHAR(255),
        subcategory  VARCHAR(255),
        tags         JSONB DEFAULT '[]',
        image        TEXT,
        gallery      JSONB DEFAULT '[]',
        rating       NUMERIC(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        inventory    INTEGER DEFAULT 0,
        featured     BOOLEAN DEFAULT false,
        brand        VARCHAR(255),
        sku          VARCHAR(255),
        unit         VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
        items      JSONB NOT NULL DEFAULT '[]',
        shipping   JSONB NOT NULL DEFAULT '{}',
        total      NUMERIC(10,2) NOT NULL,
        status     VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wishlists (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wishlist_items (
        id          SERIAL PRIMARY KEY,
        wishlist_id INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
        product_id  TEXT NOT NULL,
        added_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(wishlist_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS carts (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        items      JSONB NOT NULL DEFAULT '[]',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS homepage_content (
        id         SERIAL PRIMARY KEY,
        section    VARCHAR(50) UNIQUE NOT NULL,
        enabled    BOOLEAN DEFAULT true,
        content    JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ Schema created\n');

    // ── Migrate each table ─────────────────────────────────
    const tables = ['users', 'products', 'orders', 'wishlists', 'wishlist_items', 'carts', 'homepage_content'];

    for (const table of tables) {
      const { rows } = await lc.query(`SELECT * FROM ${table} ORDER BY id ASC`);
      if (rows.length === 0) {
        console.log(`⏭  ${table}: empty, skipping`);
        continue;
      }

      // Clear existing data on Neon for clean import
      await nc.query(`TRUNCATE ${table} RESTART IDENTITY CASCADE`);

      const cols = Object.keys(rows[0]);
      let inserted = 0;

      for (const row of rows) {
        const vals = cols.map(c => {
          const v = row[c];
          if (v !== null && typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        await nc.query(
          `INSERT INTO ${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`,
          vals
        );
        inserted++;
      }

      // Reset sequence to max id
      await nc.query(`SELECT setval('${table}_id_seq', (SELECT MAX(id) FROM ${table}))`);
      console.log(`✓ ${table}: ${inserted} rows migrated`);
    }

    console.log('\n✅ Migration complete! Your Neon DB is ready.');

  } finally {
    lc.release();
    nc.release();
    await local.end();
    await neon.end();
  }
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
