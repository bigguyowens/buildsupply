const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const SEED = [
  { name: "Southeast Hub",    city: "Atlanta",      state: "GA", zip: "30301", address: "1200 Industrial Pkwy NW",    phone: "(404) 555-0100", lat: 33.7490, lon: -84.3880, hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",  services: ["Will Call","Bulk Freight","Forklift Loading","Returns"] },
  { name: "Midwest Hub",      city: "Chicago",      state: "IL", zip: "60638", address: "400 Commerce Dr",            phone: "(312) 555-0200", lat: 41.8781, lon: -87.6298, hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",  services: ["Will Call","Bulk Freight","Forklift Loading","Same-Day Metro"] },
  { name: "South Central Hub",city: "Dallas",       state: "TX", zip: "75207", address: "900 Supply Blvd",            phone: "(214) 555-0300", lat: 32.7767, lon: -96.7970, hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",  services: ["Will Call","Bulk Freight","Forklift Loading"] },
  { name: "West Coast Hub",   city: "Los Angeles",  state: "CA", zip: "90058", address: "2500 Harbor Ave",            phone: "(213) 555-0400", lat: 34.0522, lon: -118.2437,hours: "Mon–Fri 6am–7pm · Sat 7am–5pm",  services: ["Will Call","Bulk Freight","Forklift Loading","Port Pickup"] },
  { name: "Northeast Hub",    city: "Philadelphia", state: "PA", zip: "19112", address: "750 Warehouse Row",          phone: "(215) 555-0500", lat: 39.9526, lon: -75.1652, hours: "Mon–Fri 7am–6pm · Sat 8am–4pm",  services: ["Will Call","Bulk Freight","Forklift Loading","Returns"] },
  { name: "Southwest Hub",    city: "Phoenix",      state: "AZ", zip: "85043", address: "1800 Desert Industrial Dr",  phone: "(602) 555-0600", lat: 33.4484, lon: -112.0740,hours: "Mon–Fri 7am–6pm · Sat 8am–2pm",  services: ["Will Call","Bulk Freight","Forklift Loading"] },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS distribution_centers (
        id         SERIAL PRIMARY KEY,
        name       TEXT        NOT NULL,
        city       TEXT        NOT NULL,
        state      TEXT        NOT NULL,
        zip        TEXT        NOT NULL,
        address    TEXT        NOT NULL,
        phone      TEXT        NOT NULL,
        lat        NUMERIC(9,6) NOT NULL,
        lon        NUMERIC(9,6) NOT NULL,
        hours      TEXT        NOT NULL,
        services   TEXT[]      NOT NULL DEFAULT '{}',
        active     BOOLEAN     NOT NULL DEFAULT TRUE,
        sort_order INT         NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Table created");

    const { rows } = await client.query("SELECT COUNT(*) FROM distribution_centers");
    if (parseInt(rows[0].count) > 0) {
      console.log("⏭  Table already has data — skipping seed");
    } else {
      for (let i = 0; i < SEED.length; i++) {
        const s = SEED[i];
        await client.query(
          `INSERT INTO distribution_centers (name,city,state,zip,address,phone,lat,lon,hours,services,sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [s.name, s.city, s.state, s.zip, s.address, s.phone, s.lat, s.lon, s.hours, s.services, i]
        );
      }
      console.log(`✅ Seeded ${SEED.length} distribution centers`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
