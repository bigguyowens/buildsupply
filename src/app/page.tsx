import Link from "next/link";
import Image from "next/image";
import { getHomepageContent } from "@/app/actions/homepage";
import { query } from "@/lib/db";
import type { Product } from "@/lib/products";

const CATEGORIES = [
  { label: "Safety & PPE",       slug: "safety-ppe",       icon: "🦺" },
  { label: "Fasteners",          slug: "fasteners",         icon: "🔩" },
  { label: "Power Tools",        slug: "power-tools",       icon: "🔧" },
  { label: "Hand Tools",         slug: "hand-tools",        icon: "🔨" },
  { label: "Abrasives",          slug: "abrasives",         icon: "⚙️" },
  { label: "Electrical",         slug: "electrical",        icon: "⚡" },
  { label: "Plumbing",           slug: "plumbing",          icon: "🔵" },
  { label: "Welding",            slug: "welding",           icon: "🔥" },
  { label: "Concrete & Masonry", slug: "concrete-masonry",  icon: "🧱" },
  { label: "Cutting Tools",      slug: "cutting-tools",     icon: "✂️" },
  { label: "Lifting & Rigging",  slug: "lifting-rigging",   icon: "⛓️" },
  { label: "Janitorial",         slug: "janitorial",        icon: "🧹" },
];

export default async function HomePage() {
  const [cms, featuredProducts] = await Promise.all([
    getHomepageContent(),
    query<Product>(
      `SELECT id, name, slug, price, currency, image, brand, sku, unit, rating,
              rating_count AS "ratingCount", inventory, featured,
              category, subcategory, description, tags, gallery
       FROM products WHERE featured = true ORDER BY rating_count DESC LIMIT 8`
    ),
  ]);

  const hero         = cms.hero?.content         as any;
  const promoBar     = cms.promo_bar?.content     as any;
  const featDeals    = cms.featured_deals?.content as any;
  const valueProps   = cms.value_props?.content   as any;

  const heroEnabled      = cms.hero?.enabled      ?? true;
  const promoEnabled     = cms.promo_bar?.enabled ?? true;
  const dealsEnabled     = cms.featured_deals?.enabled ?? true;
  const valueEnabled     = cms.value_props?.enabled    ?? true;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>

      {/* ── Promo Bar ─────────────────────────────────────── */}
      {promoEnabled && promoBar && (
        <div style={{ background: promoBar.bg, color: promoBar.color, textAlign: "center", padding: "10px 16px", fontSize: 14, fontWeight: 600, letterSpacing: "0.01em" }}>
          {promoBar.text}
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────── */}
      {heroEnabled && hero && (
        <div style={{
          background: hero.bg,
          minHeight: 480,
          display: "flex", alignItems: "center",
          position: "relative", overflow: "hidden",
        }}>
          {/* Background pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }} />

          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px", position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", width: "100%" }}>
            {/* Left: text */}
            <div>
              <div style={{ display: "inline-block", background: hero.accent, color: "white", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 4, marginBottom: 20 }}>
                BuildSupply Pro
              </div>
              <h1 style={{ color: "white", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
                {hero.headline}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, lineHeight: 1.6, margin: "0 0 36px", maxWidth: 480 }}>
                {hero.subtext}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href={hero.cta_link} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: hero.accent, color: "white",
                  padding: "14px 32px", borderRadius: 6, textDecoration: "none",
                  fontWeight: 800, fontSize: 15, letterSpacing: "0.01em",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
                }}>
                  {hero.cta_text} →
                </Link>
                <Link href="/categories" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.1)", color: "white",
                  padding: "14px 28px", borderRadius: 6, textDecoration: "none",
                  fontWeight: 700, fontSize: 15, border: "1px solid rgba(255,255,255,0.2)",
                }}>
                  Browse Categories
                </Link>
              </div>
              {/* Trust badges */}
              <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
                {["47 Products", "12 Categories", "Fast Shipping"].map(t => (
                  <div key={t} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>
                    ✓ {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: category preview cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {CATEGORIES.slice(0, 4).map(cat => (
                <Link key={cat.slug} href={`/categories/${cat.slug}`} style={{
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "20px 16px", textDecoration: "none",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  transition: "background 0.15s",
                }}>
                  <span style={{ fontSize: 28 }}>{cat.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, textAlign: "center" }}>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px" }}>

        {/* ── Shop by Category ────────────────────────────── */}
        <section style={{ padding: "48px 0 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Shop by Category</h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Everything you need, organized your way</p>
            </div>
            <Link href="/categories" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} style={{
                background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "20px 12px", textDecoration: "none", textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}>
                <span style={{ fontSize: 30 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.3 }}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Deals ──────────────────────────────── */}
        {dealsEnabled && featDeals && (
          <section style={{ padding: "0 0 48px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{featDeals.title}</h2>
              <Link href="/products" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>Shop All Deals →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {featDeals.deals?.map((deal: any, i: number) => (
                <Link key={i} href={deal.link} style={{
                  background: deal.bg, borderRadius: 12, padding: "32px 24px",
                  textDecoration: "none", display: "flex", flexDirection: "column",
                  gap: 12, minHeight: 160, position: "relative", overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                }}>
                  {/* Background shimmer */}
                  <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                  <span style={{
                    display: "inline-block", background: "rgba(255,255,255,0.2)",
                    color: deal.color, fontSize: 11, fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    padding: "4px 10px", borderRadius: 4, width: "fit-content",
                  }}>
                    {deal.badge}
                  </span>
                  <span style={{ color: deal.color, fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>
                    {deal.label}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginTop: "auto" }}>
                    Shop Now →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Products ────────────────────────────── */}
        {featuredProducts.length > 0 && (
          <section style={{ padding: "0 0 48px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Featured Products</h2>
                <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Hand-picked top sellers</p>
              </div>
              <Link href="/products?featured=true" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 700 }}>View All →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {featuredProducts.map(product => {
                const price = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);
                return (
                  <Link key={product.id} href={`/products/${product.slug}`} style={{ textDecoration: "none" }}>
                    <article style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s" }}>
                      <div style={{ position: "relative", aspectRatio: "4/3", background: "#f8fafc" }}>
                        <Image src={product.image} alt={product.name} fill style={{ objectFit: "cover" }} sizes="25vw" />
                        <span style={{ position: "absolute", top: 8, left: 8, background: "#f97316", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
                          Featured
                        </span>
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 4px" }}>{product.brand}</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {product.name}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{price}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>/ {product.unit}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Value Props ──────────────────────────────────── */}
        {valueEnabled && valueProps && (
          <section style={{ padding: "0 0 56px" }}>
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {valueProps.props?.map((prop: any, i: number) => (
                <div key={i} style={{
                  padding: "28px 24px", textAlign: "center",
                  borderRight: i < valueProps.props.length - 1 ? "1px solid #e2e8f0" : "none",
                }}>
                  <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>{prop.icon}</span>
                  <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 6px", color: "#0f172a" }}>{prop.title}</p>
                  <p style={{ color: "#64748b", fontSize: 13, margin: 0, lineHeight: 1.4 }}>{prop.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
