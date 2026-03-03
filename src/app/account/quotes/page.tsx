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
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>My Quotes</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "4px 0 0" }}>Custom pricing proposals from our team</p>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 24, alignItems: "start" }}>

        {/* Sidebar */}
        <aside>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
                {session.firstName[0]}{session.lastName[0]}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{session.firstName} {session.lastName}</p>
              <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{session.email}</p>
            </div>
            <nav>
              {[
                { label: "Dashboard",     href: "/account" },
                { label: "Order History", href: "/account/orders" },
                { label: "My Quotes",     href: "/account/quotes" },
                { label: "Wishlists",     href: "/account/wishlist" },
                { label: "Profile",       href: "/account/profile" },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{ display: "block", padding: "11px 16px", fontSize: 14, color: item.href === "/account/quotes" ? "var(--color-accent)" : "var(--color-foreground)", textDecoration: "none", borderBottom: "1px solid var(--color-border)", fontWeight: item.href === "/account/quotes" ? 700 : 400, background: item.href === "/account/quotes" ? "#fff7ed" : "transparent" }}>
                  {item.label}{item.href === "/account/quotes" && pendingCount > 0 && (
                    <span style={{ marginLeft: 8, background: "#f97316", color: "white", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 9999 }}>{pendingCount}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
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
      </main>
    </div>
  );
}
