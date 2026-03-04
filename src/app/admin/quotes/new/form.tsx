'use client';

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction, sendQuoteAction } from "@/app/actions/quotes";
import type { QuoteItemInput } from "@/app/actions/quotes";

type Customer = { id: number; first_name: string; last_name: string; email: string };
type Product  = { id: string; name: string; sku: string; image: string; slug: string; price: number; category: string; brand: string; inventory: number };

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

// ── Small subcomponent: one line item row ─────────────────────────────────
function LineRow({
  item, index, onChange, onRemove,
}: {
  item: QuoteItemInput & { product_brand: string };
  index: number;
  onChange: (i: number, field: string, val: string | number) => void;
  onRemove: (i: number) => void;
}) {
  const savings = item.original_price - item.quoted_price;
  const pct     = item.original_price > 0 ? ((savings / item.original_price) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 110px 80px 28px", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--ad-border2)" }}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{item.product_name}</p>
        <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "2px 0 0" }}>{item.product_brand} · SKU {item.product_sku || "—"}</p>
      </div>

      <input
        type="number" min={1} value={item.quantity}
        onChange={e => onChange(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, width: "100%", textAlign: "center" }}
      />

      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: 0 }}>List</p>
        <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{fmt(item.original_price)}</p>
      </div>

      <div>
        <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "0 0 2px" }}>Quoted</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--ad-muted)" }}>$</span>
          <input
            type="number" min={0} step={0.01}
            value={item.quoted_price}
            onChange={e => onChange(index, "quoted_price", parseFloat(e.target.value) || 0)}
            style={{ padding: "5px 6px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, width: "100%", fontWeight: 700 }}
          />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        {savings > 0 ? (
          <span style={{ fontSize: 11, fontWeight: 700, background: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: 4 }}>
            -{pct.toFixed(0)}%
          </span>
        ) : savings < 0 ? (
          <span style={{ fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "2px 6px", borderRadius: 4 }}>
            +{Math.abs(pct).toFixed(0)}%
          </span>
        ) : null}
      </div>

      <button onClick={() => onRemove(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ad-muted2)", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────
export function NewQuoteForm({ customers, products }: { customers: Customer[]; products: Product[] }) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch]   = useState("");
  const [items, setItems]                   = useState<(QuoteItemInput & { product_brand: string })[]>([]);
  const [notes, setNotes]                   = useState("");
  const [internalNotes, setInternalNotes]   = useState("");
  const [expiresAt, setExpiresAt]           = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = productSearch.length > 1
    ? products.filter(p =>
        `${p.name} ${p.sku} ${p.brand} ${p.category}`.toLowerCase().includes(productSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const selectedCustomer = customers.find(c => c.id === customerId);

  const addProduct = (p: Product) => {
    if (items.some(i => i.product_id === p.id)) return;
    setItems(prev => [...prev, {
      product_id: p.id, product_name: p.name, product_sku: p.sku,
      product_image: p.image, product_slug: p.slug, product_brand: p.brand,
      quantity: 1, original_price: p.price, quoted_price: p.price,
    }]);
    setProductSearch("");
  };

  const changeItem = useCallback((i: number, field: string, val: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }, []);

  const removeItem = useCallback((i: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const quotedTotal    = items.reduce((s, i) => s + i.quoted_price * i.quantity, 0);
  const listTotal      = items.reduce((s, i) => s + i.original_price * i.quantity, 0);
  const totalSavings   = listTotal - quotedTotal;

  async function handleSave(andSend: boolean) {
    if (!customerId) { setError("Please select a customer."); return; }
    if (!items.length) { setError("Add at least one product."); return; }
    setSaving(true); setError(null);

    const result = await createQuoteAction({
      customer_id: customerId,
      items,
      notes,
      internal_notes: internalNotes,
      expires_at: expiresAt,
    });

    if (!result.success) { setError(result.error); setSaving(false); return; }

    if (andSend) {
      await sendQuoteAction(result.quoteId);
    }

    router.push(`/admin/quotes/${result.quoteId}`);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

      {/* ── Left ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 }}>{error}</div>
        )}

        {/* Customer picker */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Customer</h2>

          {selectedCustomer ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                <p style={{ fontSize: 12, color: "var(--ad-muted)", margin: "2px 0 0" }}>{selectedCustomer.email}</p>
              </div>
              <button onClick={() => setCustomerId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ad-muted2)", fontSize: 18 }}>×</button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                placeholder="Search customers by name or email…"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ad-border)", fontSize: 14, boxSizing: "border-box" }}
              />
              {customerSearch.length > 0 && filteredCustomers.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, maxHeight: 240, overflowY: "auto" }}>
                  {filteredCustomers.slice(0, 8).map(c => (
                    <button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerSearch(""); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{c.first_name} {c.last_name}</p>
                      <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: 0 }}>{c.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product search + line items */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Line Items</h2>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              placeholder="Search products to add…"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ad-border)", fontSize: 14, boxSizing: "border-box" }}
            />
            {filteredProducts.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50 }}>
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: 0 }}>{p.brand} · {p.category}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text)", flexShrink: 0, marginLeft: 12 }}>{fmt(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column headers */}
          {items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 110px 80px 28px", gap: 10, padding: "0 0 8px", borderBottom: "2px solid #f1f5f9" }}>
              {["Product", "Qty", "List Price", "Quoted Price", "Disc.", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ad-muted2)" }}>{h}</span>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <p style={{ color: "var(--ad-muted2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Search for products above to add line items</p>
          ) : (
            items.map((item, i) => (
              <LineRow key={item.product_id} item={item} index={i} onChange={changeItem} onRemove={removeItem} />
            ))
          )}
        </div>

        {/* Notes */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Notes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-muted)", display: "block", marginBottom: 6 }}>Customer-facing message</label>
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Thank you for your interest! This quote includes custom pricing for your project…"
                rows={3}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ad-border)", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-muted)", display: "block", marginBottom: 6 }}>Internal notes (admin only)</label>
              <textarea
                value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                placeholder="e.g. Bulk order customer, negotiate shipping…"
                rows={2}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--ad-border)", fontSize: 13, boxSizing: "border-box", resize: "vertical" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Summary */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Quote Summary</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ad-muted)" }}>
              <span>List price</span><span>{fmt(listTotal)}</span>
            </div>
            {totalSavings !== 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: totalSavings > 0 ? "#15803d" : "#dc2626" }}>
                <span>{totalSavings > 0 ? "Customer saves" : "Above list"}</span>
                <span>{totalSavings > 0 ? "-" : "+"}{fmt(Math.abs(totalSavings))}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, borderTop: "1px solid var(--ad-border2)", paddingTop: 10, color: "var(--ad-text)" }}>
              <span>Quoted total</span><span>{fmt(quotedTotal)}</span>
            </div>
          </div>

          {/* Expiry */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-muted)", display: "block", marginBottom: 6 }}>Quote expires</label>
            <input
              type="date" value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--ad-border)", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !customerId || !items.length}
              style={{
                padding: "11px 0", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14,
                background: saving || !customerId || !items.length ? "#9ca3af" : "#f97316",
                color: "white", cursor: saving || !customerId || !items.length ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              {saving ? "Saving…" : "💌 Save & Send to Customer"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !customerId || !items.length}
              style={{
                padding: "11px 0", borderRadius: 8, border: "1px solid var(--ad-border)", fontWeight: 700, fontSize: 14,
                background: "var(--ad-surface)", color: "var(--ad-text2)",
                cursor: saving || !customerId || !items.length ? "not-allowed" : "pointer",
                width: "100%",
              }}
            >
              Save as Draft
            </button>
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", margin: "0 0 8px" }}>💡 Tips</p>
          <ul style={{ fontSize: 12, color: "#78350f", margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
            <li>Set quoted price below list to offer a discount</li>
            <li>Customer receives an email-style notification in their account</li>
            <li>Drafts are invisible to customers until sent</li>
            <li>Quotes expire automatically after the set date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
