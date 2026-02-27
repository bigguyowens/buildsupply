// Run: node migrate_contact_cms.js
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DEFAULTS = {
  hero: {
    badge:    "Get in Touch",
    headline: "We're here to help",
    subtext:  "Whether you're opening an account, tracking an order, or need to talk product specs — our team responds within one business day.",
  },
  form: {
    title:    "Send us a message",
    subtitle: "We typically respond within 1 business day.",
    button:   "Send Message →",
    reasons: [
      "General Inquiry",
      "Open an Account",
      "Order Support",
      "Product Availability",
      "Bulk / Volume Pricing",
      "Returns & Exchanges",
      "Billing Question",
      "Other",
    ],
  },
  quick_contacts: [
    { icon: "📞", label: "Sales & Accounts", value: "(602) 555-0180", href: "tel:+16025550180" },
    { icon: "🎧", label: "Order Support",     value: "(602) 555-0199", href: "tel:+16025550199" },
    { icon: "📧", label: "General Email",     value: "hello@buildsupply.com", href: "mailto:hello@buildsupply.com" },
    { icon: "💬", label: "Live Chat",         value: "Available 6am–6pm MST", href: "#" },
  ],
  hours: [
    { day: "Monday – Friday", hours: "6:00am – 6:00pm MST" },
    { day: "Saturday",        hours: "7:00am – 3:00pm MST" },
    { day: "Sunday",          hours: "Closed" },
  ],
  locations: [
    { city: "Phoenix, AZ",  label: "Headquarters & Distribution", address: "4820 W McDowell Rd, Phoenix, AZ 85035",      phone: "(602) 555-0180", hours: "Mon–Fri 6am–6pm · Sat 7am–3pm", mapUrl: "https://maps.google.com/?q=4820+W+McDowell+Rd+Phoenix+AZ" },
    { city: "Dallas, TX",   label: "Regional Distribution",       address: "2310 Merritt Dr, Garland, TX 75041",          phone: "(972) 555-0241", hours: "Mon–Fri 7am–5pm",               mapUrl: "https://maps.google.com/?q=2310+Merritt+Dr+Garland+TX" },
    { city: "Atlanta, GA",  label: "Regional Distribution",       address: "1640 Marietta Blvd NW, Atlanta, GA 30318",    phone: "(404) 555-0193", hours: "Mon–Fri 7am–5pm",               mapUrl: "https://maps.google.com/?q=1640+Marietta+Blvd+NW+Atlanta+GA" },
  ],
};

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_cms (
        key        TEXT PRIMARY KEY,
        content    JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ contact_cms table created");

    for (const [key, content] of Object.entries(DEFAULTS)) {
      await client.query(
        `INSERT INTO contact_cms (key, content) VALUES ($1, $2)
         ON CONFLICT (key) DO NOTHING`,
        [key, JSON.stringify(content)]
      );
    }
    console.log("✓ seeded contact_cms defaults");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
