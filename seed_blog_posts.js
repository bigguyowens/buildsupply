const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const posts = [
  // ── Press Releases ────────────────────────────────────────────────────
  {
    category: "press-releases",
    title: "BuildSupply Expands Distribution Network to the Southeast",
    slug: "buildsupply-expands-southeast-distribution",
    excerpt: "BuildSupply announces the opening of two new regional distribution centers in Atlanta and Charlotte, cutting delivery times for thousands of contractors across the Southeast.",
    body: `## BuildSupply Expands Distribution Network to the Southeast

**ATLANTA, GA — BuildSupply** today announced the opening of two new regional distribution centers in Atlanta, Georgia and Charlotte, North Carolina, marking the company's most significant infrastructure investment since its founding in 2012.

The new facilities add over 320,000 square feet of combined warehouse space and are expected to reduce average delivery times across the Southeast region from 4–5 business days to 1–2 business days.

## What This Means for Contractors

The expansion directly addresses one of the most consistent pieces of feedback we've received from our customer base: speed matters on a job site. A delayed material shipment doesn't just slow down one task — it cascades across an entire project timeline.

With these new locations, contractors operating in Georgia, North Carolina, South Carolina, Tennessee, and Alabama will have access to our full catalog of 40,000+ SKUs with next-day fulfillment on most orders.

## New Capabilities

- **Same-day processing** on orders placed before 3PM local time
- **Will-call pickup** available at both locations for urgent needs
- **Dedicated account manager support** for commercial accounts in the region
- Expanded inventory of **concrete, masonry, and waterproofing** products

## Leadership Comment

*"The Southeast is one of the fastest-growing construction markets in the country. This investment is our commitment to being a reliable partner for the contractors and project managers building it."*
— CEO, BuildSupply

The Atlanta facility is now fully operational. The Charlotte location is expected to reach full capacity by Q2.

For more information, contact our sales team at sales@buildsupply.com.`,
    author: "BuildSupply Communications",
    cover: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=60",
  },
  {
    category: "press-releases",
    title: "BuildSupply Launches Commercial Account Program for General Contractors",
    slug: "buildsupply-commercial-account-program",
    excerpt: "A new tiered account program gives GCs and procurement teams dedicated pricing, net-30 terms, and a dedicated account manager — all designed around how commercial teams actually buy.",
    body: `## BuildSupply Launches Commercial Account Program for General Contractors

**BuildSupply** today introduced its Commercial Account Program, a structured purchasing framework built specifically for general contractors, subcontractors, and procurement teams managing high-volume material purchases.

## Program Tiers

The program launches with three tiers based on annual spend:

- **Preferred** ($25K+/year) — Volume pricing, dedicated phone support, 30-day payment terms
- **Premier** ($75K+/year) — Enhanced discounts, dedicated account manager, job site delivery coordination
- **Elite** ($200K+/year) — Custom pricing agreements, priority fulfillment, quarterly business reviews

## Why We Built This

Large-scale procurement doesn't work the same way a one-off purchase does. Commercial buyers need predictable pricing they can build into project bids, the ability to manage multiple active POs simultaneously, and a real human being to call when something goes sideways on a Friday afternoon.

The Commercial Account Program is our answer to all three.

## How to Apply

Enrollment is open immediately. Existing customers can apply through their account dashboard. New customers can request an application through our contact page.

Approved accounts will be onboarded within 3 business days and receive a welcome call from their dedicated account manager.`,
    author: "BuildSupply Communications",
    cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=60",
  },
  {
    category: "press-releases",
    title: "BuildSupply Named to ENR's Top Regional Suppliers List for Third Consecutive Year",
    slug: "buildsupply-enr-top-regional-suppliers",
    excerpt: "Engineering News-Record has recognized BuildSupply as a top regional construction supplier for the third year running, citing supply chain reliability and product breadth.",
    body: `## BuildSupply Named to ENR's Top Regional Suppliers List for Third Consecutive Year

**BuildSupply** has been recognized by *Engineering News-Record (ENR)* as one of the top regional construction materials suppliers in the Southeast for the third consecutive year.

The recognition highlights suppliers that demonstrate consistent inventory availability, delivery reliability, and depth of product catalog — factors that ENR identifies as critical to contractor success in complex project environments.

## What the Recognition Reflects

This isn't an award we applied for. ENR's methodology is based on contractor feedback surveys and independent supply chain audits. Hearing it directly from the people we serve is what makes it meaningful.

## Key Metrics Behind the Recognition

- **99.2%** on-time fulfillment rate over the past 12 months
- **40,000+** active SKUs across 850+ brands
- Average order-to-ship time of **6.4 hours** for in-stock items
- **4.8/5** average customer satisfaction rating across 3,200+ reviews

## Looking Ahead

We're grateful for the recognition, but more importantly, it validates the investments we've made in warehouse automation, inventory forecasting, and customer service over the past three years. We'll keep building on it.

The full ENR Regional Suppliers report is available at enr.com.`,
    author: "BuildSupply Communications",
    cover: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=60",
  },

  // ── Industry News ─────────────────────────────────────────────────────
  {
    category: "industry-news",
    title: "Construction Spending Hits Record High Driven by Infrastructure and Data Centers",
    slug: "construction-spending-record-high-2025",
    excerpt: "U.S. construction spending surpassed $2.1 trillion in 2024, fueled by federal infrastructure funding and an explosion of hyperscale data center projects across the Sun Belt.",
    body: `## Construction Spending Hits Record High Driven by Infrastructure and Data Centers

U.S. construction spending reached a new all-time high in 2024, topping $2.1 trillion according to data from the U.S. Census Bureau — a 7.3% increase over the prior year and the fourth consecutive year of growth.

## What's Driving the Surge

Two sectors are leading the charge:

**Infrastructure** — The Infrastructure Investment and Jobs Act continues to push billions into highway, bridge, rail, and utility projects. Many of these projects are entering active construction phases after years of planning and permitting delays.

**Data Centers** — The AI boom is driving an unprecedented wave of hyperscale data center construction, particularly in Virginia, Texas, Georgia, and Arizona. These projects are enormously materials-intensive, requiring vast quantities of structural steel, concrete, conduit, and mechanical equipment.

## What It Means for Contractors

Strong demand is a double-edged sword. Backlogs are healthy, but material lead times and skilled labor availability remain persistent challenges. Contractors who can lock in material supply agreements early are gaining a real competitive advantage on project bids.

## Regional Breakdown

- **Southeast**: +11.2% YoY, led by industrial and data center activity
- **Southwest**: +9.7% YoY, driven by semiconductor fab construction
- **Midwest**: +5.1% YoY, steady growth in infrastructure rehabilitation
- **Northeast**: +3.8% YoY, mixed across residential and commercial

## Looking Forward

Most forecasters expect growth to moderate slightly in 2025 as interest rate pressures continue to weigh on private residential construction, but commercial and public spending is expected to remain strong through at least 2027.`,
    author: "BuildSupply Editorial",
    cover: "https://images.unsplash.com/photo-1541976590-713941681591?w=800&q=60",
  },
  {
    category: "industry-news",
    title: "Concrete Prices Stabilizing After Two Years of Volatility",
    slug: "concrete-prices-stabilizing-2025",
    excerpt: "Ready-mix and bagged concrete prices are showing signs of stabilization after two turbulent years, offering contractors more predictability heading into the busy spring construction season.",
    body: `## Concrete Prices Stabilizing After Two Years of Volatility

After two years of sharp price swings driven by supply chain disruptions, energy cost spikes, and post-pandemic demand surges, concrete and cement prices appear to be stabilizing — welcome news for contractors heading into the spring construction season.

## What Changed

The dramatic price run-up of 2022–2023 was driven by a perfect storm of factors: energy-intensive cement production became more expensive as natural gas prices spiked, logistics costs ballooned, and demand surged simultaneously across residential, commercial, and infrastructure sectors.

The stabilization in 2024–2025 reflects:

- **Energy cost normalization** — Natural gas prices have retreated significantly from their 2022 peaks
- **Supply chain recovery** — Portland cement imports have rebounded, adding supply to domestic markets
- **Demand moderation** — Residential construction has pulled back, reducing pressure on ready-mix capacity
- **New domestic capacity** — Several cement plants that were idled or underinvesting have resumed full production

## What Contractors Should Expect

Ready-mix prices in most U.S. markets are currently running 3–8% above 2021 levels but have been flat to slightly down over the past six months. Bagged concrete products at the distribution level have seen similar stabilization.

That said, regional variation remains significant. Markets with heavy data center and infrastructure activity are seeing continued tightness in ready-mix supply.

## Planning Implications

For contractors pricing work in Q2 and beyond, the improved predictability should make material escalation clauses slightly less contentious in contract negotiations — though most experienced contractors will continue to include them given the volatility of the past few years.`,
    author: "BuildSupply Editorial",
    cover: "https://images.unsplash.com/photo-1590244168808-f0a4a22c57e7?w=800&q=60",
  },
  {
    category: "industry-news",
    title: "OSHA Updates Fall Protection Standards — What Contractors Need to Know",
    slug: "osha-fall-protection-updates-2025",
    excerpt: "OSHA's revised fall protection standards take effect this year, with new requirements around leading edge work, portable ladder systems, and written fall protection plans on certain job sites.",
    body: `## OSHA Updates Fall Protection Standards — What Contractors Need to Know

OSHA has finalized updates to its fall protection standards under 29 CFR 1926 Subpart M, with several changes that will affect how contractors approach safety planning and equipment procurement on active job sites.

The updates take effect in phases, with the most significant requirements becoming mandatory for new project starts this year.

## Key Changes

### Leading Edge Work
The revised standard tightens requirements around leading edge work, where workers are particularly exposed. Contractors must now document a specific leading edge fall protection plan — a generic site safety plan is no longer sufficient for OSHA compliance in this area.

### Portable Ladders
New load capacity marking requirements apply to portable ladders, and daily inspection documentation requirements have been extended to all portable ladder types on sites with more than 10 workers.

### Written Fall Protection Plans
Sites with four or more employees working at heights above 6 feet (residential) or above conventional fall protection thresholds (commercial/industrial) must maintain written, site-specific fall protection plans accessible to all workers and available for inspector review.

## What This Means for Your Safety Program

The practical implication for most contractors is documentation and training. The physical safety requirements haven't changed dramatically — personal fall arrest systems, guardrail systems, and safety nets remain the primary compliance methods. What's changed is the paperwork trail required to demonstrate that those systems are being properly selected, inspected, and used.

## Equipment Implications

If your current safety inventory includes ladders, harnesses, or anchor systems that predate these updates, now is a good time to audit certifications and replacement schedules.

*This article is for informational purposes only and does not constitute legal or compliance advice. Consult OSHA's official resources or a qualified safety professional for compliance guidance specific to your operation.*`,
    author: "BuildSupply Editorial",
    cover: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=60",
  },

  // ── Internal Wins ─────────────────────────────────────────────────────
  {
    category: "internal-wins",
    title: "Warehouse Team Achieves 30-Day Zero-Error Pick Rate",
    slug: "warehouse-team-zero-error-pick-rate",
    excerpt: "Our Atlanta fulfillment team just completed 30 consecutive days without a single pick error across more than 18,000 orders — a new company record and a testament to the team's discipline.",
    body: `## Warehouse Team Achieves 30-Day Zero-Error Pick Rate

We're incredibly proud to share that our Atlanta fulfillment team has just completed 30 consecutive days with a zero pick error rate — meaning every single one of the 18,400+ orders processed during that period was packed correctly, completely, and on time.

This is a new company record, and it didn't happen by accident.

## How They Did It

The team spent Q4 of last year redesigning their pick-and-verify workflow after identifying that most errors were occurring during shift transitions. The fix wasn't complicated — it was disciplined:

- **Double-scan verification** implemented at packing stations for all orders over 5 line items
- **Shift handoff checklists** requiring the outgoing lead to walk the incoming lead through any open or flagged orders
- **Real-time error tracking** on a whiteboard visible to the entire floor — making the streak visible and tangible

## The People Behind It

This win belongs entirely to the team. Shoutouts to the leads who drove the process changes and to every picker and packer who bought into the new workflow even when it slowed things down initially.

Their attention to detail directly impacts our customers — a contractor who receives the wrong anchor bolts on a Friday afternoon doesn't just have a supply problem, they have a project problem.

## What's Next

The team has set their sights on 60 days. We think they can do it.

Congratulations to the entire Atlanta fulfillment crew. You set the standard for the rest of the company.`,
    author: "BuildSupply Team",
    cover: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=60",
  },
  {
    category: "internal-wins",
    title: "Customer Support Team Hits 97% Same-Day Resolution Rate",
    slug: "customer-support-97-percent-same-day",
    excerpt: "Our customer support team closed out Q1 with a 97.2% same-day resolution rate — up from 84% the same quarter last year — after a systematic rebuild of their internal tooling and escalation process.",
    body: `## Customer Support Team Hits 97% Same-Day Resolution Rate

Q1 results are in, and our customer support team put up a number that stopped everyone in their tracks: a **97.2% same-day resolution rate** on inbound support contacts.

To put that in context, the same metric stood at 84% this time last year. That's not incremental improvement — that's a complete transformation of how the team operates.

## The Story Behind the Number

Last summer, the support team did something that takes real intellectual honesty: they sat down and categorized every escalation from the prior six months and asked *why* it couldn't have been resolved on the first contact.

The answer was usually one of three things:

1. The agent didn't have access to the right order or inventory information quickly enough
2. The issue required a manager approval that had no clear path or SLA
3. The customer was transferred between teams without context

Rather than trying to fix all three at once, the team prioritized ruthlessly, starting with tooling (building a unified order lookup interface), then process (a manager approval SLA of under 2 hours for anything under $500), then handoffs (a mandatory context note required before any transfer).

## The Results

- **97.2%** same-day resolution (up from 84%)
- Average handle time down **22%** despite higher resolution rates
- Customer satisfaction score up to **4.9/5** for the quarter
- Agent satisfaction scores also improved — less friction for agents means less frustration

## A Note from Leadership

This team didn't wait to be told what to fix. They diagnosed the problem themselves, built the solution themselves, and delivered the results. That's exactly the culture we want to build here.

Huge congratulations to everyone on the support team.`,
    author: "BuildSupply Team",
    cover: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=60",
  },
  {
    category: "internal-wins",
    title: "Engineering Team Ships New Commerce Platform Ahead of Schedule",
    slug: "engineering-team-ships-commerce-platform",
    excerpt: "The engineering team delivered the rebuilt commerce platform two weeks ahead of the original timeline, with zero critical incidents on launch day — a huge win for the team and the business.",
    body: `## Engineering Team Ships New Commerce Platform Ahead of Schedule

We're thrilled to announce that the engineering team successfully launched the rebuilt BuildSupply commerce platform last week — two weeks ahead of the original target date, and with zero critical incidents on launch day or in the days since.

This was a multi-month effort that touched virtually every part of how customers experience our site: product discovery, cart, checkout, account management, and the admin tools that power everything behind the scenes.

## What Was Built

The new platform represents a fundamental architectural shift. Rather than patching and extending a system that had grown organically over years, the team made the decision to rebuild on a modern stack: **Next.js** on the frontend, a clean **PostgreSQL** data layer, and a set of well-defined server actions that give us a solid foundation to build on for years to come.

Key capabilities shipped in this release:

- Fully rebuilt product catalog with category management and bulk import
- Cart and checkout with promo code support
- Customer account system with order history, wishlists, and profile management
- Admin platform covering orders, customers, products, CMS, and now — this very blog
- Mobile-responsive across every page

## What Made It Work

A few things stand out when we look back at why this project hit its goals:

**Scope discipline.** The team made hard calls about what was in and out of scope and held the line on them. A platform launch is not the time to also redesign the homepage.

**Continuous deployment.** Shipping to production continuously rather than saving everything for a big bang release meant issues surfaced early, when they were cheap to fix.

**Squad partnership.** Engineering, product, and operations stayed closely aligned throughout. There were no surprises at the finish line.

## What's Next

The foundation is solid. The next chapter is about building on it — better search, enhanced order management, a more powerful admin experience, and deeper integrations with our warehouse and logistics systems.

Congratulations to every engineer, designer, and PM who contributed to this launch. This one mattered.`,
    author: "BuildSupply Team",
    cover: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=60",
  },

  // ── Product Spotlight ─────────────────────────────────────────────────
  {
    category: "product-spotlight",
    title: "Spotlight: DEWALT 20V MAX Cordless Rotary Hammer — Built for the Long Haul",
    slug: "dewalt-20v-cordless-rotary-hammer-spotlight",
    excerpt: "DEWALT's cordless rotary hammer has quietly become one of our best-selling tools. Here's why contractors keep coming back to it and what makes it stand out in a crowded category.",
    body: `## Spotlight: DEWALT 20V MAX Cordless Rotary Hammer — Built for the Long Haul

If you've been watching our tool sales data, one item keeps showing up at the top of repeat purchase lists: the **DEWALT 20V MAX SDS PLUS Cordless Rotary Hammer**. Contractors are buying it once, and then buying it again for the rest of the crew.

We wanted to understand why, so we talked to a few of our commercial accounts who use it daily.

## What Contractors Are Saying

*"We switched from pneumatic to this about two years ago. The freedom of no hose or compressor on a job site is worth the upcharge, and the battery life is better than I expected."*
— Commercial concrete contractor, Atlanta

*"We use it for anchor drilling in concrete tilt-up panels. It handles 3/8\" anchors all day without bogging down. The SDS chuck makes bit changes fast when you're doing volume work."*
— Structural subcontractor, Charlotte

## The Technical Case

The numbers back up the field feedback:

- **1.7 ft-lbs** of impact energy — competitive with many corded 1\" SDS rotary hammers
- **0–1,150 BPM** variable speed for control in different materials
- **3-mode operation** — rotary hammer, hammer-only, and drill-only
- Compatible with **DEWALT FLEXVOLT** batteries for extended runtime on large drilling tasks
- **Anti-vibration** handle reduces fatigue on long drilling sessions

## Best Applications

- Anchor bolt installation in concrete
- Masonry and block drilling
- Tile and mortar removal (with chisel attachment)
- Horizontal drilling into poured concrete walls

## Runtime Notes

On a standard 5.0Ah 20V battery, most contractors report 60–90 anchor holes in 3/8\" concrete before needing to swap. Running FLEXVOLT 60V batteries (compatible in 20V mode) pushes that to 150+ holes.

## Availability

In stock and ready to ship. Volume pricing available for commercial accounts.`,
    author: "BuildSupply Product Team",
    cover: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=60",
  },
  {
    category: "product-spotlight",
    title: "New Arrival: LATICRETE HYDRO BAN Waterproofing System",
    slug: "laticrete-hydro-ban-waterproofing-system",
    excerpt: "LATICRETE's HYDRO BAN is now in our catalog — a single-component, self-curing liquid waterproofing and anti-fracture membrane that's become a go-to for tile and stone installations.",
    body: `## New Arrival: LATICRETE HYDRO BAN Waterproofing System

We're excited to add **LATICRETE HYDRO BAN** to the BuildSupply catalog. If you've done any tile or stone work in wet areas, you've probably heard contractors talk about this product. Here's what makes it worth knowing.

## What It Is

HYDRO BAN is a single-component, self-curing liquid waterproofing and anti-fracture membrane. It cures to form a flexible, continuous waterproof barrier that bonds directly to the substrate without fabric reinforcement in most applications.

The key word is *self-curing*. Unlike traditional sheet membranes that require bonding agents and careful seam lapping, HYDRO BAN cures on its own after application and can be tiled over in as little as 2–4 hours under normal conditions.

## Where It Excels

- **Shower floors and walls** — The classic application. Handles movement without cracking.
- **Steam rooms** — Rated for high-temperature, high-humidity environments where most membranes fail prematurely
- **Balconies and exterior decks** — UV-stable and freeze-thaw resistant
- **Wet areas around pools and spas** — Compatible with chlorinated environments
- **Retrofit applications** — Applies directly over existing tile, CBU, plywood, or concrete without full demolition

## Application Notes

Apply with a brush, roller, or sprayer in two coats at 90° angles to ensure complete coverage. Full cure time varies by temperature and humidity but is generally 24 hours before tile installation in wet immersion conditions.

Coverage rate is approximately **40–60 sq ft per gallon** depending on substrate porosity and application method.

## What's in Stock

We're stocking HYDRO BAN in **1-gallon**, **3.5-gallon**, and **5-gallon** containers. The pre-formed corners and curb caps are also available for complete system installations.

Questions? Reach out to your account manager or our product support line.`,
    author: "BuildSupply Product Team",
    cover: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=60",
  },
  {
    category: "product-spotlight",
    title: "Why Contractors Are Switching to Hilti Firestop Systems",
    slug: "hilti-firestop-systems-spotlight",
    excerpt: "Firestop compliance is one of the most inspection-sensitive areas of any commercial build. Hilti's system approach — product plus documentation plus training — is why it's become the preferred choice for GCs who can't afford re-inspection failures.",
    body: `## Why Contractors Are Switching to Hilti Firestop Systems

Firestop is one of those categories where the cheapest solution can become the most expensive mistake. A failed firestop inspection on a commercial project doesn't just mean buying more caulk — it means rework, re-inspection fees, schedule delays, and a very unhappy GC-sub relationship.

We've watched a growing number of our commercial accounts shift to **Hilti firestop systems** over the past two years, and the reason is consistent: they pass inspection the first time.

## The System Approach

What distinguishes Hilti isn't any single product — it's the system. Hilti engineers tested assemblies for specific combinations of pipe material, annular space, wall construction type, and fire rating. Those tested assemblies are documented in UL-listed system designs that inspectors can look up directly.

When a contractor installs a Hilti firestop assembly and documents it using Hilti's system design number, the inspector isn't evaluating a product — they're verifying a tested, listed assembly. That's a fundamentally lower-risk outcome for everyone.

## Key Products in the System

- **CP 606 Flexible Firestop Sealant** — The workhorse for most penetration sealing applications. Paintable, flexible, and rated for 2, 3, and 4-hour assemblies.
- **CP 678T Fire Retardant Intumescent Pipe Wrap** — For plastic pipe penetrations where sleeving isn't practical
- **FS-ONE MAX Intumescent Firestop Sealant** — Upgraded formulation for deep-joint and difficult-access applications
- **CFS-S ACR Acrylic Sealant** — For non-combustible penetrations where a smoke seal is sufficient

## Documentation That Protects You

Hilti's online system selector generates a printable, job-specific documentation package that specifies the exact product, installation method, and applicable UL design number for each penetration type on your project.

Keep these on file. When an inspector asks how a penetration is protected, you can hand them documentation rather than a spec sheet.

## In Stock Now

We carry the full Hilti CP and FS-ONE firestop line. Volume pricing available for commercial accounts. Contact your account manager for project-specific ordering assistance.`,
    author: "BuildSupply Product Team",
    cover: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=60",
  },
];

async function run() {
  const client = await pool.connect();
  try {
    let created = 0;
    for (const p of posts) {
      const catRows = await client.query(`SELECT id FROM blog_categories WHERE slug=$1 LIMIT 1`, [p.category]);
      if (!catRows.rows[0]) { console.warn(`Category not found: ${p.category}`); continue; }
      const catId = catRows.rows[0].id;
      await client.query(`
        INSERT INTO blog_posts (category_id, title, slug, excerpt, body, cover_image, author_name, published, published_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,true,NOW() - (RANDOM() * INTERVAL '90 days'))
        ON CONFLICT (slug) DO NOTHING
      `, [catId, p.title, p.slug, p.excerpt, p.body, p.cover, p.author]);
      created++;
    }
    console.log(`✓ Created ${created} posts`);
  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
