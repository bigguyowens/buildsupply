'use client';
import { useState } from "react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ProductCard } from "@/components/product-card";
import { filterProductsByParams, PRICE_OPTIONS } from "@/lib/filter-options";
import type { Product } from "@/lib/products";

type Props = {
  products: Product[];
  categories: string[];
  selectedCategory?: string;
  selectedPrice?: string;
  heading: string;
  initialParams: Record<string, string>;
};

export function ProductsClient({ products, categories, selectedCategory, selectedPrice, heading, initialParams }: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filtered = filterProductsByParams(products, selectedCategory, selectedPrice);

  return (
    <>
      {/* Mobile filter bar */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <p style={{ fontSize: 13, color: "var(--color-muted)" }}>{filtered.length} products</p>
        <button
          onClick={() => setFilterOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 6, border: "1px solid var(--color-border)",
            background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            color: "var(--color-foreground)",
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M10 12h4" />
          </svg>
          Filter
          {(selectedCategory || selectedPrice) && (
            <span style={{ background: "var(--color-accent)", color: "white", borderRadius: 9999, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
              {[selectedCategory, selectedPrice].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter drawer overlay (mobile) */}
      {filterOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.4)" }}
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Filter drawer (mobile) */}
      <div style={{
        position: "fixed", top: 0, left: filterOpen ? 0 : "-300px", bottom: 0,
        width: 280, zIndex: 200, background: "white", overflowY: "auto",
        transition: "left 0.25s ease", boxShadow: filterOpen ? "4px 0 24px rgba(0,0,0,0.2)" : "none",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Filters</span>
          <button onClick={() => setFilterOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--color-muted)" }}>✕</button>
        </div>
        <div style={{ padding: 4 }}>
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedPrice={selectedPrice}
            basePath="/products"
            initialParams={initialParams}
            onNavigate={() => setFilterOpen(false)}
          />
        </div>
      </div>

      <div className="products-layout grid gap-6" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="filter-sidebar-desktop hidden md:block">
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedPrice={selectedPrice}
            basePath="/products"
            initialParams={initialParams}
          />
        </div>
        <div>
          {filtered.length === 0 ? (
            <div className="rounded bg-white border border-[var(--color-border)] p-12 text-center text-[var(--color-muted)]">
              No products match the selected filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
