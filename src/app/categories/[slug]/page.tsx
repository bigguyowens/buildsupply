import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CategoryPageClient } from "./client";
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
  if (!category) notFound();

  const categoryName    = category.name;
  const subcategoryName = sub ? subSlugToName(sub) : undefined;

  const [products, subcategories] = await Promise.all([
    subcategoryName
      ? getProductsBySubcategory(categoryName, subcategoryName)
      : getProductsByCategory(categoryName),
    getSubcategoriesByCategory(categoryName),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>

      {/* Hero bar */}
      <div className="relative overflow-hidden border-b" style={{ background: "var(--color-primary)", minHeight: 120 }}>
        {category.image && (
          <Image src={category.image} alt={category.name} fill className="object-cover opacity-20" />
        )}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-5">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, flexWrap: "wrap" }}>
            <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/categories" style={{ color: "inherit", textDecoration: "none" }}>All Categories</Link>
            <span>/</span>
            {subcategoryName ? (
              <>
                <Link href={`/categories/${slug}`} style={{ color: "inherit", textDecoration: "none" }}>{category.name}</Link>
                <span>/</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>{subcategoryName}</span>
              </>
            ) : (
              <span style={{ color: "rgba(255,255,255,0.8)" }}>{category.name}</span>
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>
            {subcategoryName ?? category.name}
          </h1>
          {!subcategoryName && category.description && (
            <p style={{ color: "rgba(255,255,255,0.65)", marginTop: 4, fontSize: 13, maxWidth: 520 }}>{category.description}</p>
          )}
        </div>
      </div>

      {/* Mobile subcategory scroll chips */}
      {subcategories.length > 0 && (
        <div className="category-sub-mobile" style={{ display: "none" }}>
          <Link href={`/categories/${slug}`} className={`category-sub-chip${!sub ? " active" : ""}`}>All</Link>
          {subcategories.map((subcat) => {
            const subSlug = subcat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            return (
              <Link key={subcat} href={`/categories/${slug}?sub=${subSlug}`} className={`category-sub-chip${sub === subSlug ? " active" : ""}`}>
                {subcat}
              </Link>
            );
          })}
        </div>
      )}

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
        <CategoryPageClient
          category={category}
          products={products}
          subcategories={subcategories}
          slug={slug}
          activeSub={sub}
        />
      </main>
    </div>
  );
}
