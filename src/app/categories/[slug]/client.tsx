'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductListItem } from "@/components/product-list-item";
import type { Product } from "@/lib/products";
import type { Category } from "@/lib/products";

type Props = {
  category: Category;
  products: Product[];
  subcategories: string[];
  slug: string;
  activeSub: string | undefined;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured",   label: "Best Match" },
  { value: "rating",     label: "Top Rated" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name",       label: "Name A–Z" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2}
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
    </svg>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151" }}>
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

export function CategoryPageClient({ category, products, subcategories, slug, activeSub }: Props) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [sort, setSort] = useState<SortKey>("featured");
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);

  // Derive filter options from products
  const brands = useMemo(() => {
    const b = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(b).sort();
  }, [products]);

  const maxPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => p.price), 0)), [products]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedBrands.size > 0) list = list.filter(p => selectedBrands.has(p.brand));
    if (minRating > 0)           list = list.filter(p => p.rating >= minRating);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sort) {
      case "price-asc":  list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating":     list.sort((a, b) => b.rating - a.rating); break;
      case "name":       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }
    return list;
  }, [products, selectedBrands, minRating, priceRange, sort]);

  const hasFilters = selectedBrands.size > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice;

  function toggleBrand(brand: string) {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  }

  function clearFilters() {
    setSelectedBrands(new Set());
    setMinRating(0);
    setPriceRange([0, 99999]);
  }

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

      {/* ── Filter Sidebar ── */}
      <aside className="category-sub-sidebar" style={{ width: 220, flexShrink: 0, background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", position: "sticky", top: 80 }}>

        {/* Sidebar header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Filter</span>
          {hasFilters && (
            <button onClick={clearFilters} style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Clear All
            </button>
          )}
        </div>

        {/* Subcategory filter */}
        {subcategories.length > 0 && (
          <FilterSection title="Category">
            <Link href={`/categories/${slug}`} style={{ display: "block", padding: "5px 0", fontSize: 13, fontWeight: activeSub ? 400 : 700, color: activeSub ? "#64748b" : "var(--color-accent)", textDecoration: "none" }}>
              All ({products.length})
            </Link>
            {subcategories.map(sub => {
              const subSlug = sub.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
              const isActive = activeSub === subSlug;
              const count = products.filter(p => p.subcategory?.toLowerCase() === sub.toLowerCase()).length;
              return (
                <Link key={sub} href={`/categories/${slug}?sub=${subSlug}`} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--color-accent)" : "#374151", textDecoration: "none" }}>
                  <span>{sub}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>({count})</span>
                </Link>
              );
            })}
          </FilterSection>
        )}

        {/* Brand filter */}
        {brands.length > 1 && (
          <FilterSection title="Brand">
            {brands.map(brand => (
              <label key={brand} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand)}
                  onChange={() => toggleBrand(brand)}
                  style={{ accentColor: "var(--color-accent)", width: 14, height: 14 }}
                />
                {brand}
              </label>
            ))}
          </FilterSection>
        )}

        {/* Rating filter */}
        <FilterSection title="Customer Rating">
          {[4, 3, 2, 1].map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13, color: minRating === r ? "var(--color-accent)" : "#374151", fontWeight: minRating === r ? 700 : 400 }}>
              <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} style={{ accentColor: "var(--color-accent)" }} />
              {"★".repeat(r)}{"☆".repeat(5 - r)} & Up
            </label>
          ))}
        </FilterSection>

        {/* Price filter */}
        {maxPrice > 0 && (
          <FilterSection title="Price">
            {[
              [0, 50],
              [50, 100],
              [100, 250],
              [250, 500],
              [500, 99999],
            ].map(([min, max]) => {
              const label = max === 99999 ? `$${min}+` : `$${min} – $${max}`;
              const active = priceRange[0] === min && priceRange[1] === max;
              return (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13, color: active ? "var(--color-accent)" : "#374151", fontWeight: active ? 700 : 400 }}>
                  <input type="radio" name="price" checked={active} onChange={() => setPriceRange(active ? [0, 99999] : [min, max])} style={{ accentColor: "var(--color-accent)" }} />
                  {label}
                </label>
              );
            })}
          </FilterSection>
        )}

      </aside>

      {/* ── Results area ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Sort + view toggle bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#64748b", marginRight: 4 }}>
            <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> results
            {hasFilters && <span style={{ color: "var(--color-accent)", marginLeft: 6, fontSize: 12 }}>· Filtered</span>}
          </span>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>Sort by:</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{ fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", background: "white", color: "#0f172a", cursor: "pointer" }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Grid/List toggle */}
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            {(["list", "grid"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} title={v === "list" ? "List view" : "Grid view"} style={{ padding: "6px 10px", background: view === v ? "#f1f5f9" : "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: view === v ? "var(--color-accent)" : "#94a3b8" }}>
                {v === "list" ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "64px 24px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 0 12px" }}>No products match your filters.</p>
            <button onClick={clearFilters} style={{ background: "var(--color-accent)", color: "white", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Clear Filters
            </button>
          </div>
        ) : view === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(product => <ProductListItem key={product.id} product={product} />)}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {filtered.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
