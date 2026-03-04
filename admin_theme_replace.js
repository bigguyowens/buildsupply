const fs = require("fs");
const path = require("path");

function walkFiles(dir, exts) {
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (exts.some(e => entry.name.endsWith(e))) results.push(full);
    }
  }
  walk(dir);
  return results;
}

const files = [
  ...walkFiles("C:/NextJS_Ecomm/src/app/admin", [".tsx", ".ts"]),
  "C:/NextJS_Ecomm/src/components/admin-sidebar.tsx",
];

const REPLACEMENTS = [
  [/background:\s*"white"/g,               'background: "var(--ad-surface)"'],
  [/background:\s*"#ffffff"/gi,            'background: "var(--ad-surface)"'],
  [/background:\s*"#f8fafc"/g,             'background: "var(--ad-surface2)"'],
  [/background:\s*"#fafafa"/g,             'background: "var(--ad-surface2)"'],
  [/background:\s*"#f1f5f9"/g,             'background: "var(--ad-surface2)"'],
  [/background:\s*"#f9fafb"/g,             'background: "var(--ad-surface2)"'],
  [/border:\s*"1px solid #e2e8f0"/g,       'border: "1px solid var(--ad-border)"'],
  [/border:\s*"1px solid #f1f5f9"/g,       'border: "1px solid var(--ad-border2)"'],
  [/borderColor:\s*"#e2e8f0"/g,            'borderColor: "var(--ad-border)"'],
  [/borderColor:\s*"#f1f5f9"/g,            'borderColor: "var(--ad-border2)"'],
  [/borderBottom:\s*"1px solid #e2e8f0"/g, 'borderBottom: "1px solid var(--ad-border)"'],
  [/borderBottom:\s*"1px solid #f1f5f9"/g, 'borderBottom: "1px solid var(--ad-border2)"'],
  [/borderTop:\s*"1px solid #e2e8f0"/g,    'borderTop: "1px solid var(--ad-border)"'],
  [/borderTop:\s*"1px solid #f1f5f9"/g,    'borderTop: "1px solid var(--ad-border2)"'],
  [/borderRight:\s*"1px solid #e2e8f0"/g,  'borderRight: "1px solid var(--ad-border)"'],
  [/borderLeft:\s*"1px solid #e2e8f0"/g,   'borderLeft: "1px solid var(--ad-border)"'],
  [/color:\s*"#0f172a"/g,                  'color: "var(--ad-text)"'],
  [/color:\s*"#111827"/g,                  'color: "var(--ad-text)"'],
  [/color:\s*"#1e293b"/g,                  'color: "var(--ad-text)"'],
  [/color:\s*"#374151"/g,                  'color: "var(--ad-text2)"'],
  [/color:\s*"#475569"/g,                  'color: "var(--ad-text2)"'],
  [/color:\s*"#64748b"/g,                  'color: "var(--ad-muted)"'],
  [/color:\s*"#94a3b8"/g,                  'color: "var(--ad-muted2)"'],
  [/boxShadow:\s*"0 1px 3px rgba\(0,0,0,0\.05\)"/g, 'boxShadow: "0 1px 3px var(--ad-shadow)"'],
  [/boxShadow:\s*"0 1px 4px rgba\(0,0,0,0\.05\)"/g, 'boxShadow: "0 1px 4px var(--ad-shadow)"'],
  [/boxShadow:\s*"0 2px 6px rgba\(0,0,0,0\.06\)"/g, 'boxShadow: "0 2px 6px var(--ad-shadow)"'],
  [/boxShadow:\s*"0 4px 6px rgba\(0,0,0,0\.05\)"/g, 'boxShadow: "0 4px 6px var(--ad-shadow)"'],
];

let totalFiles = 0;
let totalChanges = 0;

for (const full of files) {
  let src = fs.readFileSync(full, "utf8");
  let prev = src;
  let changes = 0;
  for (const [regex, replacement] of REPLACEMENTS) {
    const matches = (src.match(regex) || []).length;
    src = src.replace(regex, replacement);
    changes += matches;
  }
  if (src !== prev) {
    fs.writeFileSync(full, src, "utf8");
    const rel = full.replace("C:/NextJS_Ecomm/", "").replace(/\\/g, "/");
    console.log(`✓ ${rel} (${changes} replacements)`);
    totalFiles++;
    totalChanges += changes;
  }
}

console.log(`\nDone: ${totalChanges} replacements across ${totalFiles} files.`);
