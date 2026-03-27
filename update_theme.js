const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(
  "UPDATE site_theme SET color_primary=$1, color_accent=$2, color_background=$3, color_foreground=$4 WHERE id=1",
  ["#0d0d0d", "#f5c700", "#f2f2f2", "#0d0d0d"]
).then(r => { console.log("Updated:", r.rowCount, "row(s)"); pool.end(); })
 .catch(e => { console.error(e.message); pool.end(); });
