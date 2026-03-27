import { query } from "@/lib/db";

export default async function CRMInventoryPage() {
  const [locations, products] = await Promise.all([
    query<{ id: number; name: string; city: string; state: string; active: boolean }>(
      "SELECT id, name, city, state, active FROM distribution_centers ORDER BY sort_order ASC"
    ),
    query<{ id: string; name: string; sku: string; category: string; inventory: number; price: number }>(
      `SELECT id::text, name, sku, category, inventory, price
       FROM products ORDER BY inventory ASC LIMIT 100`
    ),
  ]);

  const lowStock  = products.filter(p => p.inventory > 0 && p.inventory <= 10);
  const outStock  = products.filter(p => p.inventory === 0);
  const inStock   = products.filter(p => p.inventory > 10);

  const stockGroups = [
    { label: "Out of Stock",  color: "#ef4444", items: outStock,  icon: "🔴" },
    { label: "Low Stock",     color: "#f97316", items: lowStock,  icon: "🟡" },
    { label: "In Stock",      color: "#22c55e", items: inStock.slice(0, 20), icon: "🟢" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>Inventory</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Stock levels across all {locations.length} distribution centers
        </p>
      </div>

      {/* Location cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {locations.map(loc => (
          <div key={loc.id} style={{ background: loc.active ? "#0d0d0d" : "#f1f1f1",
            borderRadius: 10, padding: "16px 20px",
            border: `1px solid ${loc.active ? "#1f1f1f" : "#e5e5e5"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: loc.active ? "#f5c700" : "#9ca3af",
                  margin: "0 0 2px" }}>{loc.name}</p>
                <p style={{ fontSize: 12, color: loc.active ? "#6b6b6b" : "#d1d5db", margin: 0 }}>
                  {loc.city}, {loc.state}
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                background: loc.active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
                color: loc.active ? "#22c55e" : "#ef4444" }}>
                {loc.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stock summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Out of Stock", value: outStock.length, color: "#ef4444" },
          { label: "Low Stock (≤10)", value: lowStock.length, color: "#f97316" },
          { label: "In Stock", value: inStock.length, color: "#22c55e" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px",
            border: "1px solid #e5e5e5", borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: 28, fontWeight: 900, color: s.color, margin: "0 0 4px" }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stock groups */}
      {stockGroups.filter(g => g.items.length > 0).map(group => (
        <div key={group.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
          overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1",
            display: "flex", alignItems: "center", gap: 8 }}>
            <span>{group.icon}</span>
            <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "#0d0d0d", margin: 0 }}>
              {group.label} ({group.items.length})
            </h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["Product", "SKU", "Category", "Stock", "Price"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10,
                    fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.items.map((p, i) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600, color: "#0d0d0d",
                    maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#6b7280", fontSize: 12 }}>{p.sku}</td>
                  <td style={{ padding: "10px 16px", color: "#6b7280", fontSize: 12 }}>{p.category}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontWeight: 800, color: group.color, fontSize: 14 }}>
                      {p.inventory === 0 ? "Out" : p.inventory}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 700, color: "#374151" }}>
                    ${Number(p.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
