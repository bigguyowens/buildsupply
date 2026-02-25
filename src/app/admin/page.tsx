import { query } from "@/lib/db";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

export default async function AdminDashboard() {
  const [revenueRow, ordersRow, customersRow, statusRows, recentOrders, lowStock] = await Promise.all([
    query<{ total: number }>("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status != 'cancelled'"),
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM orders"),
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'"),
    query<{ status: string; count: number }>("SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC"),
    query<{ id: number; status: string; total: number; created_at: string; first_name: string; last_name: string }>(
      `SELECT o.id, o.status, o.total, o.created_at, u.first_name, u.last_name
       FROM orders o LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 8`
    ),
    query<{ id: string; name: string; inventory: number; category: string }>(
      "SELECT id, name, inventory, category FROM products WHERE inventory < 20 AND inventory > 0 ORDER BY inventory ASC LIMIT 8"
    ),
  ]);

  const revenue   = Number(revenueRow[0]?.total ?? 0);
  const orders    = ordersRow[0]?.count ?? 0;
  const customers = customersRow[0]?.count ?? 0;
  const avgOrder  = orders > 0 ? revenue / orders : 0;

  const stats = [
    { label: "Total Revenue",   value: fmt(revenue),          sub: "excl. cancelled",    color: "#10b981" },
    { label: "Total Orders",    value: orders.toLocaleString(), sub: "all time",           color: "#3b82f6" },
    { label: "Customers",       value: customers.toLocaleString(), sub: "registered",     color: "#8b5cf6" },
    { label: "Avg. Order Value", value: fmt(avgOrder),         sub: "excl. cancelled",    color: "#f97316" },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 8px" }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Order status breakdown */}
        <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Orders by Status</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {statusRows.map(row => {
              const style = STATUS_COLORS[row.status] ?? { bg: "#f3f4f6", color: "#6b7280" };
              const pct = orders > 0 ? (row.count / orders) * 100 : 0;
              return (
                <div key={row.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: style.bg, color: style.color }}>
                      {row.status}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.count}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: style.color, borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low stock alerts */}
        <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>⚠ Low Stock Alerts</h2>
            <Link href="/admin/products" style={{ fontSize: 12, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>All products are well stocked.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lowStock.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#0f172a" }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{p.category}</p>
                  </div>
                  <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 700, background: p.inventory <= 5 ? "#fee2e2" : "#fef9c3", color: p.inventory <= 5 ? "#991b1b" : "#854d0e" }}>
                    {p.inventory} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize: 12, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>View All →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Order", "Customer", "Date", "Total", "Status", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => {
              const style = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
              return (
                <tr key={o.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>#{o.id}</td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{o.first_name ? `${o.first_name} ${o.last_name}` : "Guest"}</td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>${Number(o.total).toFixed(2)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: style.bg, color: style.color }}>{o.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link href={`/admin/orders/${o.id}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>View →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
