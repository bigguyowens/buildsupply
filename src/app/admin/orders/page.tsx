import { query } from "@/lib/db";
import { AdminOrdersClient } from "@/components/admin-orders-client";

type OrderRow = {
  id: number; status: string; total: number; created_at: string;
  first_name: string | null; last_name: string | null; email: string | null;
  item_count: number;
};

export default async function AdminOrdersPage() {
  const orders = await query<OrderRow>(
    `SELECT o.id, o.status, o.total, o.created_at,
            u.first_name, u.last_name, u.email,
            jsonb_array_length(o.items) AS item_count
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Orders</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>{orders.length} total orders</p>
      </div>
      <AdminOrdersClient orders={orders} />
    </div>
  );
}
