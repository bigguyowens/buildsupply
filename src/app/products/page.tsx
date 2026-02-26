import { ProductsClient } from "@/components/products-client";
import { getProducts } from "@/lib/products";

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="border-b bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Catalog</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">All Products</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{products.length} products</p>
        </div>
      </div>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
        <ProductsClient products={products} categories={categories} />
      </main>
    </div>
  );
}
