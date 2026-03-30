const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const projects = [
    { name: 'Commercial Complex — Site Alpha', status: 'active', value: 285000, entity_type: 'company', entity_id: 1, am: 7,
      desc: 'Large commercial development project requiring phased supply across 18-month build timeline.',
      note: 'Phase 1 supply list finalized. 240 hard hats, 500 safety vests, scaffolding hardware and 50 power tool kits. First delivery April 22nd.' },
    { name: 'Spring Build Season — Tool & Supply Prep', status: 'active', value: 78000, entity_type: 'company', entity_id: 2, am: 8,
      desc: 'Pre-season stocking program for Apex Builders. Locking in Q2 pricing on power tools and PPE.',
      note: 'Lisa Fernandez confirmed Apex wants to lock in Q2 pricing before April 15th. Preparing consolidated quote for review.' },
    { name: 'Tower 7 — Fall Protection Program', status: 'on_hold', value: 95000, entity_type: 'company', entity_id: 6, am: 9,
      desc: 'Complete fall arrest and rescue system installation across 40-story Tower 7 construction project.',
      note: 'Project on hold pending city permit approval. Skyline expects green light by mid-April. Budget is confirmed and locked.' },
    { name: '2026 Distribution Partnership', status: 'active', value: 350000, entity_type: 'company', entity_id: 7, am: 7,
      desc: 'Strategic partnership — Vega Trading Co exploring BuildSupply as preferred supplier for all 4 regional hubs.',
      note: 'Executive meeting with Vega Trading leadership. They want a single supplier for all 4 hubs. Proposal due April 30th.' },
    { name: 'Private Label Fastener Line', status: 'on_hold', value: 45000, entity_type: 'company', entity_id: 11, am: 8,
      desc: 'Murray Supply Group exploring co-branded fastener products sourced through BuildSupply for resale.',
      note: 'Beth Murray introduced this concept last month. Needs internal sign-off before moving forward. On hold until May.' },
  ];

  for (const p of projects) {
    const r = await pool.query(
      `INSERT INTO customer_projects (name,description,status,value,entity_type,entity_id,assigned_to,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,1) RETURNING id`,
      [p.name, p.desc, p.status, p.value, p.entity_type, p.entity_id, p.am]
    );
    const pid = r.rows[0].id;
    await pool.query(
      `INSERT INTO crm_notes (customer_id,author_id,body,project_id) VALUES (NULL,$1,$2,$3)`,
      [p.am, p.note, pid]
    );
    // Link quote #3 to Vega Trading Co project
    if (p.entity_id === 7) {
      await pool.query(`INSERT INTO project_quotes (project_id,quote_id) VALUES ($1,3) ON CONFLICT DO NOTHING`, [pid]);
    }
    console.log("✓", p.name);
  }

  const cnt = await pool.query(`SELECT COUNT(*) FROM customer_projects`);
  console.log("Total projects:", cnt.rows[0].count);
  pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
