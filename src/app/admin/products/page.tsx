import { query } from "@/lib/db";
import { AdminProductsClient } from "@/components/admin-products-client";

export default async function AdminProductsPage() {
  const products = await query<{
    id: string; name: string; category: string; subcategory: string;
    brand: string; sku: string; price: number; inventory: number; featured: boolean;
  }>(
    `SELECT id, name, category, subcategory, brand, sku, price, inventory, featured
     FROM products ORDER BY inventory ASC, name ASC`
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Products</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
          {products.length} products · {products.filter(p => p.inventory < 20).length} low stock
        </p>
      </div>
      <AdminProductsClient products={products} />
    </div>
  );
}
