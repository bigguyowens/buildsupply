import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import {
  getCategoryBySlug,
  getProductsByCategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory,
} from "@/lib/products";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
};

function subSlugToName(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub }  = await searchParams;

  const category = await getCategoryBySlug(slug);
  const categoryName = category?.name ?? slug;
  const subcategoryName = sub ? subSlugToName(sub) : undefined;

  const [products, subcategories] = await Promise.all([
    subcategoryName
      ? getProductsBySubcategory(categoryName, subcategoryName)
      : getProductsByCategory(categoryName),
    getSubcategoriesByCategory(categoryName),
  ]);

  if (!category) notFound();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>

      {/* Category hero */}
      <div className="relative overflow-hidden border-b" style={{ background: "var(--color-primary)", minHeight: 160 }}>
        {category?.image && (
          <Image src={category.image} alt={category.name ?? ""} fill className="object-cover opacity-20" />
        )}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
            <Link href="/categories" className="hover:text-white/80">All Categories</Link>
            <span>/</span>
            {subcategoryName ? (
              <>
                <Link href={`/categories/${slug}`} className="hover:text-white/80">{category?.name ?? categoryName}</Link>
                <span>/</span>
                <span className="text-white/80">{subcategoryName}</span>
              </>
            ) : (
              <span className="text-white/80">{category?.name ?? categoryName}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {subcategoryName ?? category?.name ?? categoryName}
          </h1>
          {!subcategoryName && category?.description && (
            <p className="text-white/70 mt-1 max-w-xl text-sm">{category.description}</p>
          )}
          <p className="text-white/40 text-xs mt-2">{products.length} products</p>
        </div>
      </div>

      {/* Mobile subcategory scroll bar */}
      {subcategories.length > 0 && (
        <div className="category-sub-mobile" style={{ display: "none" }}>
          <Link
            href={`/categories/${slug}`}
            className={`category-sub-chip${!sub ? " active" : ""}`}
          >
            All
          </Link>
          {subcategories.map((subcat) => {
            const subSlug = subcat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const isActive = sub === subSlug;
            return (
              <Link
                key={subcat}
                href={`/categories/${slug}?sub=${subSlug}`}
                className={`category-sub-chip${isActive ? " active" : ""}`}
              >
                {subcat}
              </Link>
            );
          })}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-8">

          {/* Desktop subcategory sidebar */}
          {subcategories.length > 0 && (
            <aside className="category-sub-sidebar hidden md:block w-52 flex-shrink-0">
              <div className="rounded border border-[var(--color-border)] bg-white overflow-hidden sticky top-24">
                <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] border-b border-[var(--color-border)]">
                  Filter by Type
                </div>
                <nav className="py-2">
                  <Link
                    href={`/categories/${slug}`}
                    className={`block px-4 py-2 text-sm transition-colors ${!sub ? "font-bold text-[var(--color-accent)] bg-orange-50" : "text-[var(--color-foreground)] hover:bg-gray-50"}`}
                  >
                    All {category?.name ?? categoryName}
                  </Link>
                  {subcategories.map((subcat) => {
                    const subSlug = subcat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                    const isActive = sub === subSlug;
                    return (
                      <Link
                        key={subcat}
                        href={`/categories/${slug}?sub=${subSlug}`}
                        className={`block px-4 py-2 text-sm transition-colors ${isActive ? "font-bold text-[var(--color-accent)] bg-orange-50" : "text-[var(--color-foreground)] hover:bg-gray-50"}`}
                      >
                        {subcat}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
          )}

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {products.length > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded bg-white border border-[var(--color-border)] p-12 text-center">
                <p className="text-[var(--color-muted)] text-lg mb-2">No products found</p>
                <Link href={`/categories/${slug}`} className="text-sm font-semibold hover:underline" style={{ color: "var(--color-accent)" }}>
                  View all {category?.name ?? categoryName}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
