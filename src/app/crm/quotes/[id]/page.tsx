import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { getCRMTasks } from "@/app/actions/crm";

const fmt     = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  draft:    { label: "Draft",    bg: "#f1f5f9", color: "#475569", border: "#94a3b8" },
  sent:     { label: "Sent",     bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" },
  accepted: { label: "Accepted", bg: "#dcfce7", color: "#15803d", border: "#22c55e" },
  declined: { label: "Declined", bg: "#fee2e2", color: "#991b1b", border: "#ef4444" },
  expired:  { label: "Expired",  bg: "#fef9c3", color: "#854d0e", border: "#f59e0b" },
};

type QuoteRow = {
  id: number; status: string; created_at: string; updated_at: string;
  expires_at: string | null; notes: string | null; internal_notes: string | null;
  order_id: number | null; customer_id: number;
  customer_name: string; customer_email: string;
  customer_am_id: number | null;
  created_by_name: string;
};
type QuoteItem = {
  id: number; product_name: string; product_sku: string;
  product_image: string; product_slug: string;
  quantity: number; original_price: number; quoted_price: number;
};

export default async function CRMQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await query<QuoteRow>(`
    SELECT q.*,
           u.first_name || ' ' || u.last_name AS customer_name,
           u.email AS customer_email,
           u.account_manager_id AS customer_am_id,
           a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    JOIN users a ON a.id = q.created_by_id
    WHERE q.id = $1
  `, [Number(id)]);

  if (!rows.length) notFound();
  const quote = rows[0];

  // AMs can only view quotes for their assigned customers
  if (session.role === "account_manager" && quote.customer_am_id !== session.id) {
    redirect("/crm/quotes");
  }

  const items = await query<QuoteItem>(
    `SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY id`,
    [quote.id]
  );

  // Fetch auto-generated follow-up tasks for this quote
  const allTasks = await getCRMTasks({ entityType: "customer", entityId: quote.customer_id }).catch(() => []);
  const followUpTasks = allTasks.filter(t => t.title.includes(`#${quote.id}`));

  const listTotal   = items.reduce((s, i) => s + Number(i.original_price) * i.quantity, 0);
  const quotedTotal = items.reduce((s, i) => s + Number(i.quoted_price)   * i.quantity, 0);
  const savings     = listTotal - quotedTotal;
  const isExpired   = quote.expires_at && new Date(quote.expires_at) < new Date() && quote.status === "sent";
  const statusKey   = isExpired ? "expired" : quote.status;
  const meta        = STATUS_META[statusKey] ?? STATUS_META.draft;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/quotes" style={{ color: "#9ca3af", textDecoration: "none" }}>Quote Pipeline</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "#0d0d0d", fontWeight: 700 }}>Quote #{quote.id}</span>
      </div>

      {/* Header bar */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "20px 24px",
        marginBottom: 24, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: 0,
                letterSpacing: "-0.02em" }}>Quote #{quote.id}</h1>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999,
                textTransform: "uppercase", background: meta.bg, color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <p style={{ color: "#6b6b6b", fontSize: 13, margin: 0 }}>
              {quote.customer_name} · {quote.customer_email}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Items",        value: items.length },
            { label: "List Total",   value: fmt(listTotal) },
            { label: "Quoted Total", value: fmt(quotedTotal) },
            { label: "Customer Saves", value: savings > 0 ? fmt(savings) : "—" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: "#f5c700", fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#6b6b6b", fontSize: 10, margin: 0, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>

        {/* Left: line items + notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Line items */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", background: "#0d0d0d" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Line Items</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  {["Product", "Qty", "List Price", "Quoted", "Line Total", "Saving"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10,
                      fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                      color: "#9ca3af" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const lineSaving = (Number(item.original_price) - Number(item.quoted_price)) * item.quantity;
                  const pct = Number(item.original_price) > 0
                    ? ((Number(item.original_price) - Number(item.quoted_price)) / Number(item.original_price)) * 100 : 0;
                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden",
                            border: "1px solid #e5e5e5", flexShrink: 0, position: "relative",
                            background: "#f9f9f9" }}>
                            <ProductImage src={item.product_image} alt={item.product_name} fill sizes="36px" />
                          </div>
                          <div>
                            <Link href={`/products/${item.product_slug}`} target="_blank"
                              style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", textDecoration: "none" }}>
                              {item.product_name}
                            </Link>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "1px 0 0" }}>
                              SKU: {item.product_sku || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6b7280" }}>{item.quantity}</td>
                      <td style={{ padding: "12px 16px", color: "#9ca3af", textDecoration: "line-through" }}>
                        {fmt(Number(item.original_price))}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d0d0d" }}>
                        {fmt(Number(item.quoted_price))}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#f5c700" }}>
                        {fmt(Number(item.quoted_price) * item.quantity)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {lineSaving > 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px",
                            borderRadius: 4, background: "#dcfce7", color: "#15803d" }}>
                            -{Math.abs(pct).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #f1f1f1", background: "#0d0d0d" }}>
                  <td colSpan={4} style={{ padding: "12px 16px" }} />
                  <td colSpan={2} style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6b6b6b",
                        textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#f5c700" }}>
                        {fmt(quotedTotal)}
                      </span>
                      {savings > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#22c55e",
                          background: "#f0fdf4", padding: "3px 8px", borderRadius: 4 }}>
                          Saves {fmt(savings)}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {(quote.notes || quote.internal_notes) && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", padding: 20 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 14px" }}>Notes</h2>
              {quote.notes && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                    textTransform: "uppercase", margin: "0 0 6px" }}>Customer Note</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0,
                    whiteSpace: "pre-wrap" }}>{quote.notes}</p>
                </div>
              )}
              {quote.internal_notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a",
                  borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e",
                    textTransform: "uppercase", margin: "0 0 6px" }}>🔒 Internal Notes</p>
                  <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6, margin: 0,
                    whiteSpace: "pre-wrap" }}>{quote.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: customer + details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Customer card */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Customer</h2>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f5c700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                  {quote.customer_name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0d0d0d" }}>
                    {quote.customer_name}
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>{quote.customer_email}</p>
                </div>
              </div>
              <Link href={`/crm/customers/${quote.customer_id}`}
                style={{ display: "block", fontSize: 12, color: "#f5c700", fontWeight: 700,
                  textDecoration: "none", marginBottom: 8 }}>
                View Customer 360 →
              </Link>
              {session.role === "admin" && (
                <Link href={`/admin/quotes/${quote.id}`}
                  style={{ display: "block", fontSize: 12, color: "#6b7280", fontWeight: 600,
                    textDecoration: "none" }}>
                  Edit in Admin →
                </Link>
              )}
            </div>
          </div>

          {/* Quote details */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Details</h2>
            </div>
            <div style={{ padding: 16 }}>
              {[
                { label: "Created",     value: fmtDate(quote.created_at) },
                { label: "Created by",  value: quote.created_by_name },
                { label: "Expires",     value: quote.expires_at ? fmtDate(quote.expires_at) : "No expiry" },
                { label: "Status",      value: meta.label },
                ...(quote.order_id ? [{ label: "Converted to", value: `Order #${quote.order_id}` }] : []),
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                  <span style={{ color: "#9ca3af", fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: "#0d0d0d" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value summary */}
          <div style={{ background: "#0d0d0d", borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#6b6b6b", margin: "0 0 12px" }}>Value Summary</p>
            {[
              { label: "List Total",     value: fmt(listTotal),   color: "#6b6b6b" },
              { label: "Quoted Total",   value: fmt(quotedTotal), color: "#f5c700" },
              { label: "Customer Saves", value: savings > 0 ? fmt(savings) : "—", color: "#22c55e" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                padding: "6px 0", fontSize: 13 }}>
                <span style={{ color: "#6b6b6b", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Follow-up tasks */}
          {followUpTasks.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#0d0d0d",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Auto Follow-up Tasks</h2>
                <span style={{ fontSize: 11, color: "#6b6b6b", fontWeight: 600 }}>
                  {followUpTasks.filter(t => t.status === "complete").length}/{followUpTasks.length} done
                </span>
              </div>
              <div>
                {followUpTasks
                  .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
                  .map((t, i) => {
                    const isComplete = t.status === "complete";
                    const isOverdue  = t.due_date && t.due_date < new Date().toISOString().split("T")[0] && !isComplete;
                    return (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        borderBottom: i < followUpTasks.length - 1 ? "1px solid #f5f5f5" : "none",
                        opacity: isComplete ? 0.5 : 1,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: isComplete ? "#22c55e" : isOverdue ? "#ef4444" : "#f5c700",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: "#0d0d0d", margin: 0,
                            textDecoration: isComplete ? "line-through" : "none",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.title.replace(`Quote #${quote.id} — `, "")}
                          </p>
                          {t.due_date && (
                            <p style={{ fontSize: 11, margin: 0,
                              color: isOverdue ? "#ef4444" : "#9ca3af", fontWeight: isOverdue ? 700 : 400 }}>
                              {isOverdue ? "⚠ " : ""}
                              {new Date(t.due_date + "T00:00:00").toLocaleDateString("en-US",
                                { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ padding: "10px 14px", background: "#f9f9f9", borderTop: "1px solid #f1f1f1" }}>
                <Link href="/crm/tasks" style={{ fontSize: 12, color: "#f5c700",
                  fontWeight: 700, textDecoration: "none" }}>
                  Manage all tasks →
                </Link>
              </div>
            </div>
          )}

          {!followUpTasks.length && quote.expires_at && quote.status === "sent" && (
            <div style={{ background: "#f9f9f9", borderRadius: 10, padding: "14px 16px",
              border: "1px dashed #e5e5e5", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                No auto-tasks generated — quote may have been sent before expiry was set.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
