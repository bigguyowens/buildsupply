'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { useCart } from "@/context/cart-context";
import { HeaderSearch } from "@/components/header-search";
import { WishlistNavIcon } from "@/components/wishlist-nav-icon";
import { AccountNav } from "@/components/account-nav";

const SUBCATEGORIES: Record<string, { label: string; slug: string }[]> = {
  "safety-ppe": [
    { label: "Head Protection",        slug: "head-protection" },
    { label: "Eye Protection",         slug: "eye-protection" },
    { label: "Hearing Protection",     slug: "hearing-protection" },
    { label: "Hand Protection",        slug: "hand-protection" },
    { label: "Respiratory Protection", slug: "respiratory-protection" },
    { label: "Hi-Vis Clothing",        slug: "hi-vis-clothing" },
    { label: "Fall Protection",        slug: "fall-protection" },
    { label: "Foot Protection",        slug: "foot-protection" },
  ],
  "fasteners": [
    { label: "Cap Screws",    slug: "cap-screws" },
    { label: "Screws",        slug: "screws" },
    { label: "Nuts & Washers",slug: "nuts-washers" },
    { label: "Anchors",       slug: "anchors" },
    { label: "Bolts",         slug: "bolts" },
    { label: "Rivets",        slug: "rivets" },
    { label: "Threaded Rod",  slug: "threaded-rod" },
    { label: "Pins & Clips",  slug: "pins-clips" },
  ],
  "power-tools": [
    { label: "Drills",          slug: "drills" },
    { label: "Saws",            slug: "saws" },
    { label: "Grinders",        slug: "grinders" },
    { label: "Rotary Hammers",  slug: "rotary-hammers" },
    { label: "Sanders",         slug: "sanders" },
    { label: "Nailers",         slug: "nailers" },
    { label: "Impact Wrenches", slug: "impact-wrenches" },
    { label: "Compressors",     slug: "compressors" },
  ],
  "hand-tools": [
    { label: "Wrenches",          slug: "wrenches" },
    { label: "Screwdrivers",      slug: "screwdrivers" },
    { label: "Hammers",           slug: "hammers" },
    { label: "Pliers",            slug: "pliers" },
    { label: "Measuring & Layout",slug: "measuring-layout" },
    { label: "Levels",            slug: "levels" },
    { label: "Chisels & Punches", slug: "chisels-punches" },
    { label: "Knives & Blades",   slug: "knives-blades" },
  ],
  "abrasives": [
    { label: "Flap Discs",     slug: "flap-discs" },
    { label: "Grinding Wheels",slug: "grinding-wheels" },
    { label: "Cutting Discs",  slug: "cutting-discs" },
    { label: "Sandpaper",      slug: "sandpaper" },
    { label: "Sanding Belts",  slug: "sanding-belts" },
    { label: "Wire Wheels",    slug: "wire-wheels" },
    { label: "Surface Prep",   slug: "surface-prep" },
  ],
  "electrical": [
    { label: "Wire & Cable",       slug: "wire-cable" },
    { label: "Conduit & Fittings", slug: "conduit-fittings" },
    { label: "Breakers & Panels",  slug: "breakers-panels" },
    { label: "Electrician Tools",  slug: "electrician-tools" },
    { label: "Connectors & Lugs",  slug: "connectors-lugs" },
    { label: "Boxes & Enclosures", slug: "boxes-enclosures" },
    { label: "Lighting",           slug: "lighting" },
  ],
  "plumbing": [
    { label: "Valves",                slug: "valves" },
    { label: "Fittings",              slug: "fittings" },
    { label: "Pipe",                  slug: "pipe" },
    { label: "Pipe Tools",            slug: "pipe-tools" },
    { label: "Pipe Cement & Solvents",slug: "pipe-cement-solvents" },
    { label: "Water Heaters",         slug: "water-heaters" },
    { label: "Pumps",                 slug: "pumps" },
  ],
  "welding": [
    { label: "MIG Welders",         slug: "mig-welders" },
    { label: "Stick Welders",       slug: "stick-welders" },
    { label: "TIG Welders",         slug: "tig-welders" },
    { label: "Welding Wire & Rod",  slug: "welding-wire-rod" },
    { label: "Welding Helmets",     slug: "welding-helmets" },
    { label: "Welding Gloves",      slug: "welding-gloves" },
    { label: "Welding Accessories", slug: "welding-accessories" },
  ],
  "concrete-masonry": [
    { label: "Concrete Mix",        slug: "concrete-mix" },
    { label: "Masonry Tools",       slug: "masonry-tools" },
    { label: "Sealants & Caulking", slug: "sealants-caulking" },
    { label: "Concrete Anchors",    slug: "concrete-anchors" },
    { label: "Rebar & Wire Mesh",   slug: "rebar-wire-mesh" },
    { label: "Forms & Shoring",     slug: "forms-shoring" },
  ],
  "cutting-tools": [
    { label: "Drill Bits",  slug: "drill-bits" },
    { label: "Saw Blades",  slug: "saw-blades" },
    { label: "Hole Saws",   slug: "hole-saws" },
    { label: "Taps & Dies", slug: "taps-dies" },
    { label: "End Mills",   slug: "end-mills" },
    { label: "Router Bits", slug: "router-bits" },
  ],
  "lifting-rigging": [
    { label: "Chain Hoists",  slug: "chain-hoists" },
    { label: "Web Slings",    slug: "web-slings" },
    { label: "Chain Slings",  slug: "chain-slings" },
    { label: "Shackles",      slug: "shackles" },
    { label: "Eye Bolts",     slug: "eye-bolts" },
    { label: "Load Binders",  slug: "load-binders" },
    { label: "Jacks & Stands",slug: "jacks-stands" },
  ],
  "janitorial": [
    { label: "Mops & Brooms",      slug: "mops-brooms" },
    { label: "Cleaning Chemicals", slug: "cleaning-chemicals" },
    { label: "Trash & Waste",      slug: "trash-waste" },
    { label: "Floor Care",         slug: "floor-care" },
    { label: "Paper & Dispensers", slug: "paper-dispensers" },
    { label: "Safety & Spill",     slug: "safety-spill" },
  ],
};

const CATEGORIES = [
  { label: "Safety & PPE",       slug: "safety-ppe" },
  { label: "Fasteners",          slug: "fasteners" },
  { label: "Power Tools",        slug: "power-tools" },
  { label: "Hand Tools",         slug: "hand-tools" },
  { label: "Abrasives",          slug: "abrasives" },
  { label: "Electrical",         slug: "electrical" },
  { label: "Plumbing",           slug: "plumbing" },
  { label: "Welding",            slug: "welding" },
  { label: "Concrete & Masonry", slug: "concrete-masonry" },
  { label: "Cutting Tools",      slug: "cutting-tools" },
  { label: "Lifting & Rigging",  slug: "lifting-rigging" },
  { label: "Janitorial",         slug: "janitorial" },
];

export function Header({ session }: { session: SessionUser | null }) {
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [megaOpen, setMegaOpen]           = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].slug);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  function openMega() {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  }
  function closeMega() {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 150);
  }
  function keepMega() {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
  }

  // Close mega menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => () => { if (megaTimeout.current) clearTimeout(megaTimeout.current); }, []);

  const activeSubs = SUBCATEGORIES[activeCategory] ?? [];
  const activeCatLabel = CATEGORIES.find(c => c.slug === activeCategory)?.label ?? "";

  return (
    <header ref={headerRef} className="sticky top-0 z-40 shadow-md" style={{ background: "var(--color-primary)" }}>

      {/* ── Utility bar ───────────────────────────────────── */}
      <div className="util-bar" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px" }}>
          <span>Free shipping on orders $500+</span>
          <div style={{ display: "flex", gap: 16 }}>
            {session ? (
              <>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>Hi, {session.firstName}</span>
                <Link href="/account" style={{ color: "inherit", textDecoration: "none" }}>My Account</Link>
                <Link href="/account" style={{ color: "inherit", textDecoration: "none" }}>Order History</Link>
              </>
            ) : (
              <>
                <Link href="/login"    style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
                <Link href="/register" style={{ color: "inherit", textDecoration: "none" }}>Create Account</Link>
              </>
            )}
            <Link href="/contact" style={{ color: "inherit", textDecoration: "none" }}>Contact Us</Link>
          </div>
        </div>
      </div>

      {/* ── Main bar ──────────────────────────────────────── */}
      <div className="header-main" style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px" }}>
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, color: "white", fontWeight: 700, fontSize: 20, textDecoration: "none", letterSpacing: "-0.02em", marginRight: 8 }}>
          <span style={{ color: "var(--color-accent)" }}>Build</span>Supply
        </Link>

        {/* Shop button — triggers mega menu */}
        <div style={{ position: "relative", flexShrink: 0 }} onMouseEnter={openMega} onMouseLeave={closeMega}>
          <button
            onClick={() => setMegaOpen(o => !o)}
            className="shop-btn"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: megaOpen ? "var(--color-accent)" : "rgba(255,255,255,0.12)",
              color: "white", border: "none", borderRadius: 6,
              padding: "8px 14px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="shop-btn-text">Shop by Category</span>
            <svg
              width="12" height="12" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2}
              style={{ transition: "transform 0.2s", transform: megaOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
            </svg>
          </button>
        </div>

        {/* Search bar — hidden on mobile, shown in mobile menu */}
        <div className="header-desktop-search hidden md:flex flex-1">
          <HeaderSearch />
        </div>

        {/* Wishlist icon — only shown when logged in */}
        {session && <WishlistNavIcon />}

        {/* Cart */}
        <Link
          href="/cart"
          className="cart-btn"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6, padding: "7px 14px", fontSize: 13, fontWeight: 600,
            flexShrink: 0, whiteSpace: "nowrap",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="cart-btn-text">Cart</span>
          {itemCount > 0 && (
            <span style={{ background: "var(--color-accent)", color: "white", borderRadius: 9999, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
              {itemCount}
            </span>
          )}
        </Link>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(o => !o)}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, marginLeft: 4 }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* ── Mega Menu ─────────────────────────────────────── */}
      {megaOpen && (
        <div
          onMouseEnter={keepMega}
          onMouseLeave={closeMega}
          style={{
            position: "absolute", left: 0, right: 0,
            background: "white", borderTop: "3px solid var(--color-accent)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            zIndex: 999, display: "flex",
          }}
        >
          {/* Left: Category list */}
          <div style={{ width: 240, flexShrink: 0, background: "#f8f9fa", borderRight: "1px solid #e5e7eb", overflowY: "auto", maxHeight: 480 }}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.slug}
                onMouseEnter={() => setActiveCategory(cat.slug)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: activeCategory === cat.slug ? "white" : "transparent",
                  color: activeCategory === cat.slug ? "var(--color-accent)" : "#374151",
                  borderLeft: activeCategory === cat.slug ? "3px solid var(--color-accent)" : "3px solid transparent",
                  transition: "all 0.1s",
                }}
              >
                <Link
                  href={`/categories/${cat.slug}`}
                  onClick={() => setMegaOpen(false)}
                  style={{ color: "inherit", textDecoration: "none", flex: 1 }}
                >
                  {cat.label}
                </Link>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Right: Subcategory grid */}
          <div style={{ flex: 1, padding: "20px 28px", maxHeight: 480, overflowY: "auto" }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
                {activeCatLabel}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px 12px" }}>
              {activeSubs.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/categories/${activeCategory}?sub=${sub.slug}`}
                  onClick={() => setMegaOpen(false)}
                  style={{
                    display: "block", padding: "8px 10px", fontSize: 13, color: "#374151",
                    textDecoration: "none", borderRadius: 4, transition: "all 0.1s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fff7ed"; (e.currentTarget as HTMLElement).style.color = "var(--color-accent)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
              <Link
                href={`/categories/${activeCategory}`}
                onClick={() => setMegaOpen(false)}
                style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none", fontWeight: 700 }}
              >
                View All {activeCatLabel} →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile menu ───────────────────────────────────── */}
      {mobileOpen && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", background: "var(--color-primary-hover)" }}>

          {/* Account strip */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {session.firstName[0]}{session.lastName[0]}
                </div>
                <div>
                  <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>{session.firstName} {session.lastName}</p>
                  <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
                    <Link href="/account" onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textDecoration: "none" }}>My Account</Link>
                    <Link href="/account/orders" onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textDecoration: "none" }}>Orders</Link>
                    <Link href="/account/wishlist" onClick={() => setMobileOpen(false)} style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textDecoration: "none" }}>Wishlists</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ padding: "8px 18px", borderRadius: 6, background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ padding: "12px 16px" }}>
            <HeaderSearch />
          </div>

          {/* Categories */}
          <nav style={{ display: "flex", flexDirection: "column", paddingBottom: 12 }}>
            <Link
              href="/categories"
              onClick={() => setMobileOpen(false)}
              style={{ padding: "8px 16px", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
            >
              All Categories
            </Link>
            {CATEGORIES.map((cat) => {
              const subs = SUBCATEGORIES[cat.slug] ?? [];
              const expanded = mobileExpanded === cat.slug;
              return (
                <div key={cat.slug}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      style={{ flex: 1, padding: "8px 16px", fontSize: 14, color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
                    >
                      {cat.label}
                    </Link>
                    {subs.length > 0 && (
                      <button
                        onClick={() => setMobileExpanded(expanded ? null : cat.slug)}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "8px 12px" }}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2}
                          style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {expanded && subs.length > 0 && (
                    <div style={{ borderLeft: "2px solid var(--color-accent)", marginLeft: 16, marginBottom: 4 }}>
                      {subs.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/categories/${cat.slug}?sub=${sub.slug}`}
                          onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                          style={{ display: "block", padding: "6px 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
