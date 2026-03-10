'use client';

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductListItem } from "@/components/product-list-item";
import { CompareBar } from "@/components/compare-bar";
import { CompareModal } from "@/components/compare-modal";
import type { Product, Category } from "@/lib/products";
import Link from "next/link";

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

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #e2e8f0" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
        {title}
        <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2.5}
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, color: "#94a3b8" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

export function CategoryPageClient({ category, products, subcategories, slug, activeSub }: Props) {
  const [view, setView]           = useState<"grid" | "list">("grid");
  const [sort, setSort]           = useState<SortKey>("featured");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const MAX_COMPARE = 4;
  const compareProducts = useMemo(() => products.filter(p => compareIds.has(p.id)), [products, compareIds]);

  function toggleCompare(id: string) {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  }

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort(), [products]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => p.price), 0)), [products]);

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
  const filterCount = selectedBrands.size + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

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

  const PRICE_BUCKETS: [number, number, string][] = [
    [0,   50,    "Under $50"],
    [50,  100,   "$50 – $100"],
    [100, 250,   "$100 – $250"],
    [250, 500,   "$250 – $500"],
    [500, 99999, "$500+"],
  ];

  return (
    <div>
      {/* ── Sort / Filter / Toggle Bar ─────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 16px", flexWrap: "wrap" }}>

        {/* Filter button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: hasFilters ? "#fff7ed" : "white", color: hasFilters ? "var(--color-accent)" : "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filter
          {filterCount > 0 && (
            <span style={{ background: "var(--color-accent)", color: "white", borderRadius: 9999, fontSize: 11, fontWeight: 800, padding: "1px 6px" }}>
              {filterCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "#e2e8f0" }} />

        {/* Result count */}
        <span style={{ fontSize: 13, color: "#64748b" }}>
          <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> results
          {hasFilters && (
            <button onClick={clearFilters} style={{ marginLeft: 10, fontSize: 12, color: "var(--color-accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              Clear filters
            </button>
          )}
        </span>

        {/* Sort — pushed right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>Sort by:</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            style={{ fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 10px", background: "white", color: "#0f172a", cursor: "pointer" }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Grid/List toggle */}
        <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} title={v} style={{ padding: "6px 10px", background: view === v ? "#f1f5f9" : "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: view === v ? "var(--color-accent)" : "#94a3b8" }}>
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

      {/* ── Products ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "80px 24px", textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 0 14px" }}>No products match your filters.</p>
          <button onClick={clearFilters} style={{ background: "var(--color-accent)", color: "white", border: "none", borderRadius: 6, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Clear Filters
          </button>
        </div>
      ) : view === "list" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => <ProductListItem key={p.id} product={p} compareItems={compareIds} onToggleCompare={toggleCompare} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(4, 1fr)" }}>
          {filtered.map(p => <ProductCard key={p.id} product={p} compareItems={compareIds} onToggleCompare={toggleCompare} />)}
        </div>
      )}

      {/* ── Compare Bar + Modal ── */}
      <CompareBar
        items={compareProducts}
        onRemove={id => toggleCompare(id)}
        onClear={() => setCompareIds(new Set())}
        onCompare={() => setShowCompare(true)}
      />
      {showCompare && compareProducts.length >= 2 && (
        <CompareModal
          items={compareProducts}
          onClose={() => setShowCompare(false)}
          onRemove={id => { toggleCompare(id); if (compareProducts.length <= 2) setShowCompare(false); }}
        />
      )}

      {/* ── Filter Drawer ──────────────────────────────────── */}
      {/* Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, transition: "opacity 0.2s" }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 320, maxWidth: "90vw",
        background: "white", zIndex: 201, boxShadow: "4px 0 32px rgba(0,0,0,0.15)",
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Filter</span>
            {filterCount > 0 && (
              <span style={{ background: "var(--color-accent)", color: "white", borderRadius: 9999, fontSize: 11, fontWeight: 800, padding: "2px 8px" }}>
                {filterCount} active
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {hasFilters && (
              <button onClick={clearFilters} style={{ fontSize: 12, color: "var(--color-accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                Clear All
              </button>
            )}
            <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", padding: 4 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <FilterSection title="Category">
              <Link href={`/categories/${slug}`} onClick={() => setDrawerOpen(false)} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, fontWeight: !activeSub ? 700 : 400, color: !activeSub ? "var(--color-accent)" : "#374151", textDecoration: "none" }}>
                <span>All</span>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>({products.length})</span>
              </Link>
              {subcategories.map(sub => {
                const subSlug = sub.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                const isActive = activeSub === subSlug;
                const count = products.filter(p => p.subcategory?.toLowerCase() === sub.toLowerCase()).length;
                return (
                  <Link key={sub} href={`/categories/${slug}?sub=${subSlug}`} onClick={() => setDrawerOpen(false)} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, fontWeight: isActive ? 700 : 400, color: isActive ? "var(--color-accent)" : "#374151", textDecoration: "none" }}>
                    <span>{sub}</span>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>({count})</span>
                  </Link>
                );
              })}
            </FilterSection>
          )}

          {/* Brand */}
          {brands.length > 1 && (
            <FilterSection title="Brand">
              {brands.map(brand => (
                <label key={brand} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", fontSize: 14, color: selectedBrands.has(brand) ? "var(--color-accent)" : "#374151", fontWeight: selectedBrands.has(brand) ? 700 : 400 }}>
                  <input type="checkbox" checked={selectedBrands.has(brand)} onChange={() => toggleBrand(brand)} style={{ accentColor: "var(--color-accent)", width: 15, height: 15 }} />
                  {brand}
                </label>
              ))}
            </FilterSection>
          )}

          {/* Rating */}
          <FilterSection title="Customer Rating">
            {[4, 3, 2, 1].map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", fontSize: 14, color: minRating === r ? "var(--color-accent)" : "#374151", fontWeight: minRating === r ? 700 : 400 }}>
                <input type="radio" name="rating" checked={minRating === r} onChange={() => setMinRating(minRating === r ? 0 : r)} style={{ accentColor: "var(--color-accent)" }} />
                {"★".repeat(r)}{"☆".repeat(5 - r)} & Up
              </label>
            ))}
          </FilterSection>

          {/* Price */}
          <FilterSection title="Price">
            {PRICE_BUCKETS.map(([min, max, label]) => {
              const active = priceRange[0] === min && priceRange[1] === max;
              return (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", fontSize: 14, color: active ? "var(--color-accent)" : "#374151", fontWeight: active ? 700 : 400 }}>
                  <input type="radio" name="price" checked={active} onChange={() => setPriceRange(active ? [0, 99999] : [min, max])} style={{ accentColor: "var(--color-accent)" }} />
                  {label}
                </label>
              );
            })}
          </FilterSection>

        </div>

        {/* Drawer footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ width: "100%", background: "var(--color-accent)", color: "white", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
          >
            Show {filtered.length} Results
          </button>
        </div>
      </div>
    </div>
  );
}
