'use client';

import { useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { QuantitySelector } from "@/components/quantity-selector";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((star) => (
        <svg key={star} className="h-3.5 w-3.5" fill={rating >= star ? "var(--color-accent)" : "none"} stroke="var(--color-accent)" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const priceLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="flex flex-col rounded bg-white border border-[var(--color-border)] hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-t bg-gray-50">
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-103"
          sizes="(min-width: 1024px) 25vw, 50vw"
          priority={product.featured}
        />
        {product.featured && (
          <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: "var(--color-accent)" }}>
            Featured
          </span>
        )}
        {product.inventory < 20 && product.inventory > 0 && (
          <span className="absolute right-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-500 text-white">
            Low Stock
          </span>
        )}
        {/* Wishlist heart */}
        <div className="absolute bottom-2 right-2" onClick={e => e.preventDefault()}>
          <WishlistButton productId={product.id} size="sm" />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">{product.subcategory || product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] leading-snug hover:text-[var(--color-accent)] line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-[var(--color-muted)] mb-1">{product.brand} &nbsp;·&nbsp; {product.sku}</p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={product.rating} />
          <span className="text-xs text-[var(--color-muted)]">({product.ratingCount.toLocaleString()})</span>
        </div>

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-[var(--color-foreground)]">{priceLabel}</span>
            <span className="text-xs text-[var(--color-muted)]">/ {product.unit}</span>
          </div>

          {/* Add to cart */}
          <div className="flex gap-2">
            <QuantitySelector value={quantity} onChange={setQuantity} size="sm" max={product.inventory} />
            <AddToCartButton
              product={product}
              quantity={quantity}
              className="flex-1 rounded px-3 py-2 text-sm font-bold text-white hover:opacity-90"
              style={{ background: "var(--color-accent)" } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
