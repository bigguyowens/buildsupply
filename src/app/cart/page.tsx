'use client';

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { CartSummary } from "@/components/cart-summary";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, updateItemQuantity, removeItem } = useCart();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Page header */}
      <div className="bg-white border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Checkout</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Your Cart</h1>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 grid gap-6 cart-layout lg:grid-cols-[1fr_360px]">
        {/* Cart items */}
        <section>
          {items.length === 0 ? (
            <div className="rounded bg-white border p-12 text-center" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-[var(--color-muted)] mb-4">Your cart is empty.</p>
              <Link
                href="/products"
                className="rounded px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "var(--color-accent)" }}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="rounded bg-white border divide-y" style={{ borderColor: "var(--color-border)" }}>
              {items.map((item) => (
                <div key={item.id} className="cart-item flex gap-4 p-4">
                  <div className="cart-item-thumb relative h-24 w-24 flex-shrink-0 overflow-hidden rounded border" style={{ borderColor: "var(--color-border)" }}>
                    <ProductImage src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">{item.category}</p>
                        <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-[var(--color-foreground)] hover:text-[var(--color-accent)] line-clamp-2">
                          {item.name}
                        </Link>
                        <p className="text-xs text-[var(--color-muted)]">{item.brand} · {item.sku}</p>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-foreground)] whitespace-nowrap">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency }).format(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <QuantitySelector value={item.quantity} onChange={(v) => updateItemQuantity(item.id, v)} max={item.inventory} size="sm" />
                      <span className="text-xs text-[var(--color-muted)]">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency }).format(item.price)} / {item.unit}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12, fontWeight: 600, padding: "4px 6px", borderRadius: 4, transition: "color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#94a3b8"}
                      >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <CartSummary />
        </div>
      </main>
    </div>
  );
}
