import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdpPurchaseSection } from "@/components/pdp-purchase-section";
import { WishlistButton } from "@/components/wishlist-button";
import { fetchGraphQL } from "@/lib/graphql-client";
import { getSession } from "@/lib/auth";
import { getUserWishlists, getWishlistsContaining } from "@/app/actions/wishlist";
import { logger } from "@/lib/logger";
import type { Product } from "@/lib/products";

const PRODUCT_QUERY = /* GraphQL */ `
  query Product($slug: String!) {
    product(slug: $slug) {
      id name slug description price currency category subcategory
      tags image gallery rating ratingCount inventory featured brand sku unit
    }
  }
`;

type ProductPageProps = { params: Promise<{ slug: string }> };

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <svg key={s} className="h-4 w-4" fill={rating >= s ? "var(--color-accent)" : "none"} stroke="var(--color-accent)" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-[var(--color-muted)]">{rating.toFixed(1)} ({count.toLocaleString()} reviews)</span>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Product | null = null;
  try {
    const data = await fetchGraphQL<{ product: Product | null }>({ query: PRODUCT_QUERY, variables: { slug }, revalidate: 300 });
    product = data.product;
  } catch (err) {
    await logger.error("PDP fetchGraphQL failed", {
      source: "products/[slug]",
      context: { slug, error: String(err) },
      stack: err instanceof Error ? err.stack : undefined,
    });
  }

  if (!product) notFound();

  // Wishlist state — only for logged-in users
  const session = await getSession();
  let lists: Awaited<ReturnType<typeof getUserWishlists>> = [];
  let activeIds: number[] = [];
  if (session) {
    try {
      [lists, activeIds] = await Promise.all([
        getUserWishlists(),
        getWishlistsContaining(product.id),
      ]);
    } catch (err) {
      await logger.error("PDP wishlist fetch failed", {
        source: "products/[slug]",
        context: { slug, error: String(err) },
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }

  const priceLabel = new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Breadcrumb */}
      <div className="bg-white border-b text-xs" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center gap-1.5 text-[var(--color-muted)]">
          <Link href="/" className="hover:text-[var(--color-accent)]">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-[var(--color-accent)]">Categories</Link>
          <span>/</span>
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-[var(--color-accent)]">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-foreground)] truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* Left: images */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded bg-white border" style={{ borderColor: "var(--color-border)" }}>
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(min-width:1024px) 55vw, 100vw" priority />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.gallery.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded bg-white border" style={{ borderColor: "var(--color-border)" }}>
                  <Image src={src} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: info + purchase */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">
                {product.subcategory || product.category}
              </p>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)] leading-tight">{product.name}</h1>
            </div>

            <StarRating rating={product.rating} count={product.ratingCount} />

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--color-foreground)]">{priceLabel}</span>
              <span className="text-sm text-[var(--color-muted)]">/ {product.unit}</span>
            </div>

            {/* Key specs */}
            <div className="rounded border" style={{ borderColor: "var(--color-border)" }}>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Brand",       product.brand],
                    ["SKU",         product.sku],
                    ["Category",    product.category],
                    ["Availability",product.inventory > 0 ? `${product.inventory} In Stock` : "Out of Stock"],
                  ].map(([label, value]) => (
                    <tr key={label} className="border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                      <td className="px-4 py-2.5 font-semibold text-[var(--color-muted)] bg-gray-50 w-32">{label}</td>
                      <td className="px-4 py-2.5 text-[var(--color-foreground)]">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PdpPurchaseSection product={product} maxQuantity={product.inventory} />

            {session && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                <WishlistButton
                  productId={product.id}
                  initialLists={lists}
                  initialActive={activeIds}
                  size="md"
                />
                <span style={{ fontSize: 13, color: "var(--color-muted)" }}>
                  {activeIds.length > 0 ? "Saved to wishlist" : "Save to wishlist"}
                </span>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)] mb-2">Description</p>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">{product.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] bg-gray-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
