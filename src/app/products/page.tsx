import { FilterSidebar } from "@/components/filter-sidebar";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";
import { filterProductsByParams, PRICE_OPTIONS } from "@/lib/filter-options";
import type { Product } from "@/lib/products";

type ProductsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const normalize = (v?: string | string[]) => Array.isArray(v) ? v[0] : v;

  const selectedCategory = normalize(params.category);
  const selectedPrice    = normalize(params.price);
  const priceOption      = PRICE_OPTIONS.find((o) => o.value === selectedPrice);
  const priceLabel       = priceOption?.value ? priceOption.label : undefined;

  const initialParams: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => { const n = normalize(v); if (n) initialParams[k] = n; });

  const products: Product[] = await getProducts();
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const filteredProducts = filterProductsByParams(products, selectedCategory, selectedPrice);

  const heading = (() => {
    if (selectedCategory && priceLabel) return `${selectedCategory} — ${priceLabel}`;
    if (selectedCategory) return selectedCategory;
    if (priceLabel) return `All Products — ${priceLabel}`;
    return "All Products";
  })();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="border-b bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Catalog</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{heading}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">{filteredProducts.length} products</p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6" style={{ gridTemplateColumns: "220px 1fr" }}>
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedPrice={selectedPrice}
            basePath="/products"
            initialParams={initialParams}
          />
          <div>
            {filteredProducts.length === 0 ? (
              <div className="rounded bg-white border border-[var(--color-border)] p-12 text-center text-[var(--color-muted)]">
                No products match the selected filters.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
