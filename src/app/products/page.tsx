import { ProductsClient } from "@/components/products-client";
import { getProducts } from "@/lib/products";
import Link from "next/link";

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

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>

      {/* Page header */}
      <div className="border-b bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Catalog</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">All Products</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{products.length} products</p>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>

        {/* ── Shop by Category ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#0f172a" }}>Shop by Category</h2>
            <Link href="/categories" style={{ fontSize: 12, color: "var(--color-accent)", textDecoration: "none", fontWeight: 700 }}>
              View All →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "14px 10px",
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  lineHeight: 1.3,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={undefined}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Product listing ── */}
        <ProductsClient products={products} categories={categories} />

      </main>
    </div>
  );
}
