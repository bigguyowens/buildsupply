const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  console.log("Seeding projects...");

  // Get orders by customer to link them
  const ordersByUser = await pool.query(`
    SELECT id, user_id, status, total::numeric AS total
    FROM orders WHERE user_id IN (10,16,22,11,14,12,21,37,15,23,2)
    ORDER BY created_at DESC
  `);
  const byUser = {};
  for (const o of ordersByUser.rows) {
    if (!byUser[o.user_id]) byUser[o.user_id] = [];
    byUser[o.user_id].push(o);
  }
  console.log("Orders by user:", Object.entries(byUser).map(([k,v])=>`u${k}:${v.length}`).join(", "));

  // ── CUSTOMER PROJECTS ────────────────────────────────────────────────────

  // 1. Carlos Vega (id:16) — AM Sarah Mitchell (7) — has Quote #3
  const p1 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',16,7,1) RETURNING id
  `, [
    'Q2 2026 Safety Equipment Refresh',
    'Annual safety gear refresh for Vega Trading Co warehouse team. Includes PPE, hearing protection, and fall arrest systems for 40 workers.',
    'active', 28500
  ]);
  const p1id = p1.rows[0].id;
  // Link quote #3
  await pool.query(`INSERT INTO project_quotes (project_id, quote_id) VALUES ($1,3) ON CONFLICT DO NOTHING`, [p1id]);
  // Add notes
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (16,7,$1,$2)`,
    ['Initial scoping call completed. Carlos confirmed 40 workers need full PPE kits. Budget approved internally at $28.5k. Quote sent — following up end of month.', p1id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (16,7,$1,$2)`,
    ['Carlos requested we add 10 additional hard hats to the quote. Will revise and resend this week.', p1id]);
  console.log("✓ Project 1: Carlos Vega - Q2 Safety Equipment Refresh");

  // 2. Kevin Hart (id:22) — AM Sarah Mitchell (7)
  const p2 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',22,7,1) RETURNING id
  `, [
    'Warehouse Expansion — Phase 1',
    'New 12,000 sqft warehouse addition for Hart Construction. Needs industrial shelving, lighting, safety equipment and tool storage solutions.',
    'active', 65000
  ]);
  const p2id = p2.rows[0].id;
  const hartOrders = byUser[22] || [];
  if (hartOrders[0]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p2id, hartOrders[0].id]);
  if (hartOrders[1]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p2id, hartOrders[1].id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (22,7,$1,$2)`,
    ['Site visit scheduled for April 8th. Kevin wants to finalize the shelving layout before placing the main order. Estimated $65k total spend across Q2.', p2id]);
  console.log("✓ Project 2: Kevin Hart - Warehouse Expansion");

  // 3. Brandon Carter (id:10) — AM Sarah Mitchell (7)
  const p3 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',10,7,1) RETURNING id
  `, [
    '2026 Annual Contract Renewal',
    'Renewal of master supply agreement with Hart Construction. Covers standard pricing for fasteners, PPE, and power tools for all 3 job sites.',
    'on_hold', 120000
  ]);
  const p3id = p3.rows[0].id;
  const carterOrders = byUser[10] || [];
  if (carterOrders[0]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p3id, carterOrders[0].id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (10,7,$1,$2)`,
    ['Contract renewal sent to procurement team. Brandon is in talks with two other suppliers — need to emphasize our lead times and dedicated AM support. Follow up April 15th.', p3id]);
  console.log("✓ Project 3: Brandon Carter - Annual Contract Renewal");

  // 4. Lisa Fernandez (id:11) — AM James Torres (8)
  const p4 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',11,8,1) RETURNING id
  `, [
    'Oakland Site Setup — Safety & Tools',
    'Outfitting new Apex Builders Oakland job site. 25-person crew needs full PPE, power tools, jobsite storage and first aid stations.',
    'active', 42000
  ]);
  const p4id = p4.rows[0].id;
  const lisaOrders = byUser[11] || [];
  if (lisaOrders[0]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p4id, lisaOrders[0].id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (11,8,$1,$2)`,
    ['Lisa confirmed crew start date is May 1st. Need all gear delivered by April 28th at the latest. Expedited shipping approved for this order.', p4id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (11,8,$1,$2)`,
    ['First shipment of hard hats and vests delivered. Lisa signed off on quality. Remaining tool order pending final budget approval from Apex HQ.', p4id]);
  console.log("✓ Project 4: Lisa Fernandez - Oakland Site Setup");

  // 5. Derek Hoffman (id:14) — AM James Torres (8)
  const p5 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',14,8,1) RETURNING id
  `, [
    'Bulk Fastener Supply Program',
    'Standing monthly fastener order for Midwest Pro Services. 3-month pilot program to evaluate pricing vs current distributor.',
    'completed', 18000
  ]);
  const p5id = p5.rows[0].id;
  const derekOrders = byUser[14] || [];
  if (derekOrders[0]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p5id, derekOrders[0].id]);
  if (derekOrders[1]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p5id, derekOrders[1].id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (14,8,$1,$2)`,
    ['3-month pilot completed successfully. Derek confirmed 12% savings vs previous supplier. Contract converting to annual standing order. Great win!', p5id]);
  console.log("✓ Project 5: Derek Hoffman - Bulk Fastener Program");

  // 6. Heather Lawson (id:21) — AM Rachel Nguyen (9)
  const p6 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'customer',21,9,1) RETURNING id
  `, [
    'Facility Modernization — PPE Upgrade',
    'Full PPE upgrade across Lawson Materials 3 distribution facilities. Moving from single-use to reusable respiratory protection and upgrading fall arrest systems.',
    'active', 54000
  ]);
  const p6id = p6.rows[0].id;
  const heatherOrders = byUser[21] || [];
  if (heatherOrders[0]) await pool.query(`INSERT INTO project_orders (project_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p6id, heatherOrders[0].id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (21,9,$1,$2)`,
    ['OSHA compliance audit triggered this project. Heather needs full documentation for all PPE purchases. Will provide certificates of compliance with each order.', p6id]);
  console.log("✓ Project 6: Heather Lawson - Facility Modernization");

  // ── COMPANY PROJECTS ─────────────────────────────────────────────────────

  // 7. Hart Construction (id:1) — AM Sarah Mitchell (7)
  const p7 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'company',1,7,1) RETURNING id
  `, [
    'Commercial Complex — Site Alpha',
    'Large commercial development project requiring phased supply of structural hardware, safety equipment, and power tools across 18-month build timeline.',
    'active', 285000
  ]);
  const p7id = p7.rows[0].id;
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,7,$1,$2)`,
    ['Kickoff meeting with full Hart Construction team. Project runs April 2026 — October 2027. Monthly delivery schedule agreed. Kevin Hart is primary contact, Dana Morris handles POs.', p7id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,7,$1,$2)`,
    ['Phase 1 supply list finalized. 240 hard hats, 500 safety vests, scaffolding hardware and 50 power tool kits. First delivery April 22nd.', p7id]);
  // Link quote #1 (accepted) if customer is from Hart
  const hartCustomers = await pool.query(`SELECT id FROM users WHERE company_id = 1`);
  const hartCustIds = hartCustomers.rows.map(r=>r.id);
  const hartQuote = await pool.query(`SELECT id FROM quotes WHERE customer_id = ANY($1) AND status != 'draft' LIMIT 1`, [hartCustIds]);
  if (hartQuote.rows[0]) {
    await pool.query(`INSERT INTO project_quotes (project_id, quote_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [p7id, hartQuote.rows[0].id]);
  }
  console.log("✓ Project 7: Hart Construction - Site Alpha");

  // 8. Apex Builders (id:2) — AM James Torres (8)
  const p8 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'company',2,8,1) RETURNING id
  `, [
    'Spring Build Season — Tool & Supply Prep',
    'Pre-season stocking program for Apex Builders. Locking in Q2 pricing on power tools, consumables, and PPE ahead of peak season.',
    'active', 78000
  ]);
  const p8id = p8.rows[0].id;
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,8,$1,$2)`,
    ['Lisa Fernandez confirmed Apex wants to lock in Q2 pricing before April 15th. Preparing consolidated quote for review.', p8id]);
  console.log("✓ Project 8: Apex Builders - Spring Build Season");

  // 9. Skyline Development (id:6) — AM Rachel Nguyen (9)
  const p9 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'company',6,9,1) RETURNING id
  `, [
    'Tower 7 — Fall Protection Program',
    'Complete fall arrest and rescue system installation across 40-story Tower 7 construction project. Includes training coordination with certified safety officer.',
    'on_hold', 95000
  ]);
  const p9id = p9.rows[0].id;
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,9,$1,$2)`,
    ['Project on hold pending city permit approval. Skyline expects green light by mid-April. Rachel to follow up April 14th. Budget is confirmed and locked.', p9id]);
  console.log("✓ Project 9: Skyline Development - Tower 7");

  // 10. Vega Trading Co (id:7) — AM Sarah Mitchell (7)
  const p10 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'company',7,7,1) RETURNING id
  `, [
    '2026 Distribution Partnership',
    'Strategic partnership evaluation — Vega Trading Co exploring BuildSupply as preferred industrial supplier for all 4 of their regional distribution hubs.',
    'active', 350000
  ]);
  const p10id = p10.rows[0].id;
  // Link quote #3 (Carlos Vega) to this company project too
  await pool.query(`INSERT INTO project_quotes (project_id, quote_id) VALUES ($1,3) ON CONFLICT DO NOTHING`, [p10id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,7,$1,$2)`,
    ['Executive meeting with Vega Trading leadership. They want a single supplier for all 4 hubs — $350k annual opportunity. Proposal due April 30th.', p10id]);
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,7,$1,$2)`,
    ['Proposed pricing model presented. Vega wants volume discount tiers at $50k, $100k, and $200k thresholds. Running numbers with management now.', p10id]);
  console.log("✓ Project 10: Vega Trading Co - Distribution Partnership");

  // 11. Murray Supply Group (id:11) — AM James Torres (8)
  const p11 = await pool.query(`
    INSERT INTO customer_projects (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
    VALUES ($1,$2,$3,$4,'company',11,8,1) RETURNING id
  `, [
    'Private Label Fastener Line',
    'Murray Supply Group exploring co-branded fastener products sourced through BuildSupply for resale to their end customers.',
    'on_hold', 45000
  ]);
  const p11id = p11.rows[0].id;
  await pool.query(`INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES (NULL,8,$1,$2)`,
    ['Beth Murray introduced this concept last month. Needs internal sign-off from Midwest Pro ownership before moving forward. On hold until May.', p11id]);
  console.log("✓ Project 11: Murray Supply Group - Private Label");

  // Summary
  const count = await pool.query(`SELECT COUNT(*) FROM customer_projects`);
  console.log(`\n✅ Total projects in DB: ${count.rows[0].count}`);
  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
