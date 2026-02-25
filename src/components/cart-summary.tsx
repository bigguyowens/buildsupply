'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/context/cart-context";

const TAX_RATE = 0.07;
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 29.99;

export function CartSummary() {
  const { items, itemCount } = useCart();
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const { subtotal, shipping, tax, total } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shp = sub > 0 && sub < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    return { subtotal: sub, shipping: shp, tax: sub * TAX_RATE, total: sub + shp + sub * TAX_RATE };
  }, [items]);

  return (
    <div className="rounded bg-white border" style={{ borderColor: "var(--color-border)" }}>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex justify-between text-sm">
          <span className="font-bold uppercase tracking-widest text-[var(--color-muted)] text-[10px]">Order Summary</span>
          <span className="text-[var(--color-muted)] text-xs">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        </div>
      </div>
      <div className="px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-[var(--color-muted)]"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
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
