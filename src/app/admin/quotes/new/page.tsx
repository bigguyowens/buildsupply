import { query } from "@/lib/db";
import Link from "next/link";
import { NewQuoteForm } from "./form";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ am?: string }> }) {
  const { am } = await searchParams;
  const amId = am ? Number(am) : null;

  const [customers, products] = await Promise.all([
    amId
      ? query<{ id: number; first_name: string; last_name: string; email: string }>(
          `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager') AND account_manager_id = $1
           ORDER BY first_name, last_name`,
          [amId]
        )
      : query<{ id: number; first_name: string; last_name: string; email: string }>(
          `SELECT id, first_name, last_name, email FROM users
           WHERE role NOT IN ('admin','account_manager')
           ORDER BY first_name, last_name`
        ),
    query<{ id: string; name: string; sku: string; image: string; slug: string; price: number; category: string; brand: string; inventory: number }>(
      `SELECT id::text, name, sku, image, slug, price::numeric AS price, category, brand, inventory FROM products ORDER BY name`
    ),
  ]);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href={amId ? "/crm/quotes" : "/admin/quotes"}
          style={{ color: "var(--ad-muted2)", textDecoration: "none", fontSize: 13 }}>
          ← {amId ? "Quote Pipeline" : "Quotes"}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>New Quote</h1>
        {amId && (
          <span style={{ fontSize: 12, color: "#92400e", background: "#fef3c7",
            padding: "3px 10px", borderRadius: 4, fontWeight: 700 }}>
            Showing your customers only
          </span>
        )}
      </div>
      <NewQuoteForm customers={customers} products={products} />
    </div>
  );
}
