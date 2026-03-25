import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "#f1f5f9", color: "#475569" },
  sent:     { bg: "#dbeafe", color: "#1e40af" },
  accepted: { bg: "#dcfce7", color: "#15803d" },
  declined: { bg: "#fee2e2", color: "#991b1b" },
  expired:  { bg: "#fef9c3", color: "#854d0e" },
};

export default async function AccountQuotesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const quotes = await query<{
    id: number; status: string; created_at: string; expires_at: string | null;
    item_count: number; total_quoted: number; order_id: number | null;
  }>(`
    SELECT q.id, q.status, q.created_at, q.expires_at, q.order_id,
      COUNT(qi.id)::int AS item_count,
      COALESCE(SUM(qi.quantity * qi.quoted_price), 0) AS total_quoted
    FROM quotes q
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE q.customer_id = $1 AND q.status != 'draft'
    GROUP BY q.id
    ORDER BY q.created_at DESC
  `, [session.id]);

  const pendingCount = quotes.filter(q => q.status === "sent").length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Quotes</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "4px 0 0" }}>Custom pricing proposals from our team</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {quotes.length === 0 ? (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
            <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>No quotes yet</p>
            <p style={{ color: "var(--color-muted)", fontSize: 14 }}>Contact us to request custom pricing for large orders.</p>
          </div>
        ) : quotes.map(q => {
            const ss = STATUS_STYLE[q.status] ?? STATUS_STYLE.sent;
            const isExpired = q.expires_at && new Date(q.expires_at) < new Date() && q.status === "sent";
            const actionNeeded = q.status === "sent" && !isExpired;
            return (
              <Link key={q.id} href={`/account/quotes/${q.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  background: "white", borderRadius: 8, border: `1px solid ${actionNeeded ? "#fed7aa" : "var(--color-border)"}`,
                  padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  boxShadow: actionNeeded ? "0 0 0 2px #fff7ed" : "none",
                  transition: "box-shadow 0.15s",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Quote #{q.id}</span>
                      <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: isExpired ? "#fef9c3" : ss.bg, color: isExpired ? "#854d0e" : ss.color }}>
                        {isExpired ? "Expired" : q.status}
                      </span>
                      {actionNeeded && (
                        <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}>
                          Action Required
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "var(--color-muted)", margin: 0 }}>
                      {q.item_count} item{q.item_count !== 1 ? "s" : ""} ·
                      Received {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {q.expires_at && ` · Expires ${new Date(q.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                    {q.order_id && <p style={{ fontSize: 12, color: "#15803d", fontWeight: 700, margin: "4px 0 0" }}>✓ Converted to Order #{q.order_id}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>${Number(q.total_quoted).toFixed(2)}</p>
                    <p style={{ fontSize: 12, color: "#f97316", fontWeight: 700, margin: 0 }}>View details →</p>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
