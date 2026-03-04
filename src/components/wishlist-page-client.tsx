'use client';

import { useState, useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { createWishlistAction, deleteWishlistAction, removeFromWishlistAction } from "@/app/actions/wishlist";
import type { Product } from "@/lib/products";

type WishlistItem = {
  wishlist_item_id: number;
  product_id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  brand: string;
  sku: string;
  unit: string;
  inventory: number;
};

type WishlistWithItems = {
  id: number;
  name: string;
  items: WishlistItem[];
};

const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

function CreateListForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(createWishlistAction, {});
  if (state?.success) onCreated();
  return (
    <form action={formAction} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      <input
        name="name"
        required
        placeholder='e.g. "Job Site A" or "Office Supplies"'
        style={{
          flex: 1, padding: "9px 14px", borderRadius: 6, fontSize: 14,
          border: "1px solid var(--color-border)", outline: "none", maxWidth: 360,
        }}
      />
      <button
        type="submit" disabled={pending}
        style={{
          padding: "9px 20px", borderRadius: 6, border: "none",
          background: "var(--color-accent)", color: "white",
          fontWeight: 700, fontSize: 14, cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "Creating..." : "+ New List"}
      </button>
      {state?.error && <p style={{ color: "#dc2626", fontSize: 13, alignSelf: "center" }}>{state.error}</p>}
    </form>
  );
}

function WishlistCard({ list, onUpdate }: { list: WishlistWithItems; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { addItem } = useCart();

  async function handleRemove(productId: string) {
    setRemoving(productId);
    await removeFromWishlistAction(list.id, productId);
    onUpdate();
    setRemoving(null);
  }

  async function handleDeleteList() {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteWishlistAction(list.id);
    onUpdate();
  }

  function handleAddToCart(item: WishlistItem) {
    const product = {
      id: item.product_id,
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      currency: item.currency,
      brand: item.brand,
      sku: item.sku,
      unit: item.unit,
      inventory: item.inventory,
      description: "", category: "", subcategory: "",
      tags: [], gallery: [], rating: 0, ratingCount: 0, featured: false, specs: null,
    } as Product;
    addItem(product, 1);
  }

  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
      {/* List header */}
      <div style={{ padding: "14px 20px", borderBottom: expanded ? "1px solid var(--color-border)" : "none", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 8, flex: 1, textAlign: "left" }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2}
            style={{ transition: "transform 0.2s", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", color: "var(--color-muted)", flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{list.name}</span>
          <span style={{ fontSize: 12, color: "var(--color-muted)", background: "#f3f4f6", borderRadius: 9999, padding: "1px 8px" }}>
            {list.items.length} item{list.items.length !== 1 ? "s" : ""}
          </span>
        </button>
        <button
          onClick={handleDeleteList}
          disabled={deleting}
          title="Delete list"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, fontSize: 13 }}
        >
          🗑
        </button>
      </div>

      {/* Items */}
      {expanded && (
        list.items.length === 0 ? (
          <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--color-muted)", fontSize: 14 }}>
            No items yet — browse products and hit the ♡ to save here.
          </div>
        ) : (
          <div>
            {list.items.map((item, i) => (
              <div key={item.wishlist_item_id} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                borderBottom: i < list.items.length - 1 ? "1px solid var(--color-border)" : "none",
              }}>
                {/* Image */}
                <Link href={`/products/${item.slug}`}>
                  <div style={{ position: "relative", width: 64, height: 64, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                    <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="64px" />
                  </div>
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/products/${item.slug}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--color-foreground)", textDecoration: "none" }}>
                    {item.name}
                  </Link>
                  <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{item.brand} · SKU: {item.sku}</p>
                  <p style={{ fontWeight: 700, fontSize: 15, margin: "4px 0 0" }}>{fmt(item.price, item.currency)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-muted)" }}>/ {item.unit}</span></p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleAddToCart(item)}
                    style={{
                      padding: "7px 14px", borderRadius: 6, border: "none",
                      background: "var(--color-accent)", color: "white",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    disabled={removing === item.product_id}
                    style={{
                      padding: "7px 10px", borderRadius: 6,
                      border: "1px solid #e5e7eb", background: "white",
                      color: "#9ca3af", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    {removing === item.product_id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            ))}

            {/* Add all to cart */}
            {list.items.length > 1 && (
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-border)", background: "#fafafa", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => list.items.forEach(i => handleAddToCart(i))}
                  style={{
                    padding: "8px 18px", borderRadius: 6, border: "none",
                    background: "var(--color-foreground)", color: "white",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Add All to Cart ({list.items.length} items)
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

export function WishlistPageClient({ lists: initialLists }: { lists: WishlistWithItems[] }) {
  const [lists, setLists] = useState(initialLists);
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CreateListForm onCreated={refresh} />

      {lists.length === 0 ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "64px 24px", textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5} style={{ margin: "0 auto 16px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No wishlists yet</p>
          <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 20 }}>Create a list above, then save products from any product page.</p>
          <Link href="/products" style={{ padding: "9px 20px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Browse Products
          </Link>
        </div>
      ) : (
        lists.map(list => (
          <WishlistCard key={list.id} list={list} onUpdate={refresh} />
        ))
      )}
    </div>
  );
}
