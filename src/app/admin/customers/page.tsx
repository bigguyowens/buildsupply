import { query } from "@/lib/db";
import Link from "next/link";

export default async function AdminCustomersPage() {
  const customers = await query<{
    id: number; first_name: string; last_name: string; email: string;
    role: string; created_at: string;
    order_count: number; total_spent: number;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(o.id)::int AS order_count,
            COALESCE(SUM(o.total),0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id ORDER BY u.created_at DESC`
  );

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Customers</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>{customers.length} registered users</p>
      </div>

      <div style={{ background: "var(--ad-surface)", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--ad-surface2)" }}>
              {["Customer", "Email", "Role", "Orders", "Total Spent", "Joined", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-muted2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderTop: "1px solid var(--ad-border2)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.role === "admin" ? "#f97316" : "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--ad-text)" }}>{c.first_name} {c.last_name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--ad-muted)" }}>{c.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c.role === "admin" ? "#fff7ed" : "#f1f5f9", color: c.role === "admin" ? "#f97316" : "#64748b" }}>
                    {c.role}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.order_count}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: c.total_spent > 0 ? "#0f172a" : "#94a3b8" }}>
                  ${Number(c.total_spent).toFixed(2)}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--ad-muted2)" }}>
                  {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link href={`/admin/customers/${c.id}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
