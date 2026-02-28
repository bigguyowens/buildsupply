const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id          SERIAL PRIMARY KEY,
        name        TEXT    NOT NULL,
        slug        TEXT    NOT NULL UNIQUE,
        description TEXT    NOT NULL DEFAULT '',
        color       TEXT    NOT NULL DEFAULT '#f97316',
        sort_order  INT     NOT NULL DEFAULT 0,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ blog_categories created");

    await client.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id           SERIAL PRIMARY KEY,
        category_id  INT     NOT NULL REFERENCES blog_categories(id) ON DELETE RESTRICT,
        title        TEXT    NOT NULL,
        slug         TEXT    NOT NULL UNIQUE,
        excerpt      TEXT    NOT NULL DEFAULT '',
        body         TEXT    NOT NULL DEFAULT '',
        cover_image  TEXT    NOT NULL DEFAULT '',
        author_name  TEXT    NOT NULL DEFAULT 'BuildSupply Team',
        published    BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ blog_posts created");

    // Seed categories
    const cats = [
      { name: "Press Releases",  slug: "press-releases",  description: "Official company announcements and press releases.", color: "#3b82f6", sort: 1 },
      { name: "Industry News",   slug: "industry-news",   description: "News and trends from the construction supply industry.", color: "#8b5cf6", sort: 2 },
      { name: "Internal Wins",   slug: "internal-wins",   description: "Team highlights, milestones, and company achievements.", color: "#22c55e", sort: 3 },
      { name: "Product Spotlight", slug: "product-spotlight", description: "Featured products and new arrivals.", color: "#f97316", sort: 4 },
    ];
    for (const c of cats) {
      await client.query(
        `INSERT INTO blog_categories (name, slug, description, color, sort_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING`,
        [c.name, c.slug, c.description, c.color, c.sort]
      );
    }
    console.log("✓ seeded 4 blog categories");

    // Seed a sample post
    const catResult = await client.query(`SELECT id FROM blog_categories WHERE slug='internal-wins' LIMIT 1`);
    if (catResult.rows?.[0]) {
      await client.query(`
        INSERT INTO blog_posts (category_id, title, slug, excerpt, body, author_name, published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (slug) DO NOTHING
      `, [
        catResult.rows[0].id,
        "BuildSupply Hits 10,000 Orders Milestone",
        "buildsupply-10000-orders-milestone",
        "We're thrilled to announce that BuildSupply has processed its 10,000th order — a testament to the trust our customers place in us every day.",
        `We're thrilled to announce that BuildSupply has officially processed its 10,000th order.

This milestone represents thousands of contractors, project managers, and procurement teams who chose us to supply their job sites with the tools and materials they need to get the job done.

## What This Means

When we launched, our goal was simple: make industrial-grade supplies accessible, affordable, and fast. Every order is a vote of confidence from the people who build things, and we don't take that lightly.

## Thank You

To every customer who has placed an order — thank you. We're just getting started.

*— The BuildSupply Team*`,
        "BuildSupply Team",
      ]);
      console.log("✓ seeded sample post");
    }
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
