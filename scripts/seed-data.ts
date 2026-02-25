const CATEGORIES = [
  {
    id: "cat-concrete",
    name: "Concrete & Masonry",
    slug: "concrete-masonry",
    description: "Concrete mix, masonry tools, forms, and accessories for foundations and flatwork.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-safety",
    name: "Safety & PPE",
    slug: "safety-ppe",
    description: "Hard hats, gloves, high-vis vests, eye protection, and fall protection gear.",
    image: "https://images.unsplash.com/photo-1618090583686-0b09b8c0e5a9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-tools",
    name: "Tools & Equipment",
    slug: "tools-equipment",
    description: "Power tools, hand tools, and heavy equipment for every phase of construction.",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-fasteners",
    name: "Fasteners & Hardware",
    slug: "fasteners-hardware",
    description: "Anchors, bolts, screws, and specialty fasteners for structural and finish applications.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-waterproofing",
    name: "Waterproofing & Sealants",
    slug: "waterproofing-sealants",
    description: "Below-grade waterproofing, caulks, joint fillers, and elastomeric sealants.",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cat-forming",
    name: "Forming & Shoring",
    slug: "forming-shoring",
    description: "Form panels, ties, spreaders, and shoring systems for poured concrete structures.",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
  },
];

// Images reused from Unsplash
const IMG = {
  concrete1: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  concrete2: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  safety1: "https://images.unsplash.com/photo-1618090583686-0b09b8c0e5a9?auto=format&fit=crop&w=800&q=80",
  safety2: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
  tools1: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  tools2: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80",
  fastener1: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  water1: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
  form1: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
};

type ProductSeed = {
  id: string; name: string; slug: string; description: string;
  price: number; category: string; subcategory: string; tags: string[];
  image: string; gallery: string[]; rating: number; ratingCount: number;
  inventory: number; featured: boolean; brand: string; sku: string; unit: string;
};

const PRODUCTS: ProductSeed[] = [
  // ── Concrete & Masonry ──────────────────────────────────────────────────
  {
    id: "p-001", name: "80 lb. Quikrete Concrete Mix", slug: "quikrete-concrete-mix-80lb",
    description: "High-strength blend of Portland cement, sand, and gravel. Sets in 24–48 hours. Ideal for footings, slabs, steps, and posts.",
    price: 7.98, category: "Concrete & Masonry", subcategory: "Concrete Mix",
    tags: ["concrete", "mix", "portland", "slab"], image: IMG.concrete1,
    gallery: [IMG.concrete1, IMG.concrete2], rating: 4.7, ratingCount: 2341,
    inventory: 5000, featured: true, brand: "Quikrete", sku: "QKR-80LB", unit: "bag",
  },
  {
    id: "p-002", name: "50 lb. Quikrete Fast-Setting Concrete", slug: "quikrete-fast-setting-50lb",
    description: "Sets posts in 20–40 minutes without mixing. Pour directly into hole. Perfect for deck posts and fence posts.",
    price: 8.47, category: "Concrete & Masonry", subcategory: "Concrete Mix",
    tags: ["concrete", "fast-setting", "post"], image: IMG.concrete2,
    gallery: [IMG.concrete2, IMG.concrete1], rating: 4.6, ratingCount: 1820,
    inventory: 3200, featured: false, brand: "Quikrete", sku: "QKR-FS50", unit: "bag",
  },
  {
    id: "p-003", name: "Marshalltown 16\" Magnesium Bull Float", slug: "marshalltown-bull-float-16",
    description: "Lightweight magnesium float for smoothing and finishing concrete flatwork. Tapered edges prevent score marks.",
    price: 54.99, category: "Concrete & Masonry", subcategory: "Concrete Tools",
    tags: ["float", "finishing", "concrete tools"], image: IMG.tools1,
    gallery: [IMG.tools1, IMG.concrete1], rating: 4.8, ratingCount: 430,
    inventory: 150, featured: true, brand: "Marshalltown", sku: "MAR-BF16", unit: "each",
  },
  {
    id: "p-004", name: "Kraft Tool Concrete Edger 1/2\" Radius", slug: "kraft-tool-concrete-edger",
    description: "Professional stainless steel edger for creating clean, rounded edges on concrete flatwork. 1/2\" radius x 1-1/4\" depth.",
    price: 19.49, category: "Concrete & Masonry", subcategory: "Concrete Tools",
    tags: ["edger", "finishing", "concrete"], image: IMG.tools2,
    gallery: [IMG.tools2, IMG.tools1], rating: 4.5, ratingCount: 276,
    inventory: 200, featured: false, brand: "Kraft Tool", sku: "KTL-EDG050", unit: "each",
  },
  {
    id: "p-005", name: "50 lb. Mason Mix Type S Mortar", slug: "quikrete-mason-mix-type-s",
    description: "Pre-blended Type S masonry mortar for laying brick, block, and stone. Exceeds ASTM C270 standards.",
    price: 11.28, category: "Concrete & Masonry", subcategory: "Mortar",
    tags: ["mortar", "masonry", "brick", "block"], image: IMG.concrete1,
    gallery: [IMG.concrete1, IMG.concrete2], rating: 4.4, ratingCount: 892,
    inventory: 2400, featured: false, brand: "Quikrete", sku: "QKR-MS50", unit: "bag",
  },

  // ── Safety & PPE ────────────────────────────────────────────────────────
  {
    id: "p-010", name: "MSA V-Gard Hard Hat Slotted White", slug: "msa-vgard-hard-hat-white",
    description: "Type I, Class E thermoplastic suspension hard hat. ANSI/ISEA Z89.1 compliant. 4-point suspension with ratchet adjustment.",
    price: 14.79, category: "Safety & PPE", subcategory: "Head Protection",
    tags: ["hard hat", "head protection", "ANSI", "PPE"], image: IMG.safety1,
    gallery: [IMG.safety1, IMG.safety2], rating: 4.8, ratingCount: 3120,
    inventory: 1200, featured: true, brand: "MSA Safety", sku: "MSA-VG-WHT", unit: "each",
  },
  {
    id: "p-011", name: "3M Peltor X5A Over-Ear Earmuffs NRR 31", slug: "3m-peltor-x5a-earmuffs",
    description: "Industry-leading NRR 31 dB noise reduction. Dual-chamber ear cups with liquid/foam combination cushions. Folds flat for storage.",
    price: 34.97, category: "Safety & PPE", subcategory: "Hearing Protection",
    tags: ["earmuffs", "hearing protection", "NRR31"], image: IMG.safety2,
    gallery: [IMG.safety2, IMG.safety1], rating: 4.9, ratingCount: 5800,
    inventory: 800, featured: true, brand: "3M", sku: "3M-X5A", unit: "each",
  },
  {
    id: "p-012", name: "Mechanix Wear Original Gloves Large", slug: "mechanix-original-gloves-lg",
    description: "Synthetic leather palm with thermoplastic rubber cuff closure. Touchscreen-compatible fingertips. Machine washable.",
    price: 13.95, category: "Safety & PPE", subcategory: "Hand Protection",
    tags: ["gloves", "work gloves", "mechanix"], image: IMG.safety1,
    gallery: [IMG.safety1, IMG.safety2], rating: 4.7, ratingCount: 9200,
    inventory: 3000, featured: false, brand: "Mechanix Wear", sku: "MWR-OG-LG", unit: "pair",
  },
  {
    id: "p-013", name: "Pyramex Hi-Vis Class 2 Safety Vest", slug: "pyramex-hi-vis-class2-vest",
    description: "ANSI/ISEA 107 Class 2 high-visibility lime vest with silver reflective tape. Mesh back, front zipper closure.",
    price: 8.49, category: "Safety & PPE", subcategory: "High Visibility",
    tags: ["hi-vis", "vest", "ANSI", "safety"], image: IMG.safety2,
    gallery: [IMG.safety2, IMG.safety1], rating: 4.5, ratingCount: 4200,
    inventory: 2500, featured: false, brand: "Pyramex", sku: "PYR-HV2-L", unit: "each",
  },
  {
    id: "p-014", name: "Dewalt Safety Glasses Clear DPG54-1D", slug: "dewalt-safety-glasses-clear",
    description: "Wraparound polycarbonate lens with anti-scratch and anti-fog coating. ANSI Z87.1 rated. Soft temple tips.",
    price: 6.97, category: "Safety & PPE", subcategory: "Eye Protection",
    tags: ["safety glasses", "eye protection", "ANSI Z87"], image: IMG.safety1,
    gallery: [IMG.safety1, IMG.safety2], rating: 4.6, ratingCount: 7600,
    inventory: 4000, featured: false, brand: "DeWalt", sku: "DWL-DPG54", unit: "each",
  },

  // ── Tools & Equipment ───────────────────────────────────────────────────
  {
    id: "p-020", name: "Milwaukee M18 FUEL 1/2\" Hammer Drill/Driver", slug: "milwaukee-m18-hammer-drill",
    description: "POWERSTATE brushless motor delivers 1,200 in-lbs of torque. 4-mode DRIVE CONTROL. All-metal ratcheting chuck. Tool-only.",
    price: 199.00, category: "Tools & Equipment", subcategory: "Power Drills",
    tags: ["drill", "milwaukee", "m18", "brushless"], image: IMG.tools1,
    gallery: [IMG.tools1, IMG.tools2], rating: 4.9, ratingCount: 11400,
    inventory: 300, featured: true, brand: "Milwaukee", sku: "MIL-2804-20", unit: "each",
  },
  {
    id: "p-021", name: "DeWalt 7-1/4\" Circular Saw DWE575SB", slug: "dewalt-circular-saw-dwe575sb",
    description: "15-amp motor with 5,200 RPM for fast, accurate cuts. Lightweight 8.8 lb design. 50° bevel capacity with positive stops.",
    price: 109.00, category: "Tools & Equipment", subcategory: "Saws",
    tags: ["circular saw", "dewalt", "saw"], image: IMG.tools2,
    gallery: [IMG.tools2, IMG.tools1], rating: 4.8, ratingCount: 6700,
    inventory: 200, featured: false, brand: "DeWalt", sku: "DWL-DWE575SB", unit: "each",
  },
  {
    id: "p-022", name: "Hilti TE 60-ATC/AVR SDS Max Rotary Hammer", slug: "hilti-te60-rotary-hammer",
    description: "10.5 amp, 8.8 J impact energy for concrete drilling and chiseling. Active vibration reduction keeps fatigue low on long shifts.",
    price: 649.00, category: "Tools & Equipment", subcategory: "Rotary Hammers",
    tags: ["rotary hammer", "hilti", "SDS max", "concrete"], image: IMG.tools1,
    gallery: [IMG.tools1, IMG.tools2], rating: 4.9, ratingCount: 830,
    inventory: 50, featured: true, brand: "Hilti", sku: "HLT-TE60", unit: "each",
  },
  {
    id: "p-023", name: "Stabila 24\" Magnetic Box Beam Level", slug: "stabila-24-level-196m",
    description: "Professional aluminum box beam level with powerful magnetic base. 3 precision vials. ±0.5 mm/m accuracy.",
    price: 89.99, category: "Tools & Equipment", subcategory: "Levels & Measuring",
    tags: ["level", "stabila", "magnetic", "box beam"], image: IMG.tools2,
    gallery: [IMG.tools2, IMG.tools1], rating: 4.9, ratingCount: 2100,
    inventory: 400, featured: false, brand: "Stabila", sku: "STB-196M-24", unit: "each",
  },

  // ── Fasteners & Hardware ────────────────────────────────────────────────
  {
    id: "p-030", name: "Titen HD Screw Anchor 3/8\" x 3\" (25-Pack)", slug: "titen-hd-screw-anchor-3-8x3-25pk",
    description: "High-strength screw anchor for concrete and masonry. Removable and reusable. Hex head design. ICC ESR-2713 listed.",
    price: 22.47, category: "Fasteners & Hardware", subcategory: "Concrete Anchors",
    tags: ["anchor", "screw anchor", "concrete", "titen"], image: IMG.fastener1,
    gallery: [IMG.fastener1, IMG.tools1], rating: 4.8, ratingCount: 1540,
    inventory: 1800, featured: false, brand: "Simpson Strong-Tie", sku: "SST-THDH38300HC25", unit: "box",
  },
  {
    id: "p-031", name: "Red Head Epoxy Adhesive Anchor 28 oz Cartridge", slug: "red-head-epoxy-28oz",
    description: "High-strength epoxy for anchoring threaded rod and rebar. Workable time: 15–20 min. Cure: 24 hrs @ 75°F. ICC ESR-3044.",
    price: 58.99, category: "Fasteners & Hardware", subcategory: "Adhesive Anchors",
    tags: ["epoxy", "adhesive anchor", "threaded rod"], image: IMG.fastener1,
    gallery: [IMG.fastener1, IMG.concrete1], rating: 4.7, ratingCount: 680,
    inventory: 600, featured: false, brand: "ITW Red Head", sku: "RH-EP28", unit: "cartridge",
  },
  {
    id: "p-032", name: "Hilti KB3 Wedge Anchor 1/2\" x 5-1/2\" (25-Pack)", slug: "hilti-kb3-wedge-anchor-25pk",
    description: "Carbon steel wedge anchor for cracked and uncracked concrete. ESR-3385 approved. Use with standard hex nut and washer.",
    price: 49.00, category: "Fasteners & Hardware", subcategory: "Wedge Anchors",
    tags: ["wedge anchor", "hilti", "concrete", "KB3"], image: IMG.fastener1,
    gallery: [IMG.fastener1, IMG.tools1], rating: 4.8, ratingCount: 910,
    inventory: 900, featured: true, brand: "Hilti", sku: "HLT-KB3-1225", unit: "box",
  },

  // ── Waterproofing & Sealants ─────────────────────────────────────────────
  {
    id: "p-040", name: "BASF MasterSeal 590 10.1 oz Gray Caulk", slug: "basf-masterseal-590-gray",
    description: "Single-component polyurethane sealant. Excellent adhesion to concrete, masonry, and metal. Shore A hardness: 25. 50% movement.",
    price: 12.49, category: "Waterproofing & Sealants", subcategory: "Polyurethane Sealants",
    tags: ["sealant", "caulk", "polyurethane", "BASF"], image: IMG.water1,
    gallery: [IMG.water1, IMG.concrete1], rating: 4.7, ratingCount: 720,
    inventory: 2000, featured: false, brand: "BASF", sku: "BASF-MS590-GY", unit: "tube",
  },
  {
    id: "p-041", name: "Tremco Vulkem 116 Primer 1 Gallon", slug: "tremco-vulkem-116-primer-1gal",
    description: "Moisture-curing polyurethane primer for concrete, masonry, and metal surfaces. Required for Vulkem 116 sealant applications.",
    price: 62.00, category: "Waterproofing & Sealants", subcategory: "Primers",
    tags: ["primer", "polyurethane", "tremco"], image: IMG.water1,
    gallery: [IMG.water1, IMG.concrete2], rating: 4.6, ratingCount: 380,
    inventory: 500, featured: false, brand: "Tremco", sku: "TRM-V116-1G", unit: "gallon",
  },
  {
    id: "p-042", name: "Grace ICE & WATER SHIELD 36\" x 75' Roll", slug: "grace-ice-water-shield-roll",
    description: "Self-adhering, bituminous waterproofing membrane. Seals around fasteners. 225 sq ft roll. For roofing and below-grade applications.",
    price: 119.00, category: "Waterproofing & Sealants", subcategory: "Waterproofing Membrane",
    tags: ["waterproofing", "membrane", "self-adhering", "grace"], image: IMG.water1,
    gallery: [IMG.water1, IMG.concrete1], rating: 4.8, ratingCount: 1100,
    inventory: 350, featured: true, brand: "Grace", sku: "GRC-IWS36", unit: "roll",
  },

  // ── Forming & Shoring ────────────────────────────────────────────────────
  {
    id: "p-050", name: "Symons Steel-Ply 2' x 8' Form Panel", slug: "symons-steel-ply-2x8",
    description: "Steel-framed plywood-faced concrete form panel. 1-1/8\" thick HDO plywood face. Rated for 1,000 psf. Standard 2\" hole pattern.",
    price: 189.00, category: "Forming & Shoring", subcategory: "Form Panels",
    tags: ["form panel", "symons", "concrete form"], image: IMG.form1,
    gallery: [IMG.form1, IMG.concrete1], rating: 4.7, ratingCount: 460,
    inventory: 400, featured: true, brand: "Symons", sku: "SYM-SP2X8", unit: "each",
  },
  {
    id: "p-051", name: "Dayton Superior 5/8\" x 5\" She-Bolt Nut", slug: "dayton-superior-she-bolt-5-8",
    description: "Standard she-bolt nut for Snap-Tie concrete forming systems. Hot-dip galvanized. Installs with standard wrench.",
    price: 1.89, category: "Forming & Shoring", subcategory: "Form Hardware",
    tags: ["she-bolt", "snap-tie", "form hardware"], image: IMG.form1,
    gallery: [IMG.form1, IMG.fastener1], rating: 4.6, ratingCount: 320,
    inventory: 10000, featured: false, brand: "Dayton Superior", sku: "DS-SBN58", unit: "each",
  },
  {
    id: "p-052", name: "Waco Screw Jack Post Shore 5'–8' Adjustable", slug: "waco-screw-jack-shore-5-8",
    description: "All-steel adjustable shoring post for concrete deck forming. 1-5/8\" OD outer pipe, 1-1/4\" OD inner. 9,000 lb capacity.",
    price: 44.99, category: "Forming & Shoring", subcategory: "Shoring",
    tags: ["shoring", "screw jack", "post shore"], image: IMG.form1,
    gallery: [IMG.form1, IMG.concrete2], rating: 4.5, ratingCount: 195,
    inventory: 600, featured: false, brand: "Waco", sku: "WAC-SJ58", unit: "each",
  },
];
