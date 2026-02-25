import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminRoleToggle } from "@/components/admin-role-toggle";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
};

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [customer] = await query<{
    id: number; first_name: string; last_name: string; email: string;
    role: string; created_at: string; updated_at: string;
  }>("SELECT id, first_name, last_name, email, role, created_at, updated_at FROM users WHERE id = $1", [Number(id)]);

  if (!customer) notFound();

  const [orders, wishlists] = await Promise.all([
    query<{ id: number; status: string; total: number; created_at: string; item_count: number }>(
      `SELECT id, status, total, created_at, jsonb_array_length(items) AS item_count
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [customer.id]
    ),
    query<{ name: string; item_count: number }>(
      `SELECT w.name, COUNT(wi.id)::int AS item_count
       FROM wishlists w LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
       WHERE w.user_id = $1 GROUP BY w.id ORDER BY w.created_at ASC`,
      [customer.id]
    ),
  ]);

  const totalSpent = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);

  const field = (label: string, value: string) => (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", margin: "0 0 3px" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#0f172a" }}>{value || "—"}</p>
    </div>
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/customers" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Customers</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{customer.first_name} {customer.last_name}</h1>
        <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: customer.role === "admin" ? "#fff7ed" : "#f1f5f9", color: customer.role === "admin" ? "#f97316" : "#64748b" }}>
          {customer.role}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>

        {/* Left: profile + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>
                {customer.first_name[0]}{customer.last_name[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>{customer.first_name} {customer.last_name}</p>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "2px 0 0" }}>{customer.email}</p>
              </div>
            </div>
            {field("Member Since", new Date(customer.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}
            {field("Last Updated", new Date(customer.updated_at ?? customer.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Orders", value: orders.length },
              { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
              { label: "Avg Order",   value: orders.length ? `$${(totalSpent / orders.filter(o=>o.status!=="cancelled").length || 0).toFixed(2)}` : "$0" },
              { label: "Wishlists",   value: wishlists.length },
            ].map(s => (
              <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Wishlists */}
          {wishlists.length > 0 && (
            <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Wishlists</h2>
              {wishlists.map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{w.item_count} item{w.item_count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Role management */}
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Admin Access</h2>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>Grants full access to the admin panel</p>
            <AdminRoleToggle userId={customer.id} currentRole={customer.role} />
          </div>
        </div>

        {/* Right: order history */}
        <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", alignSelf: "start" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Order History</h2>
          </div>
          {orders.length === 0 ? (
            <p style={{ padding: "32px 20px", color: "#94a3b8", textAlign: "center", fontSize: 14 }}>No orders yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Order", "Date", "Items", "Total", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
                  return (
                    <tr key={o.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>#{o.id}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{o.item_count}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>${Number(o.total).toFixed(2)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: sc.bg, color: sc.color }}>{o.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/admin/orders/${o.id}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
