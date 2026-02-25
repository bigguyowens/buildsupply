const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_wIrQn0TP2ovB@ep-curly-brook-a8uttnx3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: false },
});

const DEFAULTS = [
  {
    section: "hero",
    enabled: true,
    content: {
      tag: "Our Story",
      headline: "Supply built for people who build things.",
      subtext: "Founded in 2012, BuildSupply exists to put industrial-grade materials in the hands of the contractors, foremen, and project managers who need them — fast, reliably, and at the right price.",
      cta_primary_text: "Shop the Catalog",
      cta_primary_link: "/products",
      cta_secondary_text: "Talk to an Account Manager",
      cta_secondary_link: "/contact",
      bg_image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=60",
    },
  },
  {
    section: "stats",
    enabled: true,
    content: {
      stats: [
        { value: "12+",     label: "Years in Business"  },
        { value: "40,000+", label: "Products Available" },
        { value: "850+",    label: "Brands Carried"      },
        { value: "99.2%",   label: "On-Time Fulfillment" },
      ],
    },
  },
  {
    section: "mission",
    enabled: true,
    content: {
      tag: "Our Mission",
      headline: "The supply house that doesn't make you wait",
      paragraphs: [
        "The construction industry has always tolerated slow, unreliable supply chains because there weren't better options. We decided to be the better option.",
        "Our warehouses are stocked to keep even large projects moving. Our catalog is curated by people who understand what spec-grade really means. And our account team is staffed by former tradespeople who speak your language.",
        "We're not trying to be Amazon for construction. We're trying to be the best supply house in the business — one that happens to have a great website.",
      ],
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
      image_caption: "Commercial jobsite — Phoenix, AZ · 2024",
    },
  },
  {
    section: "values",
    enabled: true,
    content: {
      tag: "What We Stand For",
      headline: "Principles we don't compromise on",
      values: [
        { icon: "🏗", title: "Built for the Trade",          body: "We started on job sites, not in boardrooms. Every product decision is filtered through a single question: would a tradesperson stake their project on this?" },
        { icon: "⚡", title: "Speed When It Counts",         body: "When work is held up waiting on materials, every hour costs money. Our distribution network is optimized for same-day and next-day fulfillment on core items." },
        { icon: "🔍", title: "No Substitutions",             body: "We stock the right grade, the right spec, the right brand. We don't swap out industry-standard products for cheaper alternatives without telling you." },
        { icon: "🤝", title: "Account-Based Relationships",  body: "Dedicated account managers, volume pricing, and net-30 terms for qualified contractors. We grow when you grow." },
      ],
    },
  },
  {
    section: "leadership",
    enabled: true,
    content: {
      tag: "The Team",
      headline: "Leadership",
      people: [
        { name: "Marcus Webb",    title: "CEO & Co-Founder",  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", bio: "20 years in industrial distribution. Former VP at Ferguson before founding BuildSupply in 2012." },
        { name: "Sandra Okafor", title: "VP of Operations",   image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80", bio: "Logistics and supply chain expert. Reduced average order fulfillment time by 40% since joining in 2018." },
        { name: "James Tran",    title: "Head of Sourcing",   image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", bio: "Manages relationships with 850+ manufacturer partners. Former category manager at Grainger." },
      ],
    },
  },
  {
    section: "cta",
    enabled: true,
    content: {
      headline: "Ready to open an account?",
      subtext: "Volume pricing, dedicated account management, and net-30 terms for qualified contractors.",
      cta_primary_text: "Contact Our Team",
      cta_primary_link: "/contact",
      cta_secondary_text: "Create an Account",
      cta_secondary_link: "/register",
    },
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS about_content (
        id         SERIAL PRIMARY KEY,
        section    TEXT UNIQUE NOT NULL,
        enabled    BOOLEAN DEFAULT true,
        content    JSONB DEFAULT '{}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✓ about_content table ready");
    for (const row of DEFAULTS) {
      await client.query(
        `INSERT INTO about_content (section, enabled, content)
         VALUES ($1, $2, $3)
         ON CONFLICT (section) DO NOTHING`,
        [row.section, row.enabled, JSON.stringify(row.content)]
      );
    }
    console.log("✓ 6 sections seeded");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
