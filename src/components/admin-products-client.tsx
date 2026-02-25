'use client';

import { useState, useTransition } from "react";
import { updateProductAction } from "@/app/actions/admin";

type Product = {
  id: string; name: string; category: string; subcategory: string;
  brand: string; sku: string; price: number; inventory: number; featured: boolean;
};

function EditableNumber({ value, onSave, prefix = "" }: { value: number; onSave: (v: number) => void; prefix?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (editing) return (
    <input
      autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); const n = parseFloat(draft); if (!isNaN(n)) onSave(n); else setDraft(String(value)); }}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setEditing(false); setDraft(String(value)); } }}
      style={{ width: 80, padding: "3px 6px", borderRadius: 4, border: "1px solid #f97316", fontSize: 13, outline: "none", textAlign: "right" }}
    />
  );

  return (
    <span onClick={() => setEditing(true)} style={{ cursor: "text", borderBottom: "1px dashed #d1d5db", paddingBottom: 1, fontSize: 13, fontWeight: 600 }} title="Click to edit">
      {prefix}{typeof value === "number" ? value.toLocaleString() : value}
    </span>
  );
}

export function AdminProductsClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  function updateLocal(id: string, fields: Partial<Product>) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, ...fields } : p));
  }

  function save(id: string, fields: { price?: number; inventory?: number; featured?: boolean }) {
    updateLocal(id, fields);
    startTransition(() => updateProductAction(id, fields));
  }

  const categories = ["all", ...Array.from(new Set(initial.map(p => p.category))).sort()];

  const filtered = products.filter(p => {
    const matchCat = filter === "all" || p.category === filter;
    const matchStock = filter === "low-stock" ? p.inventory < 20 : true;
    const matchSearch = !search || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(search.toLowerCase());
    return (filter === "low-stock" ? matchStock : matchCat) && matchSearch;
  });

  return (
    <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, brand, SKU..."
          style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, width: 240, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("low-stock")} style={{ padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: filter === "low-stock" ? "#fee2e2" : "#f1f5f9", color: filter === "low-stock" ? "#991b1b" : "#64748b" }}>
            ⚠ Low Stock
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{ padding: "5px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: filter === c ? "#0f172a" : "#f1f5f9", color: filter === c ? "white" : "#64748b" }}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>{filtered.length} products {pending ? "· saving..." : ""}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Product", "Category", "SKU", "Price", "Inventory", "Featured", "Stock"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>No products found</td></tr>
          ) : filtered.map(p => {
            const stockLevel = p.inventory === 0 ? "out" : p.inventory < 5 ? "critical" : p.inventory < 20 ? "low" : "ok";
            const stockStyle = { out: { bg: "#fee2e2", color: "#991b1b" }, critical: { bg: "#fee2e2", color: "#991b1b" }, low: { bg: "#fef9c3", color: "#854d0e" }, ok: { bg: "#dcfce7", color: "#15803d" } }[stockLevel];
            return (
              <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9", background: stockLevel === "critical" || stockLevel === "out" ? "#fff8f8" : "white" }}>
                <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                  <p style={{ fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#0f172a" }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{p.brand}</p>
                </td>
                <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.subcategory || p.category}</td>
                <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                <td style={{ padding: "12px 16px" }}>
                  <EditableNumber value={p.price} prefix="$" onSave={v => save(p.id, { price: v })} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <EditableNumber value={p.inventory} onSave={v => save(p.id, { inventory: Math.round(v) })} />
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button
                    onClick={() => save(p.id, { featured: !p.featured })}
                    style={{ padding: "4px 12px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: p.featured ? "#fff7ed" : "#f1f5f9", color: p.featured ? "#f97316" : "#94a3b8" }}
                  >
                    {p.featured ? "★ Featured" : "☆ No"}
                  </button>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: stockStyle.bg, color: stockStyle.color }}>
                    {stockLevel === "out" ? "Out of Stock" : stockLevel === "critical" ? "Critical" : stockLevel === "low" ? "Low" : "In Stock"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
