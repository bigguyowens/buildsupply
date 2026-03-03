import { query } from "@/lib/db";
import Link from "next/link";
import { NewQuoteForm } from "./form";

export default async function NewQuotePage() {
  const [customers, products] = await Promise.all([
    query<{ id: number; first_name: string; last_name: string; email: string }>(
      `SELECT id, first_name, last_name, email FROM users WHERE role != 'admin' ORDER BY first_name, last_name`
    ),
    query<{ id: string; name: string; sku: string; image: string; slug: string; price: number; category: string; brand: string; inventory: number }>(
      `SELECT id::text, name, sku, image, slug, price::numeric AS price, category, brand, inventory FROM products ORDER BY name`
    ),
  ]);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/quotes" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Quotes</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>New Quote</h1>
      </div>
      <NewQuoteForm customers={customers} products={products} />
    </div>
  );
}
