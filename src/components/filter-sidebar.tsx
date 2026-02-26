import Link from "next/link";
import { PRICE_OPTIONS } from "@/lib/filter-options";

type FilterSidebarProps = {
  categories: string[];
  selectedCategory?: string;
  selectedPrice?: string;
  basePath: string;
  initialParams?: Record<string, string>;
  onNavigate?: () => void;
};

function buildHref(basePath: string, initial: Record<string, string>, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams(initial);
  Object.entries(updates).forEach(([key, value]) => {
    if (value?.length) params.set(key, value);
    else params.delete(key);
  });
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function FilterSidebar({ categories, selectedCategory, selectedPrice, basePath, initialParams = {}, onNavigate }: FilterSidebarProps) {
  const unique = Array.from(new Set(categories)).sort();

  return (
    <aside className="rounded bg-white border sticky top-28 h-fit" style={{ borderColor: "var(--color-border)" }}>
      {/* Category section */}
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-3">Category</p>
        <div className="flex flex-col gap-1 text-sm">
          <Link
            href={buildHref(basePath, initialParams, { category: undefined })}
            onClick={onNavigate}
            className={`rounded px-2 py-1.5 transition-colors ${!selectedCategory ? "bg-[var(--color-primary)] text-white font-semibold" : "text-[var(--color-foreground)] hover:bg-gray-100"}`}
          >
            All Categories
          </Link>
          {unique.map((cat) => (
            <Link
              key={cat}
              href={buildHref(basePath, initialParams, { category: cat })}
              onClick={onNavigate}
              className={`rounded px-2 py-1.5 transition-colors ${selectedCategory === cat ? "bg-[var(--color-primary)] text-white font-semibold" : "text-[var(--color-foreground)] hover:bg-gray-100"}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Price section */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-3">Price Range</p>
        <div className="flex flex-col gap-1 text-sm">
          {PRICE_OPTIONS.map((option) => (
            <Link
              key={option.value || "all"}
              href={buildHref(basePath, initialParams, { price: option.value || undefined })}
              onClick={onNavigate}
              className={`rounded px-2 py-1.5 transition-colors ${
                (selectedPrice === option.value) || (!selectedPrice && option.value === "")
                  ? "bg-[var(--color-primary)] text-white font-semibold"
                  : "text-[var(--color-foreground)] hover:bg-gray-100"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
