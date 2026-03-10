'use client';

import { ProductImage } from "./product-image";
import type { Product } from "@/lib/products";

type Props = {
  items: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
};

const MAX = 4;

export function CompareBar({ items, onRemove, onClear, onCompare }: Props) {
  if (items.length === 0) return null;

  const canCompare = items.length >= 2;

  // Fill empty slots so layout stays stable
  const slots = [...items, ...Array(MAX - items.length).fill(null)] as (Product | null)[];

  return (
    <>
      <style>{`
        @keyframes compareSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
        background: "#0f172a", borderTop: "3px solid #f97316",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.35)",
        animation: "compareSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
        padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        {/* Label */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ color: "white", fontSize: 13, fontWeight: 800, margin: 0 }}>Compare</p>
          <p style={{ color: "#94a3b8", fontSize: 11, margin: "2px 0 0" }}>
            {items.length} of {MAX} selected
          </p>
        </div>

        <div style={{ width: 1, height: 48, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />

        {/* Product slots */}
        <div style={{ display: "flex", gap: 10, flex: 1, alignItems: "center" }}>
          {slots.map((item, i) => (
            item ? (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.07)", borderRadius: 8,
                padding: "6px 10px", border: "1px solid rgba(249,115,22,0.3)",
                minWidth: 0, flex: "0 0 auto", maxWidth: 200,
              }}>
                <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#1e293b" }}>
                  <ProductImage src={item.image} alt={item.name} fill style={{ objectFit: "contain" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                  {item.name}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  title="Remove"
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0, padding: "0 2px" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div key={`empty-${i}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.03)", borderRadius: 8,
                padding: "6px 16px", border: "1px dashed rgba(255,255,255,0.12)",
                flex: "0 0 auto", height: 52, minWidth: 120,
              }}>
                <span style={{ fontSize: 12, color: "#475569" }}>+ Add product</span>
              </div>
            )
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <button
            onClick={onClear}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#94a3b8", cursor: "pointer" }}
          >
            Clear
          </button>
          <button
            onClick={onCompare}
            disabled={!canCompare}
            title={!canCompare ? "Select at least 2 products to compare" : ""}
            style={{
              background: canCompare ? "#f97316" : "#334155",
              border: "none", borderRadius: 7, padding: "9px 22px",
              fontSize: 13, fontWeight: 800, color: canCompare ? "white" : "#64748b",
              cursor: canCompare ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            Compare ({items.length})
          </button>
        </div>
      </div>
    </>
  );
}
