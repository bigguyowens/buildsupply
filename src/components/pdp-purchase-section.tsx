'use client';

import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuantitySelector } from "@/components/quantity-selector";
import type { Product } from "@/lib/products";

export function PdpPurchaseSection({ product, maxQuantity }: { product: Product; maxQuantity: number }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-4 rounded bg-gray-50 border p-4" style={{ borderColor: "var(--color-border)" }}>
      <div className="flex items-center gap-3">
        <QuantitySelector value={quantity} onChange={setQuantity} max={maxQuantity} />
        <span className="text-xs text-[var(--color-muted)]">/ {product.unit}</span>
      </div>
      <AddToCartButton
        product={product}
        quantity={quantity}
        className="w-full rounded py-3 text-sm font-bold text-white"
        style={{ background: "var(--color-accent)" } as React.CSSProperties}
      />
      {maxQuantity <= 10 && maxQuantity > 0 && (
        <p className="text-xs font-semibold text-yellow-700">⚠ Only {maxQuantity} units remaining</p>
      )}
      {maxQuantity === 0 && (
        <p className="text-xs font-semibold text-red-600">Out of Stock</p>
      )}
    </div>
  );
}
