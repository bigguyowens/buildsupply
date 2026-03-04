const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ── Spec templates per category ───────────────────────────────────────────────
function specsFor(product) {
  const cat = product.category;
  const name = product.name.toLowerCase();

  if (cat === "Safety & PPE") {
    if (name.includes("earmuff") || name.includes("ear")) return { "Noise Reduction Rating": "31 dB", "Frequency Range": "1,000–8,000 Hz", "Headband Material": "Steel", "Cup Material": "ABS Plastic", "Cushion Material": "PVC Foam", "Weight": "10.6 oz", "Standard": "ANSI S3.19, CE EN352-1", "Color": "Red/Gray" };
    if (name.includes("hard hat") || name.includes("helmet")) return { "Shell Material": "High-Density Polyethylene", "Suspension": "4-Point Pinlock", "Brim Style": "Full Brim", "Class": "E (Electrical)", "Max Voltage": "20,000V", "Weight": "14.4 oz", "Standard": "ANSI/ISEA Z89.1-2014 Type I", "Color": "White" };
    if (name.includes("glove")) return { "Material": "Nylon/Polyurethane", "Coating": "Foam Nitrile Palm", "Cut Resistance": "ANSI A2", "Sizes Available": "S, M, L, XL, XXL", "Grip": "Wet/Dry", "Standard": "EN388 4131X", "Pack Qty": "12 Pairs", "Color": "Gray/Black" };
    if (name.includes("glass") || name.includes("goggle")) return { "Lens Material": "Polycarbonate", "Lens Tint": "Clear", "Anti-Fog": "Yes", "UV Protection": "99.9% UV400", "Frame Material": "Nylon", "Standard": "ANSI Z87.1+", "Pack Qty": "12 Pack", "Weight": "1.1 oz" };
    if (name.includes("vest")) return { "Material": "100% Polyester Mesh", "Visibility Class": "Class 2", "Closure": "Zipper Front", "Pockets": "2 Lower, 1 Chest", "Tape Width": "2 in Segmented", "Standard": "ANSI/ISEA 107-2015", "Sizes": "S–5XL", "Color": "Lime/Silver" };
    if (name.includes("respirator") || name.includes("n95") || name.includes("mask")) return { "Filter Efficiency": "≥95% Non-Oil Aerosols", "Rating": "N95", "Exhalation Valve": "Yes", "Layers": "3-Layer Electrostatic", "Straps": "Dual", "Standard": "NIOSH 42 CFR 84", "Pack Qty": "10 Pack", "Latex Free": "Yes" };
    return { "Material": "Industrial Grade", "Standard": "OSHA Compliant", "Weight": "8 oz", "Color": "Safety Orange", "Pack Qty": "1 Each", "Use": "General Safety" };
  }

  if (cat === "Power Tools") {
    if (name.includes("drill")) return { "Voltage": "18V / 20V MAX", "No-Load Speed": "0–550 / 0–2,000 RPM", "Max Torque": "60 ft-lbs", "Chuck Size": "1/2 in Keyless", "Clutch Settings": "15+1", "Battery": "2× 5.0Ah Li-Ion", "Weight (w/ Battery)": "4.4 lbs", "Includes": "2 Batteries, Charger, Bag" };
    if (name.includes("circular") || name.includes("saw")) return { "Voltage": "20V MAX", "Blade Diameter": "6-1/2 in", "Arbor": "5/8 in", "No-Load Speed": "5,250 RPM", "Bevel Capacity": "0–50°", "Cut Depth @ 90°": "2-1/4 in", "Weight": "7.2 lbs (bare)", "Blade Included": "Yes" };
    if (name.includes("grinder")) return { "Amperage": "7.5A", "No-Load Speed": "11,000 RPM", "Disc Diameter": "4-1/2 in", "Spindle Thread": "5/8-11 UNC", "Wheel Guard": "Adjustable", "Cord Length": "8 ft", "Weight": "5.0 lbs", "Paddle Switch": "Yes" };
    if (name.includes("reciprocating") || name.includes("recip")) return { "Voltage": "18V", "Strokes Per Minute": "0–3,000 SPM", "Stroke Length": "1-1/8 in", "Blade Change": "Tool-Free QUIK-LOK", "Anti-Vibration": "Yes", "Weight (bare)": "5.6 lbs", "LED Light": "Yes", "Battery Req.": "M18 (sold sep.)" };
    if (name.includes("jig")) return { "Voltage": "20V MAX", "Strokes Per Minute": "0–3,100 SPM", "Stroke Length": "1 in", "Bevel": "0–45° Left/Right", "Anti-Vibration": "Yes", "Blade Change": "Tool-Free", "Weight (bare)": "4.1 lbs", "LED Light": "Yes" };
    if (name.includes("rotary") || name.includes("hammer") || name.includes("sds")) return { "Voltage": "18V LXT", "Impact Energy": "1.8 ft-lbs", "BPM": "0–4,500 BPM", "No-Load Speed": "0–1,100 RPM", "Chuck Type": "SDS-Plus", "Modes": "3 (Rotation, Hammer+Rotation, Hammer)", "Weight (bare)": "6.7 lbs", "LED Light": "Yes" };
    return { "Voltage": "20V / 18V", "Weight": "5.0 lbs", "Speed": "Variable", "Warranty": "3 Year Limited", "Battery": "Li-Ion", "Includes": "Carrying Case" };
  }

  if (cat === "Hand Tools") {
    if (name.includes("wrench")) return { "Drive Size": "N/A (combination)", "Size Range": "3/8–1 in SAE", "Material": "Forged Chrome Vanadium", "Finish": "Polish Chrome", "Jaw Type": "12-Point Box End / Open End", "Standard": "ASME B107.100", "Piece Count": "7 Piece", "Storage": "Canvas Pouch" };
    if (name.includes("screwdriver") || name.includes("nut driver")) return { "Functions": "11-in-1", "Bits Included": "Ph #1/#2, Sl 3/16/1/4, T10/T15, Sq #1/#2", "Nut Drivers": "3/8 in, 5/16 in", "Handle Material": "Cushion-Grip", "Shaft Material": "Chrome-Plated", "Blade Material": "High Carbon Steel", "Length": "9.5 in", "Weight": "5.6 oz" };
    if (name.includes("hammer")) return { "Weight": "22 oz", "Face": "Milled (Waffle)", "Handle Material": "American Hickory / Nylon Vinyl Grip", "Head Material": "Forged Steel", "Length": "18 in", "Balance Point": "Optimized", "Standard": "ASME B107.400", "Grip": "Shock-Reduction" };
    if (name.includes("plier") || name.includes("pliers")) return { "Jaw Capacity": "0–2 in", "Length": "12 in", "Material": "High Carbon Steel", "Handle Material": "Comfort Grips", "Adjustment": "Multi-Position", "Jaw Type": "Tongue & Groove", "Finish": "Code Blue® Polish", "Weight": "14.1 oz" };
    return { "Material": "Chrome Vanadium Steel", "Finish": "Polished Chrome", "Handle": "Ergonomic Grip", "Standard": "ASME B107", "Made In": "USA/Imported", "Warranty": "Lifetime" };
  }

  if (cat === "Fasteners") {
    if (name.includes("screw")) return { "Thread Size": "6 × 1-5/8 in", "Drive Type": "Phillips #2", "Material": "Carbon Steel", "Finish": "Phosphate", "Head Type": "Bugle", "Point": "Sharp", "Pack Qty": "5 lb (~1,430 pcs)", "Application": "Drywall to Steel Stud" };
    if (name.includes("bolt")) return { "Thread Size": "1/2-13 UNC", "Length": "2 in", "Grade": "Grade 5 SAE", "Material": "Medium Carbon Steel", "Finish": "Zinc Plated", "Head": "Hex Cap", "Pack Qty": "Box of 50", "Tensile Strength": "120,000 PSI" };
    if (name.includes("anchor") || name.includes("kwik")) return { "Diameter": "1/2 in", "Length": "3-3/4 in", "Material": "Carbon Steel", "Finish": "Zinc Plated", "Min Embedment": "2-1/4 in", "Min Concrete Thickness": "3-1/2 in", "Pack Qty": "Box of 25", "Standard": "ICC-ESR" };
    if (name.includes("nut")) return { "Thread Size": "3/8-16 UNC", "Material": "Type 316 Stainless Steel", "Finish": "Plain (Natural)", "Width Across Flats": "9/16 in", "Height": "21/64 in", "Pack Qty": "Box of 100", "Standard": "ASME B18.2.2", "Corrosion Resistant": "Yes" };
    return { "Material": "Alloy Steel", "Finish": "Zinc Plated", "Standard": "ASME / SAE", "Pack Qty": "Box", "Temperature Range": "-40°F to +300°F" };
  }

  if (cat === "Abrasives") {
    if (name.includes("cutting") || name.includes("disc") || name.includes("wheel")) return { "Diameter": "4-1/2 in", "Thickness": "0.045 in", "Arbor": "7/8 in", "Max RPM": "13,300 RPM", "Abrasive Material": "Aluminum Oxide", "Bond": "Resinoid", "Pack Qty": "25 Pack", "Application": "Steel / Stainless Steel" };
    if (name.includes("sanding") || name.includes("sandpaper")) return { "Grit": "80 / 120 / 220 Assorted", "Size": "9 × 11 in", "Abrasive": "Aluminum Oxide", "Backing": "Paper C-Weight", "Coating": "Open Coat", "Pack Qty": "25 Sheets", "Use": "Dry Sanding", "Application": "Wood / Metal / Plastic" };
    if (name.includes("flap")) return { "Grit": "40", "Disc Size": "4-1/2 in", "Arbor": "7/8 in", "Max RPM": "13,300 RPM", "Flap Material": "Zirconia Alumina", "Backing": "Fiberglass", "Pack Qty": "10 Pack", "Application": "Metal Grinding/Blending" };
    return { "Abrasive Material": "Aluminum Oxide", "Arbor": "7/8 in", "Max RPM": "13,300 RPM", "Bond": "Resinoid", "Application": "Metal & Steel", "Standard": "ANSI B7.1" };
  }

  if (cat === "Welding") {
    if (name.includes("welder") || name.includes("mig") || name.includes("tig") || name.includes("stick")) return { "Process": "MIG/Flux-Core", "Input Voltage": "120V / 240V", "Amperage Range": "30–140A", "Duty Cycle": "20% @ 90A", "Wire Feed Speed": "40–700 IPM", "Wire Diameter": "0.023–0.035 in", "Weight": "38 lbs", "Warranty": "3 Year" };
    if (name.includes("electrode") || name.includes("rod")) return { "AWS Class": "E7018", "Diameter": "1/8 in", "Length": "14 in", "Tensile Strength": "70,000 PSI", "Current": "AC/DC+", "Amperage": "90–165A", "Pack Qty": "50 lb Container", "Coating": "Low Hydrogen Iron Powder" };
    if (name.includes("helmet") || name.includes("hood") || name.includes("auto")) return { "Shade Range": "9–13 Auto-Darkening", "Light State": "Shade 4", "Switching Speed": "1/25,000 sec", "Sensor": "4 Arc", "Solar Assist": "Yes", "Viewing Area": "3.86 × 2.44 in", "Standard": "ANSI Z87.1+", "Battery": "Solar + CR2032" };
    return { "Input Voltage": "120/240V", "Amperage": "Up to 140A", "Duty Cycle": "20%", "Wire Feed": "Yes", "Warranty": "3 Year", "Standard": "CSA / CE Certified" };
  }

  if (cat === "Electrical") {
    if (name.includes("conduit")) return { "Trade Size": "1/2 in", "Material": "Rigid PVC", "Length": "10 ft", "Wall Thickness": "0.109 in", "OD": "0.840 in", "Temperature Rating": "90°C / 194°F", "Standard": "UL 651, NEMA TC-2", "Color": "Gray" };
    if (name.includes("wire") || name.includes("cable")) return { "Wire Gauge": "12 AWG", "Type": "THHN/THWN-2", "Conductor": "Solid Copper", "Voltage Rating": "600V", "Temperature Rating": "90°C Dry / 75°C Wet", "Insulation": "PVC", "Jacket": "Nylon", "Standard": "UL 83, RoHS" };
    if (name.includes("box") || name.includes("outlet")) return { "Material": "Metal (Galvanized Steel)", "Cubic Inches": "18 cu in", "Knockouts": "1/2 in & 3/4 in", "Mounting": "Nail-On Bracket", "Depth": "2-1/8 in", "Standard": "UL Listed", "Application": "New Construction", "Cover Included": "No" };
    if (name.includes("breaker") || name.includes("panel")) return { "Amperage": "20A", "Poles": "Single Pole", "Voltage": "120/240VAC", "Interrupt Rating": "10 kAIC", "Type": "QO / BR Compatible", "Standard": "UL 489", "GFCI": "No", "Wire Range": "14–10 AWG" };
    return { "Voltage": "120/240VAC", "Standard": "UL Listed / NEC", "Material": "Copper/Steel", "Wire Gauge": "12–14 AWG", "Temperature": "90°C", "Application": "Commercial/Residential" };
  }

  if (cat === "Plumbing") {
    if (name.includes("pipe")) return { "Pipe Size": "1/2 in", "Material": "Schedule 40 PVC", "Length": "10 ft", "OD": "0.840 in", "Pressure Rating": "600 PSI @ 73°F", "Color": "White", "Standard": "ASTM D1785", "Application": "Cold Water / Drain" };
    if (name.includes("fitting") || name.includes("coupling") || name.includes("elbow")) return { "Pipe Size": "1/2 in", "Material": "CPVC / Brass", "Connection": "Solvent Weld / Compression", "Pressure Rating": "400 PSI", "Temperature": "Up to 200°F", "Standard": "ASTM D2846", "NSF Certified": "Yes", "Lead Free": "Yes" };
    if (name.includes("valve")) return { "Size": "1/2 in", "Type": "Ball Valve", "Material": "Lead-Free Brass", "Handle": "Quarter-Turn Lever", "Pressure Rating": "200 PSI WOG", "Temperature": "Up to 200°F", "Ends": "FNPT × FNPT", "Standard": "NSF 61-9" };
    if (name.includes("faucet") || name.includes("fixture")) return { "Finish": "Chrome", "Spout Height": "8.75 in", "Spout Reach": "5.25 in", "Flow Rate": "1.2 GPM @ 60 PSI", "Valve Type": "Ceramic Disc", "Supply Lines": "Included", "Standard": "ASME A112.18.1", "Lead Free": "Yes" };
    return { "Material": "Brass / PVC", "Size": "1/2–1 in", "Pressure Rating": "200 PSI", "Standard": "NSF 61, ASME", "Lead Free": "Yes", "Application": "Potable Water" };
  }

  if (cat === "Cutting Tools") {
    if (name.includes("blade")) return { "Blade Length": "10 in", "TPI": "14/18 Bi-Metal", "Material": "High-Speed Steel Teeth / Spring Steel Body", "Shank": "Universal T-Shank", "Cut Material": "Metal / Wood / Plastic", "Pack Qty": "5 Pack", "Application": "Reciprocating Saw", "Standard": "ISO 8841" };
    if (name.includes("drill bit") || name.includes("bit set")) return { "Piece Count": "21 Piece", "Diameter Range": "1/16–1/2 in", "Material": "Black Oxide High Speed Steel", "Shank": "Straight / Reduced", "Point Angle": "135° Split Point", "Standard": "ANSI B94.11M", "Storage": "Indexed Case", "Use": "Metal / Wood / Plastic" };
    if (name.includes("hole saw")) return { "Diameter": "4-1/8 in", "Depth": "1-7/16 in", "TPI": "3", "Material": "Bi-Metal (HSS Teeth)", "Arbor": "Included", "Application": "Wood / Drywall / Plastic", "Pack Qty": "1 Each", "Pilot Drill": "Yes" };
    if (name.includes("tap") || name.includes("die")) return { "Thread Size": "1/4-20 UNC", "Material": "High-Speed Steel", "Finish": "Bright", "Thread Form": "UN/UNF", "Standard": "ASME B94.9", "Application": "Steel, Aluminum, Brass", "Flutes": "4", "Taper": "Taper/Plug/Bottom" };
    return { "Material": "Bi-Metal / HSS", "Hardness": "HRC 62+", "Standard": "ANSI / DIN", "Application": "Steel, Aluminum, Wood", "Coating": "TiN or Black Oxide" };
  }

  if (cat === "Concrete & Masonry") {
    if (name.includes("cement") || name.includes("concrete") || name.includes("mix")) return { "Coverage": "0.45 cu ft / 60 lb bag", "Compressive Strength": "4,000 PSI @ 28 days", "Initial Set": "30 min", "Final Set": "3 hours", "Water per Bag": "~2.5 quarts", "Max Aggregate": "3/4 in", "Weight": "60 lb", "Standard": "ASTM C387 / C150" };
    if (name.includes("block") || name.includes("brick")) return { "Dimensions": "8 × 8 × 16 in (nominal)", "Material": "Lightweight Aggregate CMU", "Weight": "28–33 lbs", "Compressive Strength": "1,900 PSI min", "Absorption": "≤12%", "Standard": "ASTM C90", "Fire Rating": "2-Hour", "Application": "Load-Bearing Wall" };
    if (name.includes("mortar") || name.includes("grout")) return { "Type": "Type S Masonry Mortar", "Coverage": "~50 sq ft / 60 lb bag", "Compressive Strength": "1,800 PSI", "Bond Strength": "100 PSI", "Water per Bag": "~5.5 quarts", "Working Time": "~1 hour", "Weight": "60 lb", "Standard": "ASTM C270" };
    if (name.includes("drill") || name.includes("bit") || name.includes("anchor")) return { "Diameter": "5/8 in", "Length": "6 in", "Material": "Carbide Tipped", "Shank": "SDS-Plus", "Flute": "2-Cutter", "Application": "Concrete, Brick, Masonry", "Pack Qty": "1 Each", "Standard": "ANSI B212.15" };
    return { "Material": "Portland Cement Blend", "Compressive Strength": "3,500–5,000 PSI", "Coverage": "Varies by application", "Mix Ratio": "Per bag instructions", "Standard": "ASTM", "Working Time": "~45 min" };
  }

  if (cat === "Janitorial") {
    if (name.includes("cleaner") || name.includes("degreaser") || name.includes("disinfect")) return { "Form": "Liquid Concentrate", "Dilution": "1:32 (4 oz / gallon)", "pH Level": "11.5 (alkaline)", "Scent": "Fresh / Unscented", "Container": "1 Gallon", "Kill Claims": "99.9% Bacteria & Viruses", "Standard": "EPA Registered", "Surface": "Multi-Surface" };
    if (name.includes("mop") || name.includes("broom") || name.includes("floor")) return { "Head Material": "Microfiber / Cotton Blend", "Head Width": "18 in", "Handle": "60 in Fiberglass", "Absorbency": "Up to 24× its weight", "Machine Washable": "Yes (up to 500×)", "Application": "Wet / Damp Mopping", "Compatibility": "All Hard Floors", "Handle Color": "Yellow" };
    if (name.includes("bag") || name.includes("liner") || name.includes("trash")) return { "Capacity": "55 gallon", "Thickness": "1.5 mil", "Material": "Linear Low-Density Polyethylene", "Dimensions": "36 × 58 in", "Closure": "Star Seal Bottom", "Color": "Black", "Pack Qty": "100 Count", "Tensile Strength": "High" };
    if (name.includes("paper") || name.includes("towel") || name.includes("tissue")) return { "Sheets per Roll": "85", "Sheet Size": "11 × 8.8 in", "Ply": "2-Ply", "Material": "Recycled Fiber", "Absorbency": "Extra Absorbent", "Core": "Coreless Compatible", "Pack Qty": "30 Rolls / Case", "Standard": "EPA Compliant" };
    return { "Form": "Liquid / Solid", "Coverage": "Varies", "pH": "6.5–11.5", "Container": "1 Gallon / Case", "Standard": "EPA Registered", "Application": "Commercial Use" };
  }

  if (cat === "Lifting & Rigging") {
    if (name.includes("chain") || name.includes("sling")) return { "Working Load Limit": "2,700 lbs", "Chain Grade": "Grade 80 Alloy Steel", "Chain Size": "5/16 in", "Length": "10 ft", "End Fittings": "Grab Hook Each End", "Finish": "Self-Colored", "Standard": "ASME B30.9", "Temperature Range": "-40°F to +400°F" };
    if (name.includes("hoist") || name.includes("winch") || name.includes("lift")) return { "Capacity": "1 Ton (2,000 lbs)", "Lift Height": "10 ft", "Pull Force": "25–40 lbs", "Chain Size": "Grade 80", "Gear Reduction": "30:1", "Hook Type": "Swivel w/ Safety Latch", "Standard": "ASME B30.21", "Weight": "26 lbs" };
    if (name.includes("shackle") || name.includes("hook")) return { "Working Load Limit": "2 Ton (4,400 lbs)", "Material": "Alloy Steel", "Pin Diameter": "5/8 in", "Finish": "Yellow Chromate", "Type": "Screw Pin Anchor", "Standard": "ASME B30.26", "Proof Load": "8,800 lbs", "Break Load": "22,000 lbs" };
    if (name.includes("strap") || name.includes("ratchet") || name.includes("tie")) return { "Working Load Limit": "3,333 lbs", "Break Strength": "10,000 lbs", "Width": "2 in", "Length": "27 ft", "Web Material": "Polyester", "Ratchet": "Steel (Zinc Plated)", "Standard": "DOT/FMCSA, WEB STD 001", "J-Hook": "Both Ends" };
    return { "Working Load Limit": "2,000 lbs", "Material": "Alloy Steel", "Standard": "ASME B30", "Finish": "Galvanized / Zinc", "Proof Tested": "Yes", "Application": "Industrial Lifting" };
  }

  // Fallback
  return { "Material": "Industrial Grade", "Standard": "ANSI / ASTM", "Application": "Commercial Use", "Warranty": "Manufacturer Warranty", "Country of Origin": "USA / Imported" };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const client = await pool.connect();
  try {
    // Add column
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB`);
    console.log("✓ specs column added");

    // Get all products
    const { rows: products } = await client.query(`SELECT id, name, category, brand, sku FROM products`);
    console.log(`Seeding specs for ${products.length} products…`);

    let updated = 0;
    for (const p of products) {
      const specs = specsFor(p);
      await client.query(`UPDATE products SET specs = $1 WHERE id = $2`, [JSON.stringify(specs), p.id]);
      updated++;
    }
    console.log(`✓ ${updated} products seeded with specs`);
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
