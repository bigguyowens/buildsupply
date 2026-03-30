import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CRMScopeToggle } from "@/components/crm-scope-toggle";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string; border: string }> = {
  sent:     { label: "Sent",     color: "#1e40af", border: "#3b82f6" },
  accepted: { label: "Accepted", color: "#15803d", border: "#22c55e" },
  declined: { label: "Declined", color: "#991b1b", border: "#ef4444" },
};

type QuoteRow = {
  id: number; status: string; created_at: string; expires_at: string | null;
  notes: string | null; customer_id: number;
  first_name: string; last_name: string; email: string;
  item_count: number; total_quoted: number;
};

export default async function CRMQuotesPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { scope: scopeParam } = await searchParams;
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const scope     = scopeParam === "all" ? "all" : "mine";
  const showAll   = isAdmin || scope === "all";
  const id        = session.id;

  const scopeClause = showAll
    ? `q.status != 'draft'`
    : isManager
      ? `q.status != 'draft' AND u.account_manager_id IN (SELECT id FROM users WHERE id = ${id} OR manager_id = ${id})`
      : `q.status != 'draft' AND u.account_manager_id = ${id}`;

  const quotes = await query<QuoteRow>(
    `SELECT q.id, q.status, q.created_at, q.expires_at, q.notes,
            q.customer_id, u.first_name, u.last_name, u.email,
            COUNT(qi.id)::int AS item_count,
            COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS total_quoted
     FROM quotes q
     JOIN users u ON u.id = q.customer_id
     LEFT JOIN quote_items qi ON qi.quote_id = q.id
     WHERE ${scopeClause}
     GROUP BY q.id, u.id
     ORDER BY q.created_at DESC`
  );

  const pipeline = ["sent", "accepted", "declined"] as const;
  const grouped = Object.fromEntries(pipeline.map(s => [s, quotes.filter(q => q.status === s)]));
  const totalValue = quotes.filter(q => q.status === "accepted").reduce((s, q) => s + Number(q.total_quoted), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
            Quote Pipeline
          </h1>
          <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
            {grouped.sent?.length ?? 0} awaiting response · {fmt(totalValue)} accepted
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CRMScopeToggle sessionRole={session.role} currentScope={scope} />
          <Link href={isAdmin ? "/admin/quotes/new" : `/admin/quotes/new?am=${session.id}`}
          style={{ background: "#0d0d0d", color: "#f5c700", textDecoration: "none",
            borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontSize: 13 }}>
          + New Quote
        </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {pipeline.map(s => {
          const meta = STATUS_META[s];
          const cols = grouped[s] ?? [];
          const val  = cols.reduce((sum, q) => sum + Number(q.total_quoted), 0);
          return (
            <div key={s} style={{ background: "var(--crm-surface)", borderRadius: 10, padding: "14px 18px",
              border: "1px solid var(--crm-border)", borderTop: `3px solid ${meta.border}` }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "var(--crm-text)", margin: "0 0 2px" }}>
                {cols.length}
              </p>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: "0 0 2px" }}>
                {meta.label}
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: meta.color, margin: 0 }}>
                {fmt(val)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {pipeline.map(status => {
          const meta = STATUS_META[status];
          const cols = grouped[status] ?? [];
          return (
            <div key={status}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%",
                  background: meta.border, display: "inline-block" }} />
                <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "var(--crm-text)", margin: 0 }}>{meta.label}</h2>
                <span style={{ fontSize: 11, fontWeight: 700, background: "#f1f1f1",
                  color: "var(--crm-muted2)", borderRadius: 999, padding: "1px 8px" }}>{cols.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cols.length === 0 ? (
                  <div style={{ background: "var(--crm-surface2)", borderRadius: 8, border: "1px dashed #e5e5e5",
                    padding: 24, textAlign: "center", color: "#d1d5db", fontSize: 13 }}>
                    No {meta.label.toLowerCase()} quotes
                  </div>
                ) : cols.map(q => (
                  <Link key={q.id} href={`/crm/quotes/${q.id}`} style={{ textDecoration: "none" }}>
                    <div className="crm-quote-card" style={{ background: "var(--crm-surface)", borderRadius: 8,
                      border: "1px solid var(--crm-border)", padding: "14px 16px",
                      borderTop: `3px solid ${meta.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "var(--crm-text)" }}>
                          Quote #{q.id}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: "#f5c700" }}>
                          {fmt(Number(q.total_quoted))}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f5c700",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                          {q.first_name[0]}{q.last_name[0]}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text2)" }}>
                          {q.first_name} {q.last_name}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>
                        {q.item_count} item{q.item_count !== 1 ? "s" : ""} ·{" "}
                        {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {q.expires_at && ` · Exp ${new Date(q.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </p>
                      {q.notes && (
                        <p style={{ fontSize: 11, color: "var(--crm-muted)", margin: "6px 0 0",
                          fontStyle: "italic", borderTop: "1px solid var(--crm-border2)", paddingTop: 6 }}>
                          "{q.notes.slice(0, 60)}{q.notes.length > 60 ? "…" : ""}"
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
