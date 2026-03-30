import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { OrderStatusTimeline } from "@/components/order-status-timeline";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; sku: string; slug: string };
type StatusEvent = { status: string; timestamp: string };

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e",  label: "Pending"    },
  processing: { bg: "#dbeafe", color: "#1e40af",  label: "Processing" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6",  label: "Shipped"    },
  completed:  { bg: "#dcfce7", color: "#15803d",  label: "Completed"  },
  cancelled:  { bg: "#fee2e2", color: "#991b1b",  label: "Cancelled"  },
};

export default async function CRMOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin","account_manager","manager"].includes(session.role)) redirect("/account");

  const rows = await query<{
    id: number; status: string; total: number; created_at: string;
    items: OrderItem[]; shipping: unknown; status_history: StatusEvent[];
    promo_code: string | null; discount_amount: number;
    user_id: number; first_name: string; last_name: string;
    email: string; account_manager_id: number | null;
    account_manager_name: string | null;
  }>(
    `SELECT o.id, o.status, o.total, o.created_at, o.items, o.shipping,
            o.status_history, o.promo_code, o.discount_amount,
            o.user_id, u.first_name, u.last_name, u.email,
            u.account_manager_id,
            am.first_name || ' ' || am.last_name AS account_manager_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN users am ON am.id = u.account_manager_id
     WHERE o.id = $1`,
    [Number(id)]
  );
  if (!rows.length) notFound();
  const order = rows[0];

  // AMs can only view orders for their assigned customers
  if (session.role === "account_manager" && order.account_manager_id !== session.id) {
    redirect("/crm/orders");
  }

  const items   = Array.isArray(order.items) ? order.items : [];
  const history = Array.isArray(order.status_history) ? order.status_history : [];
  const statusMeta = STATUS_META[order.status] ?? { bg: "#f1f5f9", color: "#475569", label: order.status };
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Number(order.discount_amount ?? 0);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/orders" style={{ color: "#9ca3af", textDecoration: "none" }}>Orders</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "#0d0d0d", fontWeight: 700 }}>Order #{order.id}</span>
      </div>

      {/* Header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "18px 24px",
        marginBottom: 20, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>
            Order #{order.id}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href={`/crm/customers/${order.user_id}`}
              style={{ color: "#f5c700", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              {order.first_name} {order.last_name}
            </Link>
            <span style={{ color: "#6b6b6b", fontSize: 12 }}>{order.email}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {order.account_manager_name && (
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              AM: <strong style={{ color: "#f5c700" }}>{order.account_manager_name}</strong>
            </span>
          )}
          <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12,
            fontWeight: 800, background: statusMeta.bg, color: statusMeta.color }}>
            {statusMeta.label}
          </span>
          <span style={{ color: "#f5c700", fontSize: 22, fontWeight: 900 }}>
            {fmt(Number(order.total))}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
        padding: "20px 24px", marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 16px" }}>Order Status</p>
        <OrderStatusTimeline status={order.status} statusHistory={history} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
        {/* Items */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1", background: "#fafafa" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#0d0d0d" }}>
              Order Items ({items.length})
            </h2>
          </div>
          {items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", gap: 14, padding: "14px 18px",
              borderBottom: i < items.length - 1 ? "1px solid #f9f9f9" : "none",
              alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, background: "#f5f5f5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0 }}>
                📦
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", margin: "0 0 2px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>SKU: {item.sku}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 800, color: "#0d0d0d", margin: "0 0 2px", fontSize: 13 }}>
                  {fmt(item.price * item.quantity)}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                  {fmt(item.price)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#6b6b6b", margin: "0 0 14px" }}>Order Summary</p>
            {[
              { label: "Subtotal",  value: fmt(subtotal),                  color: "#9ca3af" },
              ...(discount > 0 ? [{ label: `Promo (${order.promo_code ?? ""})`,
                value: `-${fmt(discount)}`, color: "#22c55e" }] : []),
              { label: "Total",     value: fmt(Number(order.total)),        color: "#f5c700" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                padding: "6px 0", fontSize: 13,
                borderBottom: r.label === "Total" ? "none" : "1px solid #1a1a1a" }}>
                <span style={{ color: "#6b6b6b" }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
            padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 10px" }}>Order Details</p>
            {[
              { label: "Date",   value: new Date(order.created_at).toLocaleDateString("en-US",
                  { month: "long", day: "numeric", year: "numeric" }) },
              { label: "Status", value: statusMeta.label },
              { label: "Items",  value: String(items.length) },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                padding: "5px 0", fontSize: 12,
                borderBottom: "1px solid #f5f5f5" }}>
                <span style={{ color: "#9ca3af", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: "#0d0d0d" }}>{r.value}</span>
              </div>
            ))}
            {session.role === "admin" && (
              <div style={{ marginTop: 12 }}>
                <Link href={`/admin/orders/${order.id}`}
                  style={{ display: "block", textAlign: "center", padding: "8px 0",
                    background: "#0d0d0d", color: "#f5c700", borderRadius: 6,
                    fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Manage in Admin →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
