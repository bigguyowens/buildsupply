import { query } from "@/lib/db";
import { AdminProductsClient } from "@/components/admin-products-client";

export default async function AdminProductsPage() {
  const products = await query<{
    id: string; name: string; slug: string; description: string;
    category: string; subcategory: string; brand: string; sku: string;
    price: number; currency: string; inventory: number; featured: boolean;
    unit: string; tags: string[]; image: string; gallery: string[];
    rating: number; rating_count: number;
  }>(
    `SELECT id, name, slug, description, category, subcategory, brand, sku,
            price, currency, inventory, featured, unit, tags, image, gallery,
            rating, rating_count
     FROM products ORDER BY inventory ASC, name ASC`
  );

  const mapped = products.map(p => ({
    ...p,
    price:       Number(p.price),
    rating:      Number(p.rating),
    ratingCount: Number(p.rating_count),
    inventory:   Number(p.inventory),
    tags:    Array.isArray(p.tags)    ? p.tags    : JSON.parse(p.tags    as unknown as string ?? "[]"),
    gallery: Array.isArray(p.gallery) ? p.gallery : JSON.parse(p.gallery as unknown as string ?? "[]"),
  }));

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Products</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {products.length} products · {products.filter(p => Number(p.inventory) < 20).length} low stock
        </p>
      </div>
      <AdminProductsClient products={mapped} />
    </div>
  );
}
