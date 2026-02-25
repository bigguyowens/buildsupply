import { CategoryCard } from "@/components/category-card";
import { getCategories } from "@/lib/products";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="border-b bg-white" style={{ borderColor: "var(--color-border)" }}>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1">Departments</p>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">All Categories</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Browse our full catalog of industrial construction supplies.</p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10">
        {categories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <div className="rounded bg-white border border-[var(--color-border)] p-12 text-center text-[var(--color-muted)]">
            <p className="text-lg font-semibold mb-2">No categories found</p>
            <p className="text-sm">Make sure the database is seeded correctly.</p>
          </div>
        )}
      </main>
    </div>
  );
}
