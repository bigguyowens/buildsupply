'use client';

import Link from "next/link";
import { ProductImage } from "./product-image";
import type { Product } from "@/lib/products";

type Props = {
  items: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#f97316", fontSize: 14 }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td style={{
      padding: "14px 20px", verticalAlign: "middle", textAlign: "center",
      borderRight: "1px solid #e2e8f0", fontSize: 13, color: "#374151",
      background: highlight ? "#fff7ed" : "white",
    }}>
      {children}
    </td>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <td style={{
      padding: "14px 20px", verticalAlign: "middle", textAlign: "right",
      background: "#f8fafc", borderRight: "1px solid #e2e8f0",
      fontSize: 12, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.06em", color: "#64748b", whiteSpace: "nowrap",
      position: "sticky", left: 0, zIndex: 2,
    }}>
      {children}
    </td>
  );
}

export function CompareModal({ items, onClose, onRemove }: Props) {
  const fmt = (p: Product) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.price);

  // Gather all spec keys across all products
  const allSpecKeys = Array.from(
    new Set(items.flatMap(p => Object.keys(p.specs ?? {})))
  );

  // Find the best price for highlighting
  const minPrice = Math.min(...items.map(p => p.price));
  const maxRating = Math.max(...items.map(p => p.rating));

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400 }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "5vh", left: "50%", transform: "translateX(-50%)",
        width: "min(1100px, 95vw)", maxHeight: "88vh",
        background: "white", borderRadius: 14, zIndex: 401,
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
          background: "#0f172a",
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: "white" }}>
              Compare Products
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>
              {items.length} products · {items[0]?.category}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, width: 34, height: 34, cursor: "pointer", color: "white", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable table */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 160 }} />
              {items.map(p => <col key={p.id} style={{ width: `${(100 - 14) / items.length}%` }} />)}
            </colgroup>

            {/* ── Product header row ── */}
            <thead style={{ position: "sticky", top: 0, zIndex: 3 }}>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "12px 20px", background: "#f8fafc", position: "sticky", left: 0, zIndex: 4, borderRight: "1px solid #e2e8f0" }} />
                {items.map(p => (
                  <th key={p.id} style={{ padding: "12px 16px", textAlign: "center", borderRight: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <button
                        onClick={() => onRemove(p.id)}
                        title="Remove from compare"
                        style={{ background: "#fee2e2", border: "none", borderRadius: 4, color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 6px", flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ── Image row ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <RowLabel>Product</RowLabel>
                {items.map(p => (
                  <Cell key={p.id}>
                    <Link href={`/products/${p.slug}`} onClick={onClose}>
                      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
                        <ProductImage src={p.image} alt={p.name} fill style={{ objectFit: "contain" }} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "10px 0 0", lineHeight: 1.4 }}>{p.name}</p>
                    </Link>
                  </Cell>
                ))}
              </tr>

              {/* ── Price row ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                <RowLabel>Price</RowLabel>
                {items.map(p => (
                  <Cell key={p.id} highlight={p.price === minPrice}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: p.price === minPrice ? "#f97316" : "#0f172a" }}>
                      {fmt(p)}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>/ {p.unit}</span>
                    {p.price === minPrice && items.length > 1 && (
                      <span style={{ display: "inline-block", marginTop: 4, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 4, fontSize: 10, fontWeight: 800, color: "#f97316", padding: "2px 7px", textTransform: "uppercase" }}>
                        Best Price
                      </span>
                    )}
                  </Cell>
                ))}
              </tr>

              {/* ── Rating row ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <RowLabel>Rating</RowLabel>
                {items.map(p => (
                  <Cell key={p.id} highlight={p.rating === maxRating}>
                    <Stars rating={p.rating} />
                    <span style={{ display: "block", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {p.ratingCount.toLocaleString()} reviews
                    </span>
                    {p.rating === maxRating && items.length > 1 && (
                      <span style={{ display: "inline-block", marginTop: 4, background: "#fef9c3", border: "1px solid #fde047", borderRadius: 4, fontSize: 10, fontWeight: 800, color: "#854d0e", padding: "2px 7px", textTransform: "uppercase" }}>
                        Top Rated
                      </span>
                    )}
                  </Cell>
                ))}
              </tr>

              {/* ── Brand ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                <RowLabel>Brand</RowLabel>
                {items.map(p => <Cell key={p.id}><span style={{ fontWeight: 600 }}>{p.brand}</span></Cell>)}
              </tr>

              {/* ── SKU ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <RowLabel>SKU</RowLabel>
                {items.map(p => <Cell key={p.id}><span style={{ fontFamily: "monospace", fontSize: 12 }}>{p.sku}</span></Cell>)}
              </tr>

              {/* ── Stock ── */}
              <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#fafafa" }}>
                <RowLabel>Availability</RowLabel>
                {items.map(p => (
                  <Cell key={p.id}>
                    {p.inventory === 0 ? (
                      <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>Out of Stock</span>
                    ) : p.inventory < 20 ? (
                      <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>Low Stock ({p.inventory})</span>
                    ) : (
                      <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}>✓ In Stock</span>
                    )}
                  </Cell>
                ))}
              </tr>

              {/* ── Subcategory ── */}
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <RowLabel>Type</RowLabel>
                {items.map(p => <Cell key={p.id}>{p.subcategory || p.category}</Cell>)}
              </tr>

              {/* ── Specs ── */}
              {allSpecKeys.length > 0 && (
                <>
                  <tr>
                    <td colSpan={items.length + 1} style={{ padding: "10px 20px", background: "#0f172a" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f97316" }}>
                        Specifications
                      </span>
                    </td>
                  </tr>
                  {allSpecKeys.map((key, i) => (
                    <tr key={key} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <RowLabel>{key}</RowLabel>
                      {items.map(p => (
                        <Cell key={p.id}>
                          {p.specs?.[key] ?? <span style={{ color: "#d1d5db" }}>—</span>}
                        </Cell>
                      ))}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
