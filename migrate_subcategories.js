// Run: node migrate_subcategories.js
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SUBCATEGORIES = {
  "safety-ppe": [
    { name: "Head Protection",        slug: "head-protection" },
    { name: "Eye Protection",         slug: "eye-protection" },
    { name: "Hearing Protection",     slug: "hearing-protection" },
    { name: "Hand Protection",        slug: "hand-protection" },
    { name: "Respiratory Protection", slug: "respiratory-protection" },
    { name: "Hi-Vis Clothing",        slug: "hi-vis-clothing" },
    { name: "Fall Protection",        slug: "fall-protection" },
    { name: "Foot Protection",        slug: "foot-protection" },
  ],
  "fasteners": [
    { name: "Cap Screws",     slug: "cap-screws" },
    { name: "Screws",         slug: "screws" },
    { name: "Nuts & Washers", slug: "nuts-washers" },
    { name: "Anchors",        slug: "anchors" },
    { name: "Bolts",          slug: "bolts" },
    { name: "Rivets",         slug: "rivets" },
    { name: "Threaded Rod",   slug: "threaded-rod" },
    { name: "Pins & Clips",   slug: "pins-clips" },
  ],
  "power-tools": [
    { name: "Drills",          slug: "drills" },
    { name: "Saws",            slug: "saws" },
    { name: "Grinders",        slug: "grinders" },
    { name: "Rotary Hammers",  slug: "rotary-hammers" },
    { name: "Sanders",         slug: "sanders" },
    { name: "Nailers",         slug: "nailers" },
    { name: "Impact Wrenches", slug: "impact-wrenches" },
    { name: "Compressors",     slug: "compressors" },
  ],
  "hand-tools": [
    { name: "Wrenches",           slug: "wrenches" },
    { name: "Screwdrivers",       slug: "screwdrivers" },
    { name: "Hammers",            slug: "hammers" },
    { name: "Pliers",             slug: "pliers" },
    { name: "Measuring & Layout", slug: "measuring-layout" },
    { name: "Levels",             slug: "levels" },
    { name: "Chisels & Punches",  slug: "chisels-punches" },
    { name: "Knives & Blades",    slug: "knives-blades" },
  ],
  "abrasives": [
    { name: "Flap Discs",      slug: "flap-discs" },
    { name: "Grinding Wheels", slug: "grinding-wheels" },
    { name: "Cutting Discs",   slug: "cutting-discs" },
    { name: "Sandpaper",       slug: "sandpaper" },
    { name: "Sanding Belts",   slug: "sanding-belts" },
    { name: "Wire Wheels",     slug: "wire-wheels" },
    { name: "Surface Prep",    slug: "surface-prep" },
  ],
  "electrical": [
    { name: "Wire & Cable",        slug: "wire-cable" },
    { name: "Conduit & Fittings",  slug: "conduit-fittings" },
    { name: "Breakers & Panels",   slug: "breakers-panels" },
    { name: "Electrician Tools",   slug: "electrician-tools" },
    { name: "Connectors & Lugs",   slug: "connectors-lugs" },
    { name: "Boxes & Enclosures",  slug: "boxes-enclosures" },
    { name: "Lighting",            slug: "lighting" },
  ],
  "plumbing": [
    { name: "Valves",                  slug: "valves" },
    { name: "Fittings",                slug: "fittings" },
    { name: "Pipe",                    slug: "pipe" },
    { name: "Pipe Tools",              slug: "pipe-tools" },
    { name: "Pipe Cement & Solvents",  slug: "pipe-cement-solvents" },
    { name: "Water Heaters",           slug: "water-heaters" },
    { name: "Pumps",                   slug: "pumps" },
  ],
  "welding": [
    { name: "MIG Welders",          slug: "mig-welders" },
    { name: "Stick Welders",        slug: "stick-welders" },
    { name: "TIG Welders",          slug: "tig-welders" },
    { name: "Welding Wire & Rod",   slug: "welding-wire-rod" },
    { name: "Welding Helmets",      slug: "welding-helmets" },
    { name: "Welding Gloves",       slug: "welding-gloves" },
    { name: "Welding Accessories",  slug: "welding-accessories" },
  ],
  "concrete-masonry": [
    { name: "Concrete Mix",         slug: "concrete-mix" },
    { name: "Masonry Tools",        slug: "masonry-tools" },
    { name: "Sealants & Caulking",  slug: "sealants-caulking" },
    { name: "Concrete Anchors",     slug: "concrete-anchors" },
    { name: "Rebar & Wire Mesh",    slug: "rebar-wire-mesh" },
    { name: "Forms & Shoring",      slug: "forms-shoring" },
  ],
  "cutting-tools": [
    { name: "Drill Bits",  slug: "drill-bits" },
    { name: "Saw Blades",  slug: "saw-blades" },
    { name: "Hole Saws",   slug: "hole-saws" },
    { name: "Taps & Dies", slug: "taps-dies" },
    { name: "End Mills",   slug: "end-mills" },
    { name: "Router Bits", slug: "router-bits" },
  ],
  "lifting-rigging": [
    { name: "Chain Hoists",   slug: "chain-hoists" },
    { name: "Web Slings",     slug: "web-slings" },
    { name: "Chain Slings",   slug: "chain-slings" },
    { name: "Shackles",       slug: "shackles" },
    { name: "Eye Bolts",      slug: "eye-bolts" },
    { name: "Load Binders",   slug: "load-binders" },
    { name: "Jacks & Stands", slug: "jacks-stands" },
  ],
  "janitorial": [
    { name: "Mops & Brooms",       slug: "mops-brooms" },
    { name: "Cleaning Chemicals",  slug: "cleaning-chemicals" },
    { name: "Trash & Waste",       slug: "trash-waste" },
    { name: "Floor Care",          slug: "floor-care" },
    { name: "Paper & Dispensers",  slug: "paper-dispensers" },
    { name: "Safety & Spill",      slug: "safety-spill" },
  ],
};

async function run() {
  const client = await pool.connect();
  try {
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id INT  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        slug        TEXT NOT NULL,
        sort_order  INT  NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT NOW(),
        UNIQUE(category_id, slug)
      )
    `);
    console.log("✓ subcategories table created");

    // Seed from hardcoded list
    let inserted = 0;
    for (const [catSlug, subs] of Object.entries(SUBCATEGORIES)) {
      const catRows = await client.query(`SELECT id FROM categories WHERE slug = $1`, [catSlug]);
      if (!catRows.rows.length) { console.warn(`  ⚠ category not found: ${catSlug}`); continue; }
      const catId = catRows.rows[0].id;
      for (let i = 0; i < subs.length; i++) {
        const { name, slug } = subs[i];
        await client.query(
          `INSERT INTO subcategories (category_id, name, slug, sort_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (category_id, slug) DO NOTHING`,
          [catId, name, slug, i]
        );
        inserted++;
      }
    }
    console.log(`✓ seeded ${inserted} subcategories`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
