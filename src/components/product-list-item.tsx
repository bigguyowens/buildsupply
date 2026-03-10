'use client';

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuantitySelector } from "@/components/quantity-selector";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/products";

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[1,2,3,4,5].map((star) => (
          <svg key={star} width="13" height="13" viewBox="0 0 24 24"
            fill={rating >= star ? "var(--color-accent)" : "none"}
            stroke="var(--color-accent)" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 11, color: "#64748b" }}>({count.toLocaleString()})</span>
    </div>
  );
}

type ListItemProps = { product: Product; compareItems?: Set<string>; onToggleCompare?: (id: string) => void; };

export function ProductListItem({ product, compareItems, onToggleCompare }: ListItemProps) {
  const priceLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);
  const [quantity, setQuantity] = useState(1);
  const isComparing = compareItems?.has(product.id) ?? false;

  return (
    <article
      style={{ display: "flex", background: "white", borderRadius: 8, border: `1px solid ${isComparing ? "#f97316" : "#e2e8f0"}`, overflow: "hidden", transition: "box-shadow 0.15s", boxShadow: isComparing ? "0 0 0 2px rgba(249,115,22,0.2)" : undefined }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} style={{ position: "relative", flexShrink: 0, width: 180, minHeight: 160, background: "#f8fafc", display: "block" }}>
        <ProductImage src={product.image} alt={product.name} fill sizes="180px" priority={product.featured} style={{ objectFit: "contain" }} />
        {product.featured && (
          <span style={{ position: "absolute", top: 8, left: 8, background: "var(--color-accent)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase" }}>
            Featured
          </span>
        )}
      </Link>

      {/* Main content */}
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", gap: 20, minWidth: 0 }}>

        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 4px" }}>
            {product.brand} &nbsp;·&nbsp; {product.subcategory || product.category}
          </p>
          <Link href={`/products/${product.slug}`} style={{ textDecoration: "none" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.4 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#0f172a"}
            >
              {product.name}
            </h3>
          </Link>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 8px" }}>Model# {product.sku}</p>
          <StarRating rating={product.rating} count={product.ratingCount} />
          {product.description && (
            <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {product.description}
            </p>
          )}
          {product.inventory === 0 && (
            <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, margin: "8px 0 0" }}>Out of Stock</p>
          )}
          {product.inventory > 0 && product.inventory < 20 && (
            <p style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, margin: "8px 0 0" }}>Only {product.inventory} left</p>
          )}
          {product.inventory >= 20 && (
            <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, margin: "8px 0 0" }}>✓ In Stock</p>
          )}
        </div>

        {/* Right: price + cart */}
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", minWidth: 180 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>{priceLabel}</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>/ {product.unit}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <WishlistButton productId={product.id} size="sm" />
              {onToggleCompare && (
                <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, fontWeight: 600, color: isComparing ? "#f97316" : "#64748b", userSelect: "none", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={isComparing} onChange={() => onToggleCompare(product.id)} style={{ accentColor: "#f97316", width: 13, height: 13, cursor: "pointer" }} />
                  Compare
                </label>
              )}
              <QuantitySelector value={quantity} onChange={setQuantity} size="sm" max={product.inventory} />
            </div>
            <AddToCartButton
              product={product}
              quantity={quantity}
              style={{ background: "var(--color-accent)", color: "white", border: "none", borderRadius: 6, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" } as React.CSSProperties}
            />
          </div>
        </div>

      </div>
    </article>
  );
}
