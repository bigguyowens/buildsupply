import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/products";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex flex-col overflow-hidden rounded bg-white border border-[var(--color-border)] hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105 opacity-80"
            sizes="(min-width:1024px) 25vw, 50vw"
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,34,68,0.7) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base font-bold text-white leading-tight">{category.name}</h3>
          {category.productCount !== undefined && (
            <p className="text-xs text-white/70 mt-0.5">{category.productCount} products</p>
          )}
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-[var(--color-muted)] line-clamp-2">{category.description}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-accent)] group-hover:underline">
          Shop Now →
        </span>
      </div>
    </Link>
  );
}
