import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { logoutAction } from "@/app/actions/auth";
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
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>My Account</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "4px 0 0" }}>
              Welcome back, {user.firstName}!
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                padding: "8px 18px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <main className="account-layout" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>

        {/* Mobile quick-nav (shows when sidebar is hidden) */}
        <div className="md:hidden" style={{ gridColumn: "1 / -1", display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {[
            { label: "Dashboard", href: "/account" },
            { label: "Orders",    href: "/account/orders" },
            { label: "Wishlists", href: "/account/wishlist" },
            { label: "Profile",   href: "/account/profile" },
            { label: "Shop",      href: "/products" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: "white", border: "1px solid var(--color-border)",
              color: "var(--color-foreground)", textDecoration: "none", whiteSpace: "nowrap",
            }}>{item.label}</Link>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="account-sidebar">
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: "var(--color-accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 18, marginBottom: 10,
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{user.firstName} {user.lastName}</p>
              <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{user.email}</p>
            </div>
            <nav>
              {[
                { label: "Dashboard",      href: "/account" },
                { label: "Order History",  href: "/account/orders" },
                { label: "My Quotes",      href: "/account/quotes" },
                { label: "Wishlists",      href: "/account/wishlist" },
                { label: "Profile",        href: "/account/profile" },
                { label: "Browse Products",href: "/products" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "block", padding: "11px 16px", fontSize: 14,
                    color: "var(--color-foreground)", textDecoration: "none",
                    borderBottom: "1px solid var(--color-border)",
                    transition: "background 0.1s",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 16px", fontSize: 14, fontWeight: 700,
                    color: "#f97316", textDecoration: "none",
                    background: "#fff7ed",
                    borderTop: "1px solid #fed7aa",
                  }}
                >
                  <span style={{ fontSize: 15 }}>▦</span> Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="account-stats">
            {[
              { label: "Total Orders",   value: orders.length },
              { label: "Pending",        value: orders.filter(o => o.status === "pending").length },
              { label: "Completed",      value: orders.filter(o => o.status === "completed").length },
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
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ color: "var(--color-muted)", marginBottom: 16 }}>You haven&apos;t placed any orders yet.</p>
                <Link
                  href="/products"
                  style={{
                    display: "inline-block", padding: "8px 20px", borderRadius: 6,
                    background: "var(--color-accent)", color: "white",
                    textDecoration: "none", fontWeight: 600, fontSize: 14,
                  }}
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <table className="orders-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
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
                      <td data-label="Order #" style={{ padding: "12px 16px", fontWeight: 600 }}>#{order.id}</td>
                      <td data-label="Date" style={{ padding: "12px 16px", color: "var(--color-muted)" }}>
                        {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td data-label="Items" style={{ padding: "12px 16px", color: "var(--color-muted)" }}>
                        {Array.isArray(order.items) ? order.items.length : 0} item{order.items?.length === 1 ? "" : "s"}
                      </td>
                      <td data-label="Total" style={{ padding: "12px 16px", fontWeight: 600 }}>
                        ${Number(order.total).toFixed(2)}
                      </td>
                      <td data-label="Status" style={{ padding: "12px 16px" }}>
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
      </main>
    </div>
  );
}
