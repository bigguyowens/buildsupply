'use client';

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { updateProductAction } from "@/app/actions/admin";

export type Product = {
  id: string; name: string; slug: string; description: string;
  category: string; subcategory: string; brand: string; sku: string;
  price: number; currency: string; inventory: number; featured: boolean;
  unit: string; tags: string[]; image: string; gallery: string[];
  rating: number; ratingCount: number;
};

const EMPTY_FORM = {
  name: "", sku: "", price: "", currency: "USD", category: "", subcategory: "",
  brand: "", unit: "each", inventory: "", featured: false, description: "",
  tags: "", image: "", rating: "4.0", ratingCount: "0",
};

function EditableNumber({ value, onSave, prefix = "" }: { value: number; onSave: (v: number) => void; prefix?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (editing) return (
    <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); const n = parseFloat(draft); if (!isNaN(n)) onSave(n); else setDraft(String(value)); }}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setEditing(false); setDraft(String(value)); } }}
      style={{ width: 80, padding: "3px 6px", borderRadius: 4, border: "1px solid #f97316", fontSize: 13, outline: "none", textAlign: "right" }}
    />
  );
  return (
    <span onClick={() => { setEditing(true); setDraft(String(value)); }} style={{ cursor: "text", borderBottom: "1px dashed #d1d5db", paddingBottom: 1, fontSize: 13, fontWeight: 600 }} title="Click to edit">
      {prefix}{value.toLocaleString()}
    </span>
  );
}

// ── Product Drawer ───────────────────────────────────────
function ProductDrawer({ product, onClose, onSave }: {
  product: Product;
  onClose: () => void;
  onSave: (id: string, fields: Partial<Product>) => void;
}) {
  const [draft, setDraft] = useState({ ...product, tags: Array.isArray(product.tags) ? product.tags.join(", ") : "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const set = (k: string, v: unknown) => setDraft(d => ({ ...d, [k]: v }));

  async function handleSave() {
    setSaving(true);
    const fields = {
      ...draft,
      price:    Number(draft.price),
      inventory: Number(draft.inventory),
      rating:   Number(draft.rating),
      tags: typeof draft.tags === "string"
        ? (draft.tags as string).split(",").map((s: string) => s.trim()).filter(Boolean)
        : draft.tags,
    };
    await updateProductAction(product.id, fields);
    onSave(product.id, fields);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const field = (label: string, key: string, type = "text", half = false) => (
    <div style={{ gridColumn: half ? "span 1" : "span 2" }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={draft[key as keyof typeof draft] as string ?? ""} onChange={e => set(key, e.target.value)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  const stockLevel = draft.inventory === 0 ? "out" : draft.inventory < 5 ? "critical" : draft.inventory < 20 ? "low" : "ok";
  const stockColors = { out: "#dc2626", critical: "#dc2626", low: "#d97706", ok: "#16a34a" }[stockLevel];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 150, transition: "opacity 0.2s" }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 520, maxWidth: "95vw",
        background: "white", zIndex: 160, overflowY: "auto",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0 }}>
          {product.image && (
            <div style={{ position: "relative", width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#f8fafc" }}>
              <Image src={product.image} alt={product.name} fill style={{ objectFit: "cover" }} sizes="56px" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 3px", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{product.sku}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: stockColors }}>● {stockLevel === "out" ? "Out of Stock" : stockLevel === "critical" ? "Critical" : stockLevel === "low" ? "Low Stock" : "In Stock"} ({product.inventory})</span>
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", flexShrink: 0, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Image preview strip */}
          {product.gallery?.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
              {[product.image, ...product.gallery].filter(Boolean).map((src, i) => (
                <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid #e2e8f0" }}>
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="72px" />
                </div>
              ))}
            </div>
          )}

          {/* Editable fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {field("Product Name", "name")}
            {field("SKU", "sku", "text", true)}
            {field("Brand", "brand", "text", true)}
            {field("Price", "price", "number", true)}
            {field("Currency", "currency", "text", true)}
            {field("Inventory", "inventory", "number", true)}
            {field("Unit", "unit", "text", true)}
            {field("Category", "category", "text", true)}
            {field("Subcategory", "subcategory", "text", true)}
            {field("Rating (0–5)", "rating", "number", true)}
            {field("Review Count", "ratingCount", "number", true)}

            {/* Featured toggle */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 6 }}>Featured</label>
              <button onClick={() => set("featured", !draft.featured)} style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, background: draft.featured ? "#fff7ed" : "white", color: draft.featured ? "#f97316" : "#64748b" }}>
                {draft.featured ? "★ Featured — click to unfeature" : "☆ Not Featured — click to feature"}
              </button>
            </div>

            {/* Description */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Description</label>
              <textarea value={draft.description ?? ""} onChange={e => set("description", e.target.value)} rows={4}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Tags */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Tags <span style={{ fontWeight: 400, textTransform: "none" }}>(comma-separated)</span></label>
              <input value={typeof draft.tags === "string" ? draft.tags : (draft.tags as string[]).join(", ")} onChange={e => set("tags", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Image URL */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Primary Image URL</label>
              <input value={draft.image ?? ""} onChange={e => set("image", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Slug (read-only) */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Slug <span style={{ fontWeight: 400, textTransform: "none", color: "#94a3b8" }}>(auto-generated, read-only)</span></label>
              <input value={product.slug} readOnly
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #f1f5f9", fontSize: 12, fontFamily: "monospace", background: "#f8fafc", color: "#94a3b8", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0, background: "white" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "9px 24px", borderRadius: 6, border: "none", background: saved ? "#16a34a" : "#f97316", color: "white", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.8 : 1, minWidth: 100 }}>
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Add Product Modal ─────────────────────────────────────
function AddProductModal({ onClose, onAdded }: { onClose: () => void; onAdded: (p: Product) => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), inventory: Number(form.inventory), rating: Number(form.rating), ratingCount: Number(form.ratingCount), tags: form.tags.split(",").map((s: string) => s.trim()).filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to add product"); return; }
      onAdded({ id: data.id, name: form.name, slug: "", description: form.description, category: form.category, subcategory: form.subcategory, brand: form.brand, sku: form.sku, price: Number(form.price), currency: form.currency, inventory: Number(form.inventory), featured: form.featured, unit: form.unit, tags: form.tags.split(",").map((s: string) => s.trim()).filter(Boolean), image: form.image, gallery: [], rating: Number(form.rating), ratingCount: Number(form.ratingCount) });
      onClose();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={form[key as keyof typeof form] as string} onChange={e => set(key, e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 12, padding: 28, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add New Product</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {field("Product Name *", "name", "text", "e.g. Heavy Duty Drill")}
          {field("SKU *", "sku", "text", "e.g. DRILL-001")}
          {field("Price *", "price", "number", "29.99")}
          {field("Currency", "currency", "text", "USD")}
          {field("Category *", "category", "text", "e.g. Power Tools")}
          {field("Subcategory", "subcategory", "text", "e.g. Drills")}
          {field("Brand", "brand", "text", "e.g. DeWalt")}
          {field("Unit", "unit", "text", "each / box / pack")}
          {field("Inventory", "inventory", "number", "0")}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Featured</label>
            <button onClick={() => set("featured", !form.featured)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: 600, background: form.featured ? "#fff7ed" : "white", color: form.featured ? "#f97316" : "#64748b" }}>
              {form.featured ? "★ Featured" : "☆ Not Featured"}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 4 }}>Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Product description..."
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          {field("Tags (comma-separated)", "tags", "text", "drill, cordless, 18v")}
          {field("Image URL", "image", "text", "https://...")}
          {field("Rating (0-5)", "rating", "number", "4.0")}
          {field("Review Count", "ratingCount", "number", "0")}
        </div>
        {error && <p style={{ marginTop: 12, color: "#dc2626", fontSize: 13, fontWeight: 600 }}>⚠ {error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: "#f97316", color: "white", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Import Modal ─────────────────────────────────────
function BulkImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number; total: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;
    setUploading(true); setError(""); setResult(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/products/bulk", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Import failed"); return; }
      setResult(data);
      if (data.inserted > 0) onImported();
    } catch (e) { setError((e as Error).message); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 12, padding: 28, width: "100%", maxWidth: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Bulk Import Products</h2>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
        </div>
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 20, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>Step 1 — Download the template</p>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>Fill in your products using the Excel template. See the Instructions tab for guidance.</p>
          <a href="/api/admin/products/sample" download style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, background: "#0f172a", color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            ⬇ Download Template
          </a>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 6px" }}>Step 2 — Upload your file</p>
          <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #e2e8f0", borderRadius: 8, padding: "24px", textAlign: "center", cursor: "pointer", background: file ? "#f0fdf4" : "white", borderColor: file ? "#86efac" : "#e2e8f0" }}>
            <p style={{ fontSize: 24, margin: "0 0 6px" }}>📊</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#475569", margin: 0 }}>{file ? file.name : "Click to select .xlsx file"}</p>
            {file && <p style={{ fontSize: 11, color: "#16a34a", margin: "4px 0 0", fontWeight: 700 }}>✓ File ready</p>}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {result && (
          <div style={{ background: result.inserted > 0 ? "#f0fdf4" : "#fef2f2", borderRadius: 8, padding: 16, marginBottom: 16, border: `1px solid ${result.inserted > 0 ? "#86efac" : "#fecaca"}` }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 8px", color: result.inserted > 0 ? "#15803d" : "#dc2626" }}>
              {result.inserted > 0 ? `✓ Imported ${result.inserted} of ${result.total} products` : "No products imported"}
            </p>
            {result.skipped > 0 && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>{result.skipped} rows skipped</p>}
            {result.errors.map((e, i) => <p key={i} style={{ fontSize: 11, color: "#dc2626", margin: "2px 0" }}>• {e}</p>)}
          </div>
        )}
        {error && <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚠ {error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Close</button>
          <button onClick={handleImport} disabled={!file || uploading} style={{ padding: "9px 20px", borderRadius: 6, border: "none", background: "#f97316", color: "white", cursor: (!file || uploading) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: (!file || uploading) ? 0.6 : 1 }}>
            {uploading ? "Importing..." : "Import Products"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────
export function AdminProductsClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts]       = useState(initial);
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [selectedProduct, setSelected] = useState<Product | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [showBulk, setShowBulk]       = useState(false);
  const [, startTransition]           = useTransition();

  function updateLocal(id: string, fields: Partial<Product>) {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, ...fields } : p));
    if (selectedProduct?.id === id) setSelected(s => s ? { ...s, ...fields } : s);
  }

  function quickSave(id: string, fields: { price?: number; inventory?: number; featured?: boolean }) {
    updateLocal(id, fields);
    startTransition(() => updateProductAction(id, fields));
  }

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const filtered = products.filter(p => {
    const matchCat   = filter === "low-stock" ? p.inventory < 20 : filter === "all" || p.category === filter;
    const matchSearch = !search || `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onAdded={p => setProducts(ps => [p, ...ps])} />}
      {showBulk && <BulkImportModal onClose={() => setShowBulk(false)} onImported={() => window.location.reload()} />}
      {selectedProduct && (
        <ProductDrawer
          product={selectedProduct}
          onClose={() => setSelected(null)}
          onSave={(id, fields) => updateLocal(id, fields)}
        />
      )}

      <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, brand, SKU..."
            style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, width: 220, outline: "none" }} />
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
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>{filtered.length} products</span>
          <button onClick={() => setShowBulk(true)} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#475569" }}>
            📊 Bulk Import
          </button>
          <button onClick={() => setShowAdd(true)} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: "#f97316", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "white" }}>
            + Add Product
          </button>
        </div>

        {/* Table */}
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
              const isSelected = selectedProduct?.id === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer", background: isSelected ? "#fff7ed" : stockLevel === "critical" || stockLevel === "out" ? "#fff8f8" : "white", transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = stockLevel === "critical" || stockLevel === "out" ? "#fff8f8" : "white"; }}
                >
                  <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                    <p style={{ fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#0f172a" }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{p.brand}</p>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.subcategory || p.category}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{p.sku}</td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <EditableNumber value={p.price} prefix="$" onSave={v => quickSave(p.id, { price: v })} />
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <EditableNumber value={p.inventory} onSave={v => quickSave(p.id, { inventory: Math.round(v) })} />
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => quickSave(p.id, { featured: !p.featured })} style={{ padding: "4px 12px", borderRadius: 9999, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: p.featured ? "#fff7ed" : "#f1f5f9", color: p.featured ? "#f97316" : "#94a3b8" }}>
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
    </>
  );
}
