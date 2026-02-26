import Link from "next/link";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";

type OrderRow = { id: number; status: string; total: number; created_at: string; items: { name: string }[] };

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function OrderHistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await query<OrderRow>(
    `SELECT id, status, total, created_at, items FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.id]
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/account" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>← Account</Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Order History</h1>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px" }}>
        {orders.length === 0 ? (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "64px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No orders yet</p>
            <p style={{ color: "var(--color-muted)", marginBottom: 20 }}>When you place orders they&apos;ll show up here.</p>
            <Link href="/" style={{ padding: "9px 20px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700 }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map(order => {
              const items: { name: string }[] = Array.isArray(order.items) ? order.items : JSON.parse(order.items as unknown as string ?? "[]");
              const style = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
              return (
                <Link key={order.id} href={`/account/orders/${order.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "white", borderRadius: 8, border: "1px solid var(--color-border)",
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
                  }} className="order-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.id}</span>
                        <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: style.bg, color: style.color }}>
                          {order.status}
                        </span>
                      </div>
                      <p style={{ color: "var(--color-muted)", fontSize: 13, margin: 0 }}>
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {" · "}{items.length} item{items.length !== 1 ? "s" : ""}
                        {items.length > 0 && ` · ${items[0].name}${items.length > 1 ? ` +${items.length - 1} more` : ""}`}
                      </p>
                    </div>
                    <div className="order-row-right" style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{fmt(Number(order.total))}</p>
                      <p style={{ color: "var(--color-accent)", fontSize: 12, margin: "2px 0 0", fontWeight: 600 }}>View details →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
