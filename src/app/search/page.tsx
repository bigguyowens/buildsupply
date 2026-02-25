import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import { fetchGraphQL } from "@/lib/graphql-client";
import type { Product, Category } from "@/lib/products";

const SEARCH_QUERY = /* GraphQL */ `
  query Search($term: String!) {
    searchProducts(term: $term) {
      id name slug description price currency category subcategory
      tags image gallery rating ratingCount inventory featured brand sku unit
    }
    searchCategories(term: $term) {
      id name slug description image
    }
  }
`;

type SearchData = {
  searchProducts: Product[];
  searchCategories: Category[];
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  let products: Product[] = [];
  let categories: Category[] = [];

  if (term) {
    try {
      const data = await fetchGraphQL<SearchData>({
        query: SEARCH_QUERY,
        variables: { term },
        revalidate: 0,
      });
      products = data.searchProducts ?? [];
      categories = data.searchCategories ?? [];
    } catch { /* graceful degradation */ }
  }

  const totalResults = products.length + categories.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>

      {/* Search header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>
            {term ? `Search Results` : "Search"}
          </h1>
          {term && (
            <p style={{ marginTop: 8, fontSize: 20, color: "rgba(255,255,255,0.75)", margin: "8px 0 0", fontWeight: 500 }}>
              {totalResults > 0
                ? `${totalResults} result${totalResults === 1 ? "" : "s"} for `
                : `No results for `}
              {term && <em>&ldquo;{term}&rdquo;</em>}
            </p>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px" }}>

        {/* Empty state — no query */}
        {!term && (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--color-muted)" }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: "0 auto 16px", opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <p style={{ fontSize: 16 }}>Enter a search term above to find products or categories.</p>
          </div>
        )}

        {/* No results */}
        {term && totalResults === 0 && (
          <div style={{
            background: "white", border: "1px solid var(--color-border)",
            borderRadius: 8, padding: "48px 24px", textAlign: "center",
          }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results for &ldquo;{term}&rdquo;</p>
            <p style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 20 }}>
              Try a different keyword — product name, brand, or category.
            </p>
            <Link
              href="/categories"
              style={{
                display: "inline-block", padding: "8px 20px", borderRadius: 6,
                background: "var(--color-accent)", color: "white",
                textDecoration: "none", fontWeight: 600, fontSize: 14,
              }}
            >
              Browse All Categories
            </Link>
          </div>
        )}

        {/* Category matches */}
        {categories.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 12 }}>
              Categories ({categories.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    position: "relative", overflow: "hidden", borderRadius: 8,
                    border: "1px solid var(--color-border)", background: "white",
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    transition: "box-shadow 0.15s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {cat.image && (
                      <div style={{ position: "relative", width: 44, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                        <Image src={cat.image} alt={cat.name} fill style={{ objectFit: "cover" }} sizes="44px" />
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 2 }}>{cat.name}</p>
                      <p style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 600 }}>View category →</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Product results */}
        {products.length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", marginBottom: 12 }}>
              Products ({products.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
