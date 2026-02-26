import { ProductsClient } from "@/components/products-client";
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

  const heading = (() => {
    if (selectedCategory && priceLabel) return `${selectedCategory} — ${priceLabel}`;
    if (selectedCategory) return selectedCategory;
    if (priceLabel) return `All Products — ${priceLabel}`;
    return "All Products";
  })();

  const filtered = filterProductsByParams(products, selectedCategory, selectedPrice);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="border-b bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Catalog</p>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{heading}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1 hidden md:block">{filtered.length} products</p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <ProductsClient
          products={products}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedPrice={selectedPrice}
          heading={heading}
          initialParams={initialParams}
        />
      </main>
    </div>
  );
}
