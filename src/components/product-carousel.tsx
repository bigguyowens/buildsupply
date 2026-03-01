'use client';

import { useState, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { ProductImage } from "@/components/product-image";

const VISIBLE = 4;   // cards shown at once
const CARD_W  = 220; // px — approx card width incl. gap
const GAP     = 16;

function ProductCard({ product }: { product: Product }) {
  const price = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);
  return (
    <Link
      href={`/products/${product.slug}`}
      style={{
        flex: `0 0 ${CARD_W}px`,
        width: CARD_W,
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "white",
        textDecoration: "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s, transform 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 160, background: "#f8fafc", flexShrink: 0 }}>
        <ProductImage src={product.image} alt={product.name} fill sizes="220px" />
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 4px" }}>
          {product.brand}
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </p>

        {/* Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width="10" height="10" viewBox="0 0 24 24"
              fill={product.rating >= s ? "var(--color-accent)" : "none"}
              stroke="var(--color-accent)" strokeWidth={2}>
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ))}
          <span style={{ fontSize: 10, color: "#94a3b8" }}>({product.ratingCount})</span>
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-foreground)" }}>{price}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: product.inventory > 0 ? "#dcfce7" : "#fee2e2",
            color: product.inventory > 0 ? "#15803d" : "#dc2626" }}>
            {product.inventory > 0 ? "In Stock" : "Out"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ArrowBtn({ dir, onClick, disabled }: { dir: "left"|"right"; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid #e2e8f0",
        background: disabled ? "#f8fafc" : "white",
        cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.35 : 1,
        transition: "all 0.15s",
        flexShrink: 0,
        boxShadow: disabled ? "none" : "0 1px 4px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#374151" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d={dir === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}

export function ProductCarousel({
  title,
  products,
  emptyMessage = "Nothing to show yet.",
  accentBar = false,
}: {
  title: string;
  products: Product[];
  emptyMessage?: string;
  accentBar?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const maxIndex  = Math.max(0, products.length - VISIBLE);
  const canLeft   = index > 0;
  const canRight  = index < maxIndex;

  function slide(dir: "left"|"right") {
    const next = dir === "left"
      ? Math.max(0, index - 1)
      : Math.min(maxIndex, index + 1);
    setIndex(next);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${next * (CARD_W + GAP)}px)`;
    }
  }

  return (
    <section style={{ margin: "48px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {accentBar && (
            <div style={{ width: 4, height: 24, borderRadius: 2, background: "var(--color-accent)", flexShrink: 0 }} />
          )}
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--color-foreground)" }}>
            {title}
          </h2>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
            {products.length} item{products.length !== 1 ? "s" : ""}
          </span>
        </div>
        {products.length > VISIBLE && (
          <div style={{ display: "flex", gap: 6 }}>
            <ArrowBtn dir="left"  onClick={() => slide("left")}  disabled={!canLeft} />
            <ArrowBtn dir="right" onClick={() => slide("right")} disabled={!canRight} />
          </div>
        )}
      </div>

      {/* Track */}
      <div style={{ overflow: "hidden" }}>
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: GAP,
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>

      {/* Dots — only when there's more than one "page" */}
      {products.length > VISIBLE && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                if (trackRef.current) trackRef.current.style.transform = `translateX(-${i * (CARD_W + GAP)}px)`;
              }}
              style={{
                width: i === index ? 20 : 8, height: 8, borderRadius: 9999,
                border: "none", cursor: "pointer", padding: 0,
                background: i === index ? "var(--color-accent)" : "#e2e8f0",
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
