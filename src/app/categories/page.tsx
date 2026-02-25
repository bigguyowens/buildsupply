import { CategoryCard } from "@/components/category-card";
import { fetchGraphQL } from "@/lib/graphql-client";
import type { Category } from "@/lib/products";

const CATEGORIES_QUERY = /* GraphQL */ `
  query Categories {
    categories {
      id name slug description image productCount
    }
  }
`;

export default async function CategoriesPage() {
  let categories: Category[] = [];
  try {
    const data = await fetchGraphQL<{ categories: Category[] }>({ query: CATEGORIES_QUERY, revalidate: 300 });
    categories = data.categories;
  } catch { /* graceful degradation */ }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Page header */}
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
            <p className="text-sm">Make sure PostgreSQL is running and you've run the seed script.</p>
            <code className="mt-4 block text-xs bg-gray-100 rounded px-3 py-2 text-left max-w-sm mx-auto">
              npx tsx scripts/seed.ts
            </code>
          </div>
        )}
      </main>
    </div>
  );
}
