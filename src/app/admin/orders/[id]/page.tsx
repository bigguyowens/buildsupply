import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminOrderDetailClient } from "@/components/admin-order-detail-client";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [orderRow] = await query<{
    id: number; status: string; total: number; created_at: string;
    items: unknown; shipping: unknown;
    user_id: number | null; first_name: string | null; last_name: string | null; email: string | null;
  }>(
    `SELECT o.id, o.status, o.total, o.created_at, o.items, o.shipping,
            o.user_id, u.first_name, u.last_name, u.email
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [Number(id)]
  );
  if (!orderRow) notFound();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/orders" style={{ color: "var(--ad-muted2)", textDecoration: "none", fontSize: 13 }}>← Orders</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Order #{orderRow.id}</h1>
      </div>
      <AdminOrderDetailClient order={orderRow as any} />
    </div>
  );
}
