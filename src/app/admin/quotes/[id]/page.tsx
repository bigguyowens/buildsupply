import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { SendQuoteButton } from "./send-button";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:    { bg: "#f1f5f9", color: "#475569", label: "Draft"    },
  sent:     { bg: "#dbeafe", color: "#1e40af", label: "Sent"     },
  accepted: { bg: "#dcfce7", color: "#15803d", label: "Accepted" },
  declined: { bg: "#fee2e2", color: "#991b1b", label: "Declined" },
  expired:  { bg: "#fef9c3", color: "#854d0e", label: "Expired"  },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

type QuoteRow = {
  id: number; status: string; created_at: string; updated_at: string;
  expires_at: string | null; notes: string | null; internal_notes: string | null;
  order_id: number | null;
  customer_id: number; customer_name: string; customer_email: string;
  created_by_name: string;
};
type QuoteItem = {
  id: number; product_name: string; product_sku: string; product_image: string;
  product_slug: string; quantity: number; original_price: number; quoted_price: number;
};

export default async function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [quote] = await query<QuoteRow>(`
    SELECT q.*,
      u.first_name || ' ' || u.last_name AS customer_name, u.email AS customer_email,
      a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    JOIN users a ON a.id = q.created_by_id
    WHERE q.id = $1
  `, [Number(id)]);

  if (!quote) notFound();

  const items = await query<QuoteItem>(`SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY id`, [quote.id]);

  const listTotal   = items.reduce((s, i) => s + Number(i.original_price) * i.quantity, 0);
  const quotedTotal = items.reduce((s, i) => s + Number(i.quoted_price)   * i.quantity, 0);
  const savings     = listTotal - quotedTotal;

  const ss = STATUS_STYLE[quote.status] ?? STATUS_STYLE.draft;
  const isExpired = quote.expires_at && new Date(quote.expires_at) < new Date() && quote.status === "sent";

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/quotes" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Quotes</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Quote #{quote.id}</h1>
          <span style={{ padding: "2px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: "uppercase", background: isExpired ? "#fef9c3" : ss.bg, color: isExpired ? "#854d0e" : ss.color }}>
            {isExpired ? "Expired" : ss.label}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          {quote.status === "draft" && (
            <SendQuoteButton quoteId={quote.id} />
          )}
          {quote.order_id && (
            <Link href={`/admin/orders/${quote.order_id}`} style={{ padding: "8px 18px", borderRadius: 8, background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              View Order #{quote.order_id} →
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* ── Left ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Line items */}
          <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Line Items</h2>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Product", "Qty", "List Price", "Quoted Price", "Line Total", "Saving"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const lineSaving = (Number(item.original_price) - Number(item.quoted_price)) * item.quantity;
                  const pct = Number(item.original_price) > 0 ? ((Number(item.original_price) - Number(item.quoted_price)) / Number(item.original_price)) * 100 : 0;
                  return (
                    <tr key={item.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0, position: "relative", background: "#f8fafc" }}>
                            <ProductImage src={item.product_image} alt={item.product_name} fill sizes="36px" />
                          </div>
                          <div>
                            <Link href={`/products/${item.product_slug}`} target="_blank" style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", textDecoration: "none" }}>{item.product_name}</Link>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>SKU: {item.product_sku || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{item.quantity}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>{fmt(Number(item.original_price))}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(Number(item.quoted_price))}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(Number(item.quoted_price) * item.quantity)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {lineSaving !== 0 && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: lineSaving > 0 ? "#dcfce7" : "#fee2e2", color: lineSaving > 0 ? "#15803d" : "#dc2626" }}>
                            {lineSaving > 0 ? "-" : "+"}{Math.abs(pct).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #f1f5f9", background: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: "12px 16px" }} />
                  <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8" }}>Quoted Total</td>
                  <td style={{ padding: "12px 16px", fontWeight: 800, fontSize: 15 }}>{fmt(quotedTotal)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {savings > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Saves {fmt(savings)}</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {(quote.notes || quote.internal_notes) && (
            <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Notes</h2>
              {quote.notes && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 6px" }}>Customer Message</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{quote.notes}</p>
                </div>
              )}
              {quote.internal_notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#92400e", margin: "0 0 6px" }}>🔒 Internal Notes</p>
                  <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{quote.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer */}
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Customer</h2>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{quote.customer_name}</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: "3px 0 12px" }}>{quote.customer_email}</p>
            <Link href={`/admin/customers/${quote.customer_id}`} style={{ fontSize: 12, color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
              View customer profile →
            </Link>
          </div>

          {/* Meta */}
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Details</h2>
            {[
              ["Created",   fmtDate(quote.created_at)],
              ["Updated",   fmtDate(quote.updated_at)],
              ["Created by", quote.created_by_name],
              ["Expires",   quote.expires_at ? fmtDate(quote.expires_at) : "No expiry"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>{label}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Value summary */}
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Value Summary</h2>
            {[
              { label: "List total",    val: fmt(listTotal),   style: {} },
              { label: "Quoted total",  val: fmt(quotedTotal), style: { fontWeight: 800 } },
              { label: "Customer saves", val: savings >= 0 ? fmt(savings) : `-${fmt(Math.abs(savings))}`, style: { color: savings >= 0 ? "#15803d" : "#dc2626", fontWeight: 700 } },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>{r.label}</span>
                <span style={r.style}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
