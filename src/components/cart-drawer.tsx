"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { ProductImage } from "@/components/product-image";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function CartDrawer() {
  const { items, drawerOpen, closeDrawer, lastAdded, removeItem, promo } = useCart();

  const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount  = promo ? subtotal * (promo.discount_percent / 100) : 0;
  const discSub   = subtotal - discount;
  const shipping  = discSub > 0 && discSub < 500 ? 29.99 : 0;
  const itemCount = items.reduce((t, i) => t + i.quantity, 0);

  // Pause auto-close on hover
  const { openDrawer } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeDrawer(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 1100, opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onMouseEnter={openDrawer}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 420, maxWidth: "100vw",
          background: "#fff",
          zIndex: 1101,
          display: "flex", flexDirection: "column",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#0f172a" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Your Cart</span>
            {itemCount > 0 && (
              <span style={{ background: "#f97316", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeDrawer} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, borderRadius: 6, fontSize: 20, lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Last added item highlight */}
          {lastAdded && (
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 14px", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Added to Cart
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: "1px solid #fdba74", flexShrink: 0, position: "relative", background: "#fff" }}>
                  <ProductImage src={lastAdded.image ?? ""} alt={lastAdded.name} fill sizes="56px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastAdded.name}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>Qty: {lastAdded.quantity} · SKU: {lastAdded.sku}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#f97316", margin: 0 }}>{fmt(lastAdded.price)}</p>
                </div>
              </div>
            </div>
          )}

          {/* All cart items */}
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Your cart is empty</p>
              <p style={{ fontSize: 13 }}>Add items to get started</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 10px" }}>
                All Items ({items.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0, position: "relative", background: "#f8fafc" }}>
                      <ProductImage src={item.image ?? ""} alt={item.name} fill sizes="48px" style={{ objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Qty: {item.quantity} · {fmt(item.price * item.quantity)}</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 4, fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer — summary + CTA */}
        {items.length > 0 && (
          <div style={{ flexShrink: 0, borderTop: "1px solid #e2e8f0", padding: "16px 20px", background: "#f8fafc" }}>
            {/* Promo */}
            {promo && discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 6 }}>
                <span>Promo ({promo.code})</span>
                <span>−{fmt(discount)}</span>
              </div>
            )}
            {/* Shipping note */}
            {shipping > 0 ? (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 10px" }}>
                🚚 Add <strong>{fmt(500 - discSub)}</strong> more for free shipping
              </div>
            ) : discSub > 0 ? (
              <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginBottom: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "7px 10px" }}>
                🎉 You qualify for free shipping!
              </div>
            ) : null}

            {/* Subtotal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subtotal</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Shipping & tax calculated at checkout</p>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{fmt(discSub)}</span>
            </div>

            {/* CTAs */}
            <Link
              href="/checkout"
              onClick={closeDrawer}
              style={{ display: "block", width: "100%", textAlign: "center", padding: "13px 0", background: "#f97316", color: "white", borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 8, boxSizing: "border-box" }}
            >
              Checkout →
            </Link>
            <Link
              href="/cart"
              onClick={closeDrawer}
              style={{ display: "block", width: "100%", textAlign: "center", padding: "10px 0", background: "transparent", color: "#64748b", borderRadius: 8, fontWeight: 600, fontSize: 13, textDecoration: "none", border: "1px solid #e2e8f0", boxSizing: "border-box" }}
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
