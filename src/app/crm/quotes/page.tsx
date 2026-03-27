import { query } from "@/lib/db";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: "Draft",    bg: "#f1f5f9", color: "#475569" },
  sent:     { label: "Sent",     bg: "#dbeafe", color: "#1e40af" },
  accepted: { label: "Accepted", bg: "#dcfce7", color: "#15803d" },
  declined: { label: "Declined", bg: "#fee2e2", color: "#991b1b" },
};

export default async function CRMQuotesPage() {
  const quotes = await query<{
    id: number; status: string; created_at: string; expires_at: string | null;
    notes: string | null; customer_id: number;
    first_name: string; last_name: string; email: string;
    item_count: number; total_quoted: number;
  }>(`
    SELECT q.id, q.status, q.created_at, q.expires_at, q.notes,
           q.customer_id,
           u.first_name, u.last_name, u.email,
           COUNT(qi.id)::int AS item_count,
           COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS total_quoted
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    LEFT JOIN quote_items qi ON qi.quote_id = q.id
    WHERE q.status != 'draft'
    GROUP BY q.id, u.id
    ORDER BY q.created_at DESC
  `);

  const pipeline = ["sent", "accepted", "declined"];
  const grouped = Object.fromEntries(pipeline.map(s => [s, quotes.filter(q => q.status === s)]));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
            Quote Pipeline
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
            {quotes.length} quotes total · {grouped.sent?.length ?? 0} awaiting response
          </p>
        </div>
        <Link href="/admin/quotes" style={{ background: "#0d0d0d", color: "#f5c700", textDecoration: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontSize: 13 }}>
          + Create Quote (Admin)
        </Link>
      </div>

      {/* Kanban-style columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {pipeline.map(status => {
          const meta = STATUS_META[status];
          const cols = grouped[status] ?? [];
          return (
            <div key={status}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>{meta.label}</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f1f1", color: "#9ca3af",
                  borderRadius: 999, padding: "1px 8px" }}>{cols.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cols.length === 0 ? (
                  <div style={{ background: "#f9f9f9", borderRadius: 8, border: "1px dashed #e5e5e5",
                    padding: "24px", textAlign: "center", color: "#d1d5db", fontSize: 13 }}>
                    No {meta.label.toLowerCase()} quotes
                  </div>
                ) : cols.map(q => (
                  <div key={q.id} style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e5e5",
                    padding: "14px 16px", borderTop: `3px solid ${meta.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Link href={`/admin/quotes/${q.id}`}
                        style={{ fontWeight: 800, fontSize: 14, color: "#0d0d0d", textDecoration: "none" }}>
                        Quote #{q.id}
                      </Link>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#f5c700" }}>
                        {fmt(Number(q.total_quoted))}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f5c700",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                        {q.first_name[0]}{q.last_name[0]}
                      </div>
                      <Link href={`/crm/customers/${q.customer_id}`}
                        style={{ fontSize: 12, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                        {q.first_name} {q.last_name}
                      </Link>
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>
                      {q.item_count} item{q.item_count !== 1 ? "s" : ""} ·{" "}
                      {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {q.expires_at && ` · Expires ${new Date(q.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                    {q.notes && <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0",
                      fontStyle: "italic", borderTop: "1px solid #f5f5f5", paddingTop: 6 }}>
                      "{q.notes.slice(0, 60)}{q.notes.length > 60 ? "…" : ""}"
                    </p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
