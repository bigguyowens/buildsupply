'use client';

import { useState } from "react";
import type { Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

type AddToCartButtonProps = {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
  quantity?: number;
};

export function AddToCartButton({
  product,
  className,
  style,
  quantity = 1,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<"idle" | "added">("idle");

  const isOutOfStock = product.inventory === 0;

  return (
    <button
      type="button"
      disabled={isOutOfStock}
      className={`cursor-pointer ${className ?? ""}`.trim()}
      style={{
        background: isOutOfStock ? "#9ca3af" : "var(--color-accent)",
        color: "#fff",
        ...style,
      }}
      onClick={() => {
        if (isOutOfStock) return;
        addItem(product, quantity);
        setStatus("added");
        setTimeout(() => setStatus("idle"), 2000);
      }}
    >
      {isOutOfStock ? "Out of Stock" : status === "added" ? "✓ Added!" : "Add to Cart"}
    </button>
  );
}
