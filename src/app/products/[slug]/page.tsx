import Link from "next/link";
import { notFound } from "next/navigation";
import { PdpPurchaseSection } from "@/components/pdp-purchase-section";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductImage } from "@/components/product-image";
import { ProductCarousel } from "@/components/product-carousel";
import { RecentlyViewedTracker } from "@/components/recently-viewed-tracker";
import { ShippingEstimate } from "@/components/shipping-estimate";
import { getSession } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { query } from "@/lib/db";
import { getSimilarProducts, getRecentlyViewedProducts } from "@/lib/product-views";
import { getProductReviews } from "@/app/actions/reviews";
import { ProductReviews } from "@/components/product-reviews";
import type { Product } from "@/lib/products";
import Image from "next/image";

type ProductPageProps = { params: Promise<{ slug: string }> };

async function getWishlistData(userId: number, productId: string) {
  const [lists, active] = await Promise.all([
    query<{ id: number; name: string; item_count: number }>(
      `SELECT w.id, w.name, COUNT(wi.id)::int AS item_count
       FROM wishlists w LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
       WHERE w.user_id = $1 GROUP BY w.id ORDER BY w.created_at ASC`,
      [userId]
    ),
    query<{ wishlist_id: number }>(
      `SELECT wi.wishlist_id FROM wishlist_items wi
       JOIN wishlists w ON w.id = wi.wishlist_id
       WHERE w.user_id = $1 AND wi.product_id = $2`,
      [userId, productId]
    ),
  ]);
  return { lists, activeIds: active.map(r => r.wishlist_id) };
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <a href="#reviews" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", cursor: "pointer" }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1,2,3,4,5].map(s => (
          <svg key={s} width="16" height="16" viewBox="0 0 24 24"
            fill={rating >= s ? "var(--color-accent)" : "none"}
            stroke="var(--color-accent)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
        {rating.toFixed(1)} <span style={{ opacity: 0.6 }}>({count.toLocaleString()} reviews)</span>
      </span>
    </a>
  );
}

// ── Specs table ────────────────────────────────────────────────────────────────
function SpecsTable({ specs }: { specs: Record<string, string> }) {
  const entries = Object.entries(specs);
  const half = Math.ceil(entries.length / 2);
  const col1 = entries.slice(0, half);
  const col2 = entries.slice(half);

  return (
    <div style={{ background: "white", borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden", marginTop: 24 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "#f8fafc" }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--color-foreground)", letterSpacing: "-0.01em" }}>
          Product Specifications
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }} className="specs-grid">
        {[col1, col2].map((col, ci) => (
          <div key={ci} style={{ borderRight: ci === 0 ? "1px solid var(--color-border)" : "none" }}>
            {col.map(([k, v], i) => (
              <div key={k} style={{
                display: "grid", gridTemplateColumns: "44% 56%",
                borderBottom: i < col.length - 1 ? "1px solid #f1f5f9" : "none",
              }}>
                <div style={{ padding: "10px 16px", background: "#fafafa", fontSize: 12, fontWeight: 700, color: "var(--color-muted)", borderRight: "1px solid #f1f5f9" }}>
                  {k}
                </div>
                <div style={{ padding: "10px 16px", fontSize: 13, color: "var(--color-foreground)", fontWeight: 500 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product: Product | null = await getProductBySlug(slug);
  if (!product) notFound();

  const tags    = Array.isArray(product.tags)    ? product.tags    : [];
  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const session = await getSession();

  const [{ lists, activeIds }, similarProducts, recentlyViewed, { reviews, summary }] = await Promise.all([
    session ? getWishlistData(session.id, product.id) : Promise.resolve({ lists: [], activeIds: [] }),
    getSimilarProducts(product.category, product.id, 12),
    session ? getRecentlyViewedProducts(session.id, product.id, 12) : Promise.resolve([]),
    getProductReviews(product.id),
  ]);

  const priceLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Breadcrumb */}
      <div style={{ background: "white", borderBottom: "1px solid var(--color-border)", fontSize: 12 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, color: "var(--color-muted)", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }} className="hover:text-accent">Home</Link>
          <span>/</span>
          <Link href="/categories" style={{ color: "inherit", textDecoration: "none" }}>Categories</Link>
          <span>/</span>
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} style={{ color: "inherit", textDecoration: "none" }}>
            {product.category}
          </Link>
          <span>/</span>
          <span style={{ color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{product.name}</span>
        </div>
      </div>

      {session && <RecentlyViewedTracker productId={product.id} />}

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px" }}>

        {/* ── Main grid: image left, info right ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 36, alignItems: "start" }} className="pdp-grid">

          {/* LEFT: image stack */}
          <div>
            <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", borderRadius: 12, background: "white", border: "1px solid var(--color-border)" }}>
              <ProductImage src={product.image} alt={product.name} fill sizes="(min-width:1024px) 55vw, 100vw" priority />
            </div>
            {gallery.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
                {gallery.map((src, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 8, background: "white", border: "1px solid var(--color-border)" }}>
                    <Image src={src} alt={`${product.name} ${i + 1}`} fill style={{ objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Specs below image */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <SpecsTable specs={product.specs} />
            )}
          </div>

          {/* RIGHT: product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 24 }}>

            {/* Category label + title */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-accent)", margin: "0 0 6px" }}>
                {product.subcategory || product.category}
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--color-foreground)", lineHeight: 1.25, margin: 0 }}>
                {product.name}
              </h1>
            </div>

            <StarRating rating={product.rating} count={product.ratingCount} />

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: "var(--color-foreground)", letterSpacing: "-0.02em" }}>{priceLabel}</span>
              <span style={{ fontSize: 13, color: "var(--color-muted)" }}>/ {product.unit}</span>
            </div>

            {/* Meta rows + wishlist */}
            <div>
              {/* Brand / SKU / Category */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "9px 0", borderTop: "1px solid var(--color-border)" }}>
                {[
                  { label: "Brand",    value: product.brand },
                  { label: "SKU",      value: product.sku },
                  { label: "Category", value: product.category },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {i > 0 && <span style={{ color: "#d1d5db", marginRight: 4 }}>·</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-muted)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>{value}</span>
                  </div>
                ))}
              </div>
              {/* Availability + Wishlist on same row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 9999,
                  background: product.inventory > 0 ? "#dcfce7" : "#fee2e2",
                  color:      product.inventory > 0 ? "#15803d" : "#dc2626",
                }}>
                  <span style={{ fontSize: 9 }}>{product.inventory > 0 ? "●" : "○"}</span>
                  {product.inventory > 0 ? `${product.inventory.toLocaleString()} In Stock` : "Out of Stock"}
                </span>
                {session && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                      {activeIds.length > 0 ? "Saved" : "Save"}
                    </span>
                    <WishlistButton
                      productId={product.id}
                      initialLists={lists}
                      initialActive={activeIds}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Purchase section */}
            <ShippingEstimate />
            <PdpPurchaseSection product={product} maxQuantity={product.inventory} />

            {/* Description — bigger + more breathing room */}
            <div style={{ paddingTop: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted)", margin: "0 0 10px" }}>
                About this product
              </p>
              <p style={{ fontSize: 15, color: "var(--color-foreground)", lineHeight: 1.75, margin: 0 }}>
                {product.description}
              </p>
            </div>

            {/* Tags — bigger pills */}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    color: "var(--color-accent)",
                    background: "rgba(var(--color-accent-rgb, 249 115 22) / 0.08)",
                    border: "1px solid rgba(var(--color-accent-rgb, 249 115 22) / 0.2)",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Carousels ──────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 56, paddingTop: 8 }}>
          <ProductCarousel title={`More in ${product.category}`} products={similarProducts} accentBar />
          {recentlyViewed.length > 0 && (
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
              <ProductCarousel title="Recently Viewed" products={recentlyViewed} accentBar />
            </div>
          )}
        </div>

        {/* ── Reviews ────────────────────────────────────────────── */}
        <div id="reviews">
        <ProductReviews
          reviews={reviews}
          summary={summary}
          productId={product.id}
          isLoggedIn={!!session}
        />
        </div>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .pdp-grid { grid-template-columns: 1fr !important; }
          .pdp-grid > div:last-child { position: static !important; }
          .specs-grid { grid-template-columns: 1fr !important; }
          .specs-grid > div:first-child { border-right: none !important; }
        }
      `}</style>
    </div>
  );
}
