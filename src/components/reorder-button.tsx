'use client';

import { useCart, type CartItem } from "@/context/cart-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/products";

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; brand: string; sku: string; slug: string };

export function ReorderButton({ items }: { items: OrderItem[] }) {
  const { mergeItems } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);

  function handleReorder() {
    // Convert order items back to CartItem shape
    const cartItems: CartItem[] = items.map(i => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      description: "",
      price: i.price,
      currency: "USD",
      category: "",
      subcategory: "",
      tags: [],
      image: i.image,
      gallery: [],
      rating: 0,
      ratingCount: 0,
      inventory: 999,
      featured: false,
      brand: i.brand,
      sku: i.sku,
      unit: "",
      specs: null,
      quantity: i.quantity,
    } as CartItem & Product));

    mergeItems(cartItems);
    setDone(true);
    setTimeout(() => router.push("/cart"), 600);
  }

  return (
    <button
      onClick={handleReorder}
      disabled={done}
      style={{
        padding: "8px 20px", borderRadius: 6, border: "none",
        background: done ? "#dcfce7" : "rgba(255,255,255,0.15)",
        color: done ? "#15803d" : "white",
        fontWeight: 700, fontSize: 13, cursor: done ? "default" : "pointer",
        transition: "all 0.2s",
      }}
    >
      {done ? "✓ Added to Cart!" : "🔁 Re-order"}
    </button>
  );
}
