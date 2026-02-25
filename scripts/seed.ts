/**
 * Seed script for PostgreSQL — industrial/construction supply data.
 * 
 * Prerequisites:
 *   - PostgreSQL running locally (or set DATABASE_URL env var)
 *   - Database created: createdb nextjs_ecomm
 * 
 * Run:
 *   npx tsx scripts/seed.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require("pg");

const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || "nextjs_ecomm",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
    };

const pool = new Pool(connectionConfig);

async function createSchema() {
  await pool.query(`DROP TABLE IF EXISTS products`);
  await pool.query(`DROP TABLE IF EXISTS categories`);

  await pool.query(`
    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT ''
    )
  `);

  await pool.query(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL DEFAULT '',
      tags TEXT[] NOT NULL DEFAULT '{}',
      image TEXT NOT NULL DEFAULT '',
      gallery TEXT[] NOT NULL DEFAULT '{}',
      rating NUMERIC(3,2) NOT NULL DEFAULT 4.0,
      rating_count INT NOT NULL DEFAULT 0,
      inventory INT NOT NULL DEFAULT 100,
      featured BOOLEAN NOT NULL DEFAULT false,
      brand TEXT NOT NULL DEFAULT '',
      sku TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'each'
    )
  `);
  console.log("✅ Schema created");
}

const IMG = {
  concrete1: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  concrete2: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  safety1:   "https://images.unsplash.com/photo-1618090583686-0b09b8c0e5a9?auto=format&fit=crop&w=800&q=80",
  safety2:   "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
  tools1:    "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  tools2:    "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
  fastener1: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  water1:    "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
  form1:     "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
};

const CATEGORIES = [
  { id: "cat-concrete",      name: "Concrete & Masonry",       slug: "concrete-masonry",       description: "Concrete mix, masonry tools, forms, and accessories for foundations and flatwork.", image: IMG.concrete1 },
  { id: "cat-safety",        name: "Safety & PPE",              slug: "safety-ppe",              description: "Hard hats, gloves, high-vis vests, eye protection, and fall protection gear.",      image: IMG.safety1   },
  { id: "cat-tools",         name: "Tools & Equipment",         slug: "tools-equipment",         description: "Power tools, hand tools, and heavy equipment for every phase of construction.",     image: IMG.tools1    },
  { id: "cat-fasteners",     name: "Fasteners & Hardware",      slug: "fasteners-hardware",      description: "Anchors, bolts, screws, and specialty fasteners for structural applications.",      image: IMG.fastener1 },
  { id: "cat-waterproofing", name: "Waterproofing & Sealants",  slug: "waterproofing-sealants",  description: "Below-grade waterproofing, caulks, joint fillers, and elastomeric sealants.",       image: IMG.water1    },
  { id: "cat-forming",       name: "Forming & Shoring",         slug: "forming-shoring",         description: "Form panels, ties, spreaders, and shoring systems for poured concrete structures.", image: IMG.form1     },
];

const PRODUCTS = [
  // Concrete & Masonry
  { id:"p-001", name:"80 lb. Quikrete Concrete Mix",                slug:"quikrete-concrete-mix-80lb",        description:"High-strength Portland cement blend. Sets 24–48 hrs. For footings, slabs, steps, posts.",             price:7.98,   category:"Concrete & Masonry", subcategory:"Concrete Mix",          tags:["concrete","mix","portland","slab"],                image:IMG.concrete1, gallery:[IMG.concrete1,IMG.concrete2], rating:4.7, ratingCount:2341, inventory:5000, featured:true,  brand:"Quikrete",             sku:"QKR-80LB",           unit:"bag"      },
  { id:"p-002", name:"50 lb. Quikrete Fast-Setting Concrete",        slug:"quikrete-fast-setting-50lb",        description:"Sets posts in 20–40 min without mixing. Pour directly in hole. Great for fence and deck posts.",     price:8.47,   category:"Concrete & Masonry", subcategory:"Concrete Mix",          tags:["concrete","fast-setting","post"],                  image:IMG.concrete2, gallery:[IMG.concrete2,IMG.concrete1], rating:4.6, ratingCount:1820, inventory:3200, featured:false, brand:"Quikrete",             sku:"QKR-FS50",           unit:"bag"      },
  { id:"p-003", name:"Marshalltown 16\" Magnesium Bull Float",        slug:"marshalltown-bull-float-16",        description:"Lightweight mag float for smoothing concrete flatwork. Tapered edges prevent score marks.",           price:54.99,  category:"Concrete & Masonry", subcategory:"Concrete Tools",        tags:["float","finishing","concrete tools"],              image:IMG.tools1,    gallery:[IMG.tools1,IMG.concrete1],    rating:4.8, ratingCount:430,  inventory:150,  featured:true,  brand:"Marshalltown",         sku:"MAR-BF16",           unit:"each"     },
  { id:"p-004", name:"Kraft Tool Concrete Edger 1/2\" Radius",        slug:"kraft-tool-concrete-edger",         description:"Pro stainless steel edger. 1/2\" radius x 1-1/4\" depth. Clean rounded edges on flatwork.",          price:19.49,  category:"Concrete & Masonry", subcategory:"Concrete Tools",        tags:["edger","finishing","concrete"],                    image:IMG.tools2,    gallery:[IMG.tools2,IMG.tools1],       rating:4.5, ratingCount:276,  inventory:200,  featured:false, brand:"Kraft Tool",           sku:"KTL-EDG050",         unit:"each"     },
  { id:"p-005", name:"50 lb. Mason Mix Type S Mortar",                slug:"quikrete-mason-mix-type-s",         description:"Pre-blended Type S masonry mortar for brick, block, and stone. Meets ASTM C270.",                    price:11.28,  category:"Concrete & Masonry", subcategory:"Mortar",                tags:["mortar","masonry","brick","block"],                image:IMG.concrete1, gallery:[IMG.concrete1,IMG.concrete2], rating:4.4, ratingCount:892,  inventory:2400, featured:false, brand:"Quikrete",             sku:"QKR-MS50",           unit:"bag"      },
  // Safety & PPE
  { id:"p-010", name:"MSA V-Gard Hard Hat White",                     slug:"msa-vgard-hard-hat-white",          description:"Type I, Class E thermoplastic hard hat. ANSI/ISEA Z89.1. 4-point ratchet suspension.",               price:14.79,  category:"Safety & PPE",       subcategory:"Head Protection",       tags:["hard hat","head protection","ANSI","PPE"],         image:IMG.safety1,   gallery:[IMG.safety1,IMG.safety2],    rating:4.8, ratingCount:3120, inventory:1200, featured:true,  brand:"MSA Safety",           sku:"MSA-VG-WHT",         unit:"each"     },
  { id:"p-011", name:"3M Peltor X5A Earmuffs NRR 31",                 slug:"3m-peltor-x5a-earmuffs",            description:"NRR 31 dB over-ear protection. Dual-chamber cups with liquid/foam cushions. Folds flat.",            price:34.97,  category:"Safety & PPE",       subcategory:"Hearing Protection",    tags:["earmuffs","hearing protection","NRR31"],           image:IMG.safety2,   gallery:[IMG.safety2,IMG.safety1],    rating:4.9, ratingCount:5800, inventory:800,  featured:true,  brand:"3M",                   sku:"3M-X5A",             unit:"each"     },
  { id:"p-012", name:"Mechanix Wear Original Gloves Large",           slug:"mechanix-original-gloves-lg",       description:"Synthetic leather palm, TPR cuff. Touchscreen fingertips. Machine washable.",                       price:13.95,  category:"Safety & PPE",       subcategory:"Hand Protection",       tags:["gloves","work gloves","mechanix"],                 image:IMG.safety1,   gallery:[IMG.safety1,IMG.safety2],    rating:4.7, ratingCount:9200, inventory:3000, featured:false, brand:"Mechanix Wear",        sku:"MWR-OG-LG",          unit:"pair"     },
  { id:"p-013", name:"Pyramex Hi-Vis Class 2 Safety Vest",            slug:"pyramex-hi-vis-class2-vest",        description:"ANSI/ISEA 107 Class 2 lime vest. Silver reflective tape. Mesh back, front zipper.",                 price:8.49,   category:"Safety & PPE",       subcategory:"High Visibility",       tags:["hi-vis","vest","ANSI","safety"],                   image:IMG.safety2,   gallery:[IMG.safety2,IMG.safety1],    rating:4.5, ratingCount:4200, inventory:2500, featured:false, brand:"Pyramex",              sku:"PYR-HV2-L",          unit:"each"     },
  { id:"p-014", name:"DeWalt Safety Glasses Clear DPG54",             slug:"dewalt-safety-glasses-clear",       description:"Wraparound polycarbonate lens, anti-scratch + anti-fog. ANSI Z87.1 rated.",                        price:6.97,   category:"Safety & PPE",       subcategory:"Eye Protection",        tags:["safety glasses","eye protection","ANSI Z87"],      image:IMG.safety1,   gallery:[IMG.safety1,IMG.safety2],    rating:4.6, ratingCount:7600, inventory:4000, featured:false, brand:"DeWalt",               sku:"DWL-DPG54",          unit:"each"     },
  // Tools & Equipment
  { id:"p-020", name:"Milwaukee M18 FUEL 1/2\" Hammer Drill",         slug:"milwaukee-m18-hammer-drill",        description:"POWERSTATE brushless motor, 1,200 in-lbs torque. 4-mode DRIVE CONTROL. Tool-only.",                 price:199.00, category:"Tools & Equipment",  subcategory:"Power Drills",          tags:["drill","milwaukee","m18","brushless"],             image:IMG.tools1,    gallery:[IMG.tools1,IMG.tools2],       rating:4.9, ratingCount:11400,inventory:300,  featured:true,  brand:"Milwaukee",            sku:"MIL-2804-20",        unit:"each"     },
  { id:"p-021", name:"DeWalt 7-1/4\" Circular Saw DWE575SB",          slug:"dewalt-circular-saw-dwe575sb",      description:"15-amp, 5,200 RPM. 8.8 lb lightweight design. 50° bevel capacity, positive stops.",                price:109.00, category:"Tools & Equipment",  subcategory:"Saws",                  tags:["circular saw","dewalt","saw"],                     image:IMG.tools2,    gallery:[IMG.tools2,IMG.tools1],       rating:4.8, ratingCount:6700, inventory:200,  featured:false, brand:"DeWalt",               sku:"DWL-DWE575SB",       unit:"each"     },
  { id:"p-022", name:"Hilti TE 60-ATC/AVR SDS Max Rotary Hammer",     slug:"hilti-te60-rotary-hammer",          description:"10.5 amp, 8.8 J impact energy. Active vibration reduction for all-day use on concrete.",           price:649.00, category:"Tools & Equipment",  subcategory:"Rotary Hammers",        tags:["rotary hammer","hilti","SDS max","concrete"],      image:IMG.tools1,    gallery:[IMG.tools1,IMG.tools2],       rating:4.9, ratingCount:830,  inventory:50,   featured:true,  brand:"Hilti",                sku:"HLT-TE60",           unit:"each"     },
  { id:"p-023", name:"Stabila 24\" Magnetic Box Beam Level",           slug:"stabila-24-level-196m",             description:"Pro aluminum box beam level. Magnetic base. 3 precision vials. ±0.5 mm/m accuracy.",               price:89.99,  category:"Tools & Equipment",  subcategory:"Levels & Measuring",    tags:["level","stabila","magnetic","box beam"],           image:IMG.tools2,    gallery:[IMG.tools2,IMG.tools1],       rating:4.9, ratingCount:2100, inventory:400,  featured:false, brand:"Stabila",              sku:"STB-196M-24",        unit:"each"     },
  // Fasteners & Hardware
  { id:"p-030", name:"Titen HD Screw Anchor 3/8\" x 3\" 25-Pack",     slug:"titen-hd-screw-anchor-3-8x3-25pk", description:"High-strength screw anchor for concrete and masonry. Removable. ICC ESR-2713.",                    price:22.47,  category:"Fasteners & Hardware",subcategory:"Concrete Anchors",      tags:["anchor","screw anchor","concrete","titen"],        image:IMG.fastener1, gallery:[IMG.fastener1,IMG.tools1],    rating:4.8, ratingCount:1540, inventory:1800, featured:false, brand:"Simpson Strong-Tie",   sku:"SST-THDH38300HC25",  unit:"box"      },
  { id:"p-031", name:"ITW Red Head Epoxy Adhesive Anchor 28 oz",       slug:"red-head-epoxy-28oz",               description:"High-strength epoxy for threaded rod and rebar anchoring. 15–20 min workable. ICC ESR-3044.",      price:58.99,  category:"Fasteners & Hardware",subcategory:"Adhesive Anchors",      tags:["epoxy","adhesive anchor","threaded rod"],          image:IMG.fastener1, gallery:[IMG.fastener1,IMG.concrete1],  rating:4.7, ratingCount:680,  inventory:600,  featured:false, brand:"ITW Red Head",         sku:"RH-EP28",            unit:"cartridge"},
  { id:"p-032", name:"Hilti KB3 Wedge Anchor 1/2\" x 5-1/2\" 25-Pack",slug:"hilti-kb3-wedge-anchor-25pk",       description:"Carbon steel wedge anchor for cracked/uncracked concrete. ESR-3385 approved.",                    price:49.00,  category:"Fasteners & Hardware",subcategory:"Wedge Anchors",         tags:["wedge anchor","hilti","concrete","KB3"],           image:IMG.fastener1, gallery:[IMG.fastener1,IMG.tools1],    rating:4.8, ratingCount:910,  inventory:900,  featured:true,  brand:"Hilti",                sku:"HLT-KB3-1225",       unit:"box"      },
  // Waterproofing & Sealants
  { id:"p-040", name:"BASF MasterSeal 590 10.1 oz Gray Caulk",        slug:"basf-masterseal-590-gray",          description:"Single-component polyurethane sealant. 50% movement capacity. Bonds concrete, masonry, metal.",     price:12.49,  category:"Waterproofing & Sealants",subcategory:"Polyurethane Sealants",tags:["sealant","caulk","polyurethane","BASF"],          image:IMG.water1,    gallery:[IMG.water1,IMG.concrete1],    rating:4.7, ratingCount:720,  inventory:2000, featured:false, brand:"BASF",                 sku:"BASF-MS590-GY",      unit:"tube"     },
  { id:"p-041", name:"Tremco Vulkem 116 Primer 1 Gallon",              slug:"tremco-vulkem-116-primer-1gal",     description:"Moisture-curing polyurethane primer for concrete, masonry, and metal. Required for Vulkem 116.",    price:62.00,  category:"Waterproofing & Sealants",subcategory:"Primers",             tags:["primer","polyurethane","tremco"],                  image:IMG.water1,    gallery:[IMG.water1,IMG.concrete2],    rating:4.6, ratingCount:380,  inventory:500,  featured:false, brand:"Tremco",               sku:"TRM-V116-1G",        unit:"gallon"   },
  { id:"p-042", name:"Grace ICE & WATER SHIELD 36\" x 75' Roll",       slug:"grace-ice-water-shield-roll",       description:"Self-adhering bituminous waterproofing membrane. Seals around fasteners. 225 sq ft.",               price:119.00, category:"Waterproofing & Sealants",subcategory:"Waterproofing Membrane",tags:["waterproofing","membrane","self-adhering","grace"],image:IMG.water1,    gallery:[IMG.water1,IMG.concrete1],    rating:4.8, ratingCount:1100, inventory:350,  featured:true,  brand:"Grace",                sku:"GRC-IWS36",          unit:"roll"     },
  // Forming & Shoring
  { id:"p-050", name:"Symons Steel-Ply 2' x 8' Form Panel",           slug:"symons-steel-ply-2x8",              description:"Steel-framed HDO plywood-faced concrete form. 1,000 psf rated. Standard 2\" hole pattern.",         price:189.00, category:"Forming & Shoring",  subcategory:"Form Panels",           tags:["form panel","symons","concrete form"],             image:IMG.form1,     gallery:[IMG.form1,IMG.concrete1],     rating:4.7, ratingCount:460,  inventory:400,  featured:true,  brand:"Symons",               sku:"SYM-SP2X8",          unit:"each"     },
  { id:"p-051", name:"Dayton Superior 5/8\" x 5\" She-Bolt Nut",       slug:"dayton-superior-she-bolt-5-8",      description:"Standard she-bolt nut for Snap-Tie forming systems. Hot-dip galvanized. Wrench installation.",       price:1.89,   category:"Forming & Shoring",  subcategory:"Form Hardware",         tags:["she-bolt","snap-tie","form hardware"],             image:IMG.form1,     gallery:[IMG.form1,IMG.fastener1],     rating:4.6, ratingCount:320,  inventory:10000,featured:false, brand:"Dayton Superior",      sku:"DS-SBN58",           unit:"each"     },
  { id:"p-052", name:"Waco Screw Jack Post Shore 5'–8' Adjustable",    slug:"waco-screw-jack-shore-5-8",         description:"All-steel adjustable shoring post. 1-5/8\" OD outer pipe. 9,000 lb capacity.",                      price:44.99,  category:"Forming & Shoring",  subcategory:"Shoring",               tags:["shoring","screw jack","post shore"],               image:IMG.form1,     gallery:[IMG.form1,IMG.concrete2],     rating:4.5, ratingCount:195,  inventory:600,  featured:false, brand:"Waco",                 sku:"WAC-SJ58",           unit:"each"     },
];

async function seedCategories() {
  for (const cat of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (id, name, slug, description, image) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [cat.id, cat.name, cat.slug, cat.description, cat.image]
    );
  }
  console.log(`✅ Seeded ${CATEGORIES.length} categories`);
}

async function seedProducts() {
  for (const p of PRODUCTS) {
    await pool.query(
      `INSERT INTO products (id, name, slug, description, price, currency, category, subcategory, tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit)
       VALUES ($1,$2,$3,$4,$5,'USD',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.slug, p.description, p.price, p.category, p.subcategory, p.tags, p.image, p.gallery, p.rating, p.ratingCount, p.inventory, p.featured, p.brand, p.sku, p.unit]
    );
  }
  console.log(`✅ Seeded ${PRODUCTS.length} products`);
}

async function main() {
  console.log("🌱 Starting seed...");
  try {
    await createSchema();
    await seedCategories();
    await seedProducts();
    console.log("🎉 Seed complete!");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
