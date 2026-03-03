import { query } from "@/lib/db";
import Link from "next/link";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "#f1f5f9", color: "#475569" },
  sent:     { bg: "#dbeafe", color: "#1e40af" },
  accepted: { bg: "#dcfce7", color: "#15803d" },
  declined: { bg: "#fee2e2", color: "#991b1b" },
  expired:  { bg: "#fef9c3", color: "#854d0e" },
};

type QuoteRow = {
  id: number; status: string; created_at: string; expires_at: string | null;
  customer_name: string; customer_email: string;
  item_count: number; total_quoted: number; order_id: number | null;
};

export default async function AdminQuotesPage() {
  const quotes = await query<QuoteRow>(`
    SELECT
      q.id, q.status, q.created_at, q.expires_at, q.order_id,
      u.first_name || ' ' || u.last_name AS customer_name,
      u.email AS customer_email,
      COUNT(qi.id)::int AS item_count,
      COALESCE(SUM(qi.quantity * qi.quoted_price), 0) AS total_quoted
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    GROUP BY q.id, u.first_name, u.last_name, u.email
    ORDER BY q.created_at DESC
  `);

  const counts = {
    all:      quotes.length,
    draft:    quotes.filter(q => q.status === "draft").length,
    sent:     quotes.filter(q => q.status === "sent").length,
    accepted: quotes.filter(q => q.status === "accepted").length,
    declined: quotes.filter(q => q.status === "declined").length,
  };

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Quotes</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Custom pricing proposals for customers</p>
        </div>
        <Link href="/admin/quotes/new" style={{
          padding: "9px 18px", borderRadius: 8, background: "#f97316", color: "white",
          fontWeight: 700, fontSize: 14, textDecoration: "none",
        }}>
          + New Quote
        </Link>
      </div>

      {/* Status summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total",    value: counts.all,      color: "#0f172a" },
          { label: "Draft",    value: counts.draft,    color: "#475569" },
          { label: "Sent",     value: counts.sent,     color: "#1e40af" },
          { label: "Accepted", value: counts.accepted, color: "#15803d" },
          { label: "Declined", value: counts.declined, color: "#991b1b" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {quotes.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 0 16px" }}>No quotes yet</p>
            <Link href="/admin/quotes/new" style={{ color: "#f97316", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Create your first quote →</Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Quote #", "Customer", "Items", "Total Value", "Status", "Expires", "Order", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => {
                const ss = STATUS_STYLE[q.status] ?? STATUS_STYLE.draft;
                const isExpired = q.expires_at && new Date(q.expires_at) < new Date() && q.status === "sent";
                return (
                  <tr key={q.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0f172a" }}>#{q.id}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{q.customer_name}</p>
                      <p style={{ color: "#94a3b8", fontSize: 11, margin: "2px 0 0" }}>{q.customer_email}</p>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{q.item_count}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>${Number(q.total_quoted).toFixed(2)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: isExpired ? "#fef9c3" : ss.bg, color: isExpired ? "#854d0e" : ss.color }}>
                        {isExpired ? "expired" : q.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                      {q.expires_at ? new Date(q.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {q.order_id
                        ? <Link href={`/admin/orders/${q.order_id}`} style={{ color: "#f97316", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>#{q.order_id}</Link>
                        : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/admin/quotes/${q.id}`} style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
