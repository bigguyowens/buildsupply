import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

type Order = {
  id: number;
  status: string;
  total: number;
  created_at: string;
  items: { name: string; quantity: number; price: number }[];
};

export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const orders = await query<Order>(
    `SELECT id, status, total, created_at, items FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [user.id]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Orders",  value: orders.length },
          { label: "Pending",       value: orders.filter(o => o.status === "pending").length },
          { label: "Completed",     value: orders.filter(o => o.status === "completed").length },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "20px 24px" }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>{stat.value}</p>
            <p style={{ fontSize: 13, color: "var(--color-muted)", margin: "4px 0 0" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
          <Link href="/account/orders" style={{ fontSize: 13, color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>
            View all →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>You haven&apos;t placed any orders yet.</p>
            <Link href="/products" style={{
              display: "inline-block", padding: "8px 20px", borderRadius: 6,
              background: "var(--color-accent)", color: "white",
              textDecoration: "none", fontWeight: 600, fontSize: 14,
            }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "#f9fafb" }}>
                {["Order #", "Date", "Items", "Total", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    <Link href={`/account/orders/${order.id}`} style={{ color: "var(--color-accent)", textDecoration: "none" }}>#{order.id}</Link>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-muted)" }}>
                    {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-muted)" }}>
                    {Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length === 1 ? "" : "s"}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                      background: order.status === "completed" ? "#dcfce7" : order.status === "pending" ? "#fef9c3" : "#f3f4f6",
                      color: order.status === "completed" ? "#16a34a" : order.status === "pending" ? "#854d0e" : "#6b7280",
                    }}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
