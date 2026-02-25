'use client';

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

type QuickResult = {
  type: "product" | "category";
  id: string;
  name: string;
  slug: string;
  image?: string;
  meta?: string; // category name for products, "Category" for categories
};

export function HeaderSearch() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<QuickResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fetchQuickResults(q: string) {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query Quick($term: String!) {
            searchProducts(term: $term) { id name slug image category }
            searchCategories(term: $term) { id name slug image }
          }`,
          variables: { term: q },
        }),
      });
      const json = await res.json();
      const products = (json.data?.searchProducts ?? []).slice(0, 5).map((p: { id: string; name: string; slug: string; image: string; category: string }) => ({
        type: "product" as const, id: p.id, name: p.name, slug: `/products/${p.slug}`, image: p.image, meta: p.category,
      }));
      const cats = (json.data?.searchCategories ?? []).slice(0, 3).map((c: { id: string; name: string; slug: string; image: string }) => ({
        type: "category" as const, id: c.id, name: c.name, slug: `/categories/${c.slug}`, image: c.image, meta: "Category",
      }));
      setResults([...cats, ...products]);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(val: string) {
    setTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchQuickResults(val.trim()), 250);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
    const q = term.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1, maxWidth: 560 }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{
          display: "flex", flex: 1, alignItems: "center",
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6, overflow: "hidden",
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ marginLeft: 12, flexShrink: 0, color: "rgba(255,255,255,0.5)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={term}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => term.length >= 2 && setOpen(true)}
            placeholder="Search products or categories..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              padding: "8px 12px", fontSize: 13, color: "white",
            }}
          />
          {loading && (
            <div style={{ marginRight: 10, width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          )}
        </div>
        <button
          type="submit"
          style={{
            padding: "8px 16px", background: "var(--color-accent)", color: "white",
            border: "none", borderRadius: "0 6px 6px 0", fontWeight: 700, fontSize: 13,
            cursor: "pointer", marginLeft: -1, flexShrink: 0,
          }}
        >
          Go
        </button>
      </form>

      {/* Quick results dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          border: "1px solid #e5e7eb", zIndex: 1000, overflow: "hidden",
        }}>
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              href={r.slug}
              onClick={() => { setOpen(false); setTerm(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 14px", textDecoration: "none", color: "#111",
                borderBottom: "1px solid #f3f4f6", transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fff7ed")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {r.image && (
                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#f3f4f6" }}>
                  <Image src={r.image} alt={r.name} fill style={{ objectFit: "cover" }} sizes="36px" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                <p style={{ fontSize: 11, color: r.type === "category" ? "var(--color-accent)" : "#6b7280", margin: 0 }}>
                  {r.meta}
                </p>
              </div>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(term)}`}
            onClick={() => setOpen(false)}
            style={{
              display: "block", padding: "9px 14px", fontSize: 12, fontWeight: 600,
              color: "var(--color-accent)", textDecoration: "none", textAlign: "center",
              background: "#f9fafb",
            }}
          >
            See all results for &ldquo;{term}&rdquo; →
          </Link>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
