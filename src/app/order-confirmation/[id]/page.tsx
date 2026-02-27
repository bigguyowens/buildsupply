import Link from "next/link";
import Image from "next/image";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";

type OrderItem = { id: string; name: string; image: string; price: number; quantity: number; brand: string; sku: string };
type Shipping  = { firstName: string; lastName: string; email: string; phone: string; company: string; address: string; city: string; state: string; zip: string; country: string };
type OrderRow  = { id: number; status: string; total: number; created_at: string; items: OrderItem[]; shipping: Shipping; user_id: number | null; promo_code: string | null; discount_amount: number };

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const rows = await query<OrderRow>(
    `SELECT id, status, total, created_at, items, shipping, user_id, promo_code, discount_amount FROM orders WHERE id = $1`,
    [id]
  );
  if (!rows.length) notFound();
  const order = rows[0];

  // Only show to the order owner or a guest viewing their fresh confirmation
  // (for guests we allow it since they won't have a session — the URL is the "receipt")

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : JSON.parse(order.items as unknown as string ?? "[]");
  const shipping: Shipping = typeof order.shipping === "object" ? order.shipping : JSON.parse(order.shipping as unknown as string ?? "{}");
  const statusStyle = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
  const subtotal        = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount  = Number(order.discount_amount ?? 0);
  const isGuest = !order.user_id;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px" }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Order Confirmed</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "4px 0 0" }}>
            Thank you! Your order #{order.id} has been received.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Success banner */}
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>✅</span>
          <div>
            <p style={{ fontWeight: 700, margin: 0 }}>Order #{order.id} placed successfully!</p>
            <p style={{ color: "#166534", fontSize: 13, margin: "2px 0 0" }}>
              A confirmation will be sent to {shipping.email}
            </p>
          </div>
          <span style={{
            marginLeft: "auto", padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            background: statusStyle.bg, color: statusStyle.color,
          }}>
            {order.status}
          </span>
        </div>

        {/* Guest prompt — create account to track order */}
        {isGuest && !session && (
          <div style={{ background: "white", border: "2px solid var(--color-accent)", borderRadius: 8, padding: "20px 24px" }}>
            <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px" }}>💡 Want to track this order?</p>
            <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "0 0 16px" }}>
              Create a free account to view order history, track shipments, and re-order with one click.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/register" style={{
                padding: "8px 20px", borderRadius: 6, background: "var(--color-accent)",
                color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}>
                Create Account
              </Link>
              <Link href="/login" style={{
                padding: "8px 20px", borderRadius: 6, border: "1px solid var(--color-border)",
                color: "var(--color-foreground)", fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                Sign In
              </Link>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Order details */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Order Details</h2>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Order #", `#${order.id}`],
                  ["Date", new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
                  ["Status", order.status.charAt(0).toUpperCase() + order.status.slice(1)],
                  ["Subtotal", fmt(subtotal)],
                  ...(discountAmount > 0 ? [[`Promo (${order.promo_code})`, `−${fmt(discountAmount)}`]] : []),
                  ["Total", fmt(Number(order.total))],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 0", color: "var(--color-muted)", fontWeight: 500 }}>{label}</td>
                    <td style={{ padding: "8px 0", fontWeight: label === `Promo (${order.promo_code})` ? 700 : 600, color: label === `Promo (${order.promo_code})` ? "#15803d" : undefined, textAlign: "right" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Shipping info */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 20 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Ship To</h2>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--color-foreground)" }}>
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
              Items Ordered ({items.length})
            </h2>
          </div>
          <div style={{ padding: "0 20px" }}>
            {items.map((item, i) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ position: "relative", width: 56, height: 56, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                  <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="56px" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{item.name}</p>
                  <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{item.brand} · SKU: {item.sku}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{fmt(item.price * item.quantity)}</p>
                  <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>Qty {item.quantity} × {fmt(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          {session && (
            <Link href="/account/orders" style={{ padding: "10px 20px", borderRadius: 6, border: "1px solid var(--color-border)", color: "var(--color-foreground)", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
              View Order History
            </Link>
          )}
          <Link href="/" style={{ padding: "10px 20px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Continue Shopping
          </Link>
        </div>

      </main>
    </div>
  );
}
