"use client";

import { useState } from "react";

type Hub = {
  id: number; name: string; city: string; state: string; active: boolean;
  sku_count: number; total_units: number; out_of_stock: number; low_stock: number;
};
type HubProduct = {
  product_id: string; name: string; sku: string; category: string;
  quantity: number; price: number;
};

export function InventoryClient({
  hubs, hubProducts,
}: {
  hubs: Hub[];
  hubProducts: Record<number, HubProduct[]>;
}) {
  const [selectedHub, setSelectedHub] = useState<number>(hubs[0]?.id ?? 0);
  const [filter, setFilter] = useState<"all" | "out" | "low" | "ok">("all");
  const [search, setSearch] = useState("");

  const hub = hubs.find(h => h.id === selectedHub);
  const products = hubProducts[selectedHub] ?? [];

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "out" ? p.quantity === 0 :
      filter === "low" ? p.quantity > 0 && p.quantity <= 10 :
      p.quantity > 10;
    return matchSearch && matchFilter;
  });

  const stockColor = (qty: number) =>
    qty === 0 ? "#ef4444" : qty <= 10 ? "#f97316" : "#22c55e";

  const stockLabel = (qty: number) =>
    qty === 0 ? "Out" : qty <= 10 ? `${qty} Low` : String(qty);

  return (
    <div>
      {/* Hub tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {hubs.map(h => (
          <button key={h.id} onClick={() => { setSelectedHub(h.id); setFilter("all"); setSearch(""); }}
            style={{
              padding: "10px 18px", borderRadius: 8, cursor: "pointer", border: "none",
              background: selectedHub === h.id ? "#0d0d0d" : "#fff",
              color: selectedHub === h.id ? "#f5c700" : "#6b7280",
              fontWeight: 700, fontSize: 13,
              borderColor: selectedHub === h.id ? "#0d0d0d" : "#e5e5e5",
              transition: "all 0.15s",
            }}>
            {h.name.replace(" Hub", "")}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
              {h.city}
            </span>
          </button>
        ))}
      </div>

      {hub && (
        <>
          {/* Hub KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total SKUs",    value: hub.sku_count.toLocaleString(),   color: "#f5c700" },
              { label: "Total Units",   value: hub.total_units.toLocaleString(), color: "#3b82f6" },
              { label: "Low Stock",     value: hub.low_stock,                    color: "#f97316" },
              { label: "Out of Stock",  value: hub.out_of_stock,                 color: "#ef4444" },
            ].map(k => (
              <div key={k.label} style={{ background: "var(--crm-surface)", borderRadius: 10, padding: "16px 18px",
                border: "1px solid var(--crm-border)", borderTop: `3px solid ${k.color}` }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--crm-text)", margin: "0 0 4px" }}>{k.value}</p>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Filter + search bar */}
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
            padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--crm-muted2)", fontSize: 14 }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search product, SKU, category..."
                style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 6, fontSize: 13,
                  border: "1px solid var(--crm-border)", outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "out", "low", "ok"] as const).map(f => {
                const labels = { all: "All", out: "🔴 Out", low: "🟡 Low", ok: "🟢 In Stock" };
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                    border: `1px solid ${filter === f ? "#0d0d0d" : "#e5e5e5"}`,
                    background: filter === f ? "#0d0d0d" : "#fff",
                    color: filter === f ? "#f5c700" : "#6b7280",
                    transition: "all 0.15s",
                  }}>{labels[f]}</button>
                );
              })}
            </div>
            <span style={{ fontSize: 12, color: "var(--crm-muted2)", fontWeight: 600 }}>
              {filtered.length.toLocaleString()} products
            </span>
          </div>

          {/* Products table */}
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0d0d0d" }}>
                  {["Product", "SKU", "Category", "Stock", "Price"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                      fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f5c700" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px 24px", textAlign: "center", color: "var(--crm-muted2)" }}>
                    No products match your filter
                  </td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.product_id} style={{ borderTop: "1px solid var(--crm-border2)",
                    background: i % 2 === 0 ? "var(--crm-surface)" : "var(--crm-surface2)" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600, color: "var(--crm-text)",
                      maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--crm-muted)", fontSize: 12 }}>{p.sku}</td>
                    <td style={{ padding: "10px 16px", color: "var(--crm-muted)", fontSize: 12 }}>{p.category}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontWeight: 800, color: stockColor(p.quantity), fontSize: 14 }}>
                        {stockLabel(p.quantity)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "var(--crm-text2)" }}>
                      ${Number(p.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
