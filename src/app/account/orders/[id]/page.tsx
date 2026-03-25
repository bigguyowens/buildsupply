import Link from "next/link";
import Image from "next/image";
import { ProductImage } from "@/components/product-image";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { ReorderButton } from "@/components/reorder-button";
import { ReturnRequestForm } from "@/components/return-request-form";
import { getReturnForOrder } from "@/app/actions/returns";
import { OrderStatusTimeline } from "@/components/order-status-timeline";

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; brand: string; sku: string; slug: string };
type Shipping  = { firstName: string; lastName: string; email: string; phone: string; company: string; address: string; city: string; state: string; zip: string; country: string };
type OrderRow  = { id: number; status: string; total: number; created_at: string; items: OrderItem[]; shipping: Shipping; user_id: number; promo_code: string | null; discount_amount: number; status_history: { status: string; timestamp: string }[] };

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  processing: { bg: "#dbeafe", color: "#1e40af", label: "Processing" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6", label: "Shipped" },
  completed:  { bg: "#dcfce7", color: "#15803d", label: "Completed" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const TAX_RATE = 0.07;
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 29.99;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await query<OrderRow>(
    `SELECT id, status, total, created_at, items, shipping, user_id, promo_code, discount_amount, status_history FROM orders WHERE id = $1 AND user_id = $2`,
    [id, session.id]
  );
  if (!rows.length) notFound();
  const order = rows[0];
  const existingReturn = await getReturnForOrder(Number(id));

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : JSON.parse(order.items as unknown as string ?? "[]");
  const shipping: Shipping = typeof order.shipping === "object" ? order.shipping : JSON.parse(order.shipping as unknown as string ?? "{}");
  const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = Number(order.discount_amount ?? 0);
  const discountedSub = subtotal - discountAmount;
  const shippingCost = discountedSub < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const tax = discountedSub * TAX_RATE;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/account/orders" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>← Orders</Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Order #{order.id}</h1>
            <span style={{ padding: "3px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {["shipped", "completed"].includes(order.status) && !existingReturn && (
              <ReturnRequestForm orderId={order.id} items={items} />
            )}
            {existingReturn && (
              <span style={{ padding: "9px 16px", borderRadius: 7, background: "#fef9c3", border: "1px solid #fde047", fontSize: 12, fontWeight: 700, color: "#854d0e" }}>
                ↩ Return {existingReturn.status.charAt(0).toUpperCase() + existingReturn.status.slice(1)}
              </span>
            )}
            <ReorderButton items={items} />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Status timeline */}
        {order.status !== "cancelled" && (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "20px 24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-muted)", marginBottom: 24, marginTop: 0 }}>Order Status</h2>
            <OrderStatusTimeline
              status={order.status}
              statusHistory={Array.isArray(order.status_history) ? order.status_history : []}
            />
          </div>
        )}
        {order.status === "cancelled" && (
          <OrderStatusTimeline
            status={order.status}
            statusHistory={Array.isArray(order.status_history) ? order.status_history : []}
          />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Order info */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Order Details</h2>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Order #", `#${order.id}`],
                  ["Date", new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
                  ["Items", `${items.length} item${items.length !== 1 ? "s" : ""}`],
                  ["Total", fmt(Number(order.total))],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--color-muted)", fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: "8px 0", fontWeight: 600, textAlign: "right" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Shipping */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Ship To</h2>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{shipping.firstName} {shipping.lastName}</p>
              {shipping.company && <p style={{ margin: 0, color: "var(--color-muted)" }}>{shipping.company}</p>}
              <p style={{ margin: 0 }}>{shipping.address}</p>
              <p style={{ margin: 0 }}>{shipping.city}, {shipping.state} {shipping.zip}</p>
              <p style={{ margin: 0 }}>{shipping.country}</p>
              <p style={{ margin: "6px 0 0", color: "var(--color-muted)" }}>{shipping.email}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Items ({items.length})
            </h2>
          </div>
          <div style={{ padding: "0 20px" }}>
            {items.map((item, i) => (
              <div key={`${item.id}-${i}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ position: "relative", width: 60, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                  <ProductImage src={item.image} alt={item.name} fill sizes="60px" style={{ objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/products/${item.slug}`} style={{ fontWeight: 600, fontSize: 14, color: "var(--color-foreground)", textDecoration: "none" }}>
                    {item.name}
                  </Link>
                  <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{item.brand} · SKU: {item.sku}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{fmt(item.price * item.quantity)}</p>
                  <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>Qty {item.quantity} × {fmt(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals footer */}
          <div style={{ borderTop: "2px solid var(--color-border)", padding: "16px 20px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 220, fontSize: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)" }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d", fontWeight: 700 }}>
                  <span>Discount ({order.promo_code})</span>
                  <span>−{fmt(discountAmount)}</span>
                </div>
              )}
              {[
                ["Shipping", shippingCost === 0 ? "Free" : fmt(shippingCost)],
                ["Tax (7%)", fmt(tax)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)" }}>
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
                <span>Total</span><span>{fmt(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
