'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";

const TAX_RATE = 0.07;
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 29.99;

export function CartSummary() {
  const { items, itemCount, promo, setPromo } = useCart();
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const { subtotal, discount, shipping, tax, total } = useMemo(() => {
    const sub      = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const disc     = promo ? sub * (promo.discount_percent / 100) : 0;
    const discSub  = sub - disc;
    const shp      = discSub > 0 && discSub < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    return { subtotal: sub, discount: disc, shipping: shp, tax: discSub * TAX_RATE, total: discSub + shp + discSub * TAX_RATE };
  }, [items, promo]);

  async function applyCode() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    const res = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) { setPromo(data.promo); setCode(""); }
    else setError(data.error ?? "Invalid code.");
  }

  function removePromo() { setPromo(null); setError(""); setCode(""); }

  return (
    <div className="rounded bg-white border" style={{ borderColor: "var(--color-border)" }}>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase tracking-widest text-[var(--color-muted)] text-[10px]">Order Summary</span>
          <span className="text-[var(--color-muted)] text-xs">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </div>
      </div>

      {/* Promo code input */}
      <div className="px-5 pt-4 pb-2">
        {promo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "8px 12px" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: 0 }}>
                🎉 {promo.code} — {promo.discount_percent}% off
              </p>
              {promo.description && <p style={{ fontSize: 11, color: "#16a34a", margin: "2px 0 0" }}>{promo.description}</p>}
            </div>
            <button onClick={removePromo} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "0 0 0 8px", lineHeight: 1 }}>✕</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", marginBottom: 6 }}>Promo Code</p>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={e => e.key === "Enter" && applyCode()}
                placeholder="Enter code"
                style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.05em", outline: "none" }}
              />
              <button
                onClick={applyCode}
                disabled={loading || !code.trim()}
                style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: code.trim() ? "var(--color-accent)" : "#e2e8f0", color: code.trim() ? "white" : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: code.trim() ? "pointer" : "default", transition: "all 0.15s", whiteSpace: "nowrap" }}
              >
                {loading ? "…" : "Apply"}
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: "#ef4444", margin: "5px 0 0", fontWeight: 600 }}>{error}</p>}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-muted)]"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        {discount > 0 && (
          <div className="flex justify-between" style={{ color: "#16a34a", fontWeight: 700 }}>
            <span>Discount ({promo?.discount_percent}%)</span>
            <span>−{fmt(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-muted)]"><span>Shipping</span><span>{shipping === 0 ? "Free" : fmt(shipping)}</span></div>
        {shipping > 0 && <p className="text-[10px] text-[var(--color-muted)]">Free shipping on orders $500+</p>}
        <div className="flex justify-between text-[var(--color-muted)]"><span>Tax (7%)</span><span>{fmt(tax)}</span></div>
        <div className="flex justify-between font-bold text-[var(--color-foreground)] border-t pt-2" style={{ borderColor: "var(--color-border)" }}>
          <span>Estimated Total</span><span>{fmt(total)}</span>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-2">
        <Link
          href="/checkout"
          className="block w-full rounded py-3 text-center text-sm font-bold text-white"
          style={{ background: items.length > 0 ? "var(--color-accent)" : "var(--color-muted)", pointerEvents: items.length === 0 ? "none" : "auto" } as React.CSSProperties}
        >
          Proceed to Checkout
        </Link>
        <Link href="/products" className="block text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)]">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
