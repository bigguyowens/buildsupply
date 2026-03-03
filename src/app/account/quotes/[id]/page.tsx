import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { QuoteActions } from "./actions";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  sent:     { bg: "#dbeafe", color: "#1e40af" },
  accepted: { bg: "#dcfce7", color: "#15803d" },
  declined: { bg: "#fee2e2", color: "#991b1b" },
  expired:  { bg: "#fef9c3", color: "#854d0e" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

type QuoteRow = { id: number; status: string; created_at: string; expires_at: string | null; notes: string | null; order_id: number | null };
type QuoteItem = { id: number; product_name: string; product_sku: string; product_image: string; product_slug: string; quantity: number; original_price: number; quoted_price: number };

export default async function AccountQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const [quote] = await query<QuoteRow>(
    `SELECT id, status, created_at, expires_at, notes, order_id FROM quotes WHERE id=$1 AND customer_id=$2 AND status != 'draft'`,
    [Number(id), session.id]
  );
  if (!quote) notFound();

  const items = await query<QuoteItem>(`SELECT * FROM quote_items WHERE quote_id=$1 ORDER BY id`, [quote.id]);

  const listTotal   = items.reduce((s, i) => s + Number(i.original_price) * i.quantity, 0);
  const quotedTotal = items.reduce((s, i) => s + Number(i.quoted_price)   * i.quantity, 0);
  const savings     = listTotal - quotedTotal;
  const isExpired   = quote.expires_at && new Date(quote.expires_at) < new Date() && quote.status === "sent";
  const displayStatus = isExpired ? "expired" : quote.status;
  const ss = STATUS_STYLE[displayStatus] ?? STATUS_STYLE.sent;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Link href="/account/quotes" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>← My Quotes</Link>
            <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 10 }}>
              Quote #{quote.id}
              <span style={{ padding: "2px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: "uppercase", background: ss.bg, color: ss.color }}>
                {displayStatus}
              </span>
            </h1>
          </div>
          {savings > 0 && (
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 20px", textAlign: "center" }}>
              <p style={{ color: "#4ade80", fontWeight: 800, fontSize: 18, margin: 0 }}>{fmt(savings)}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, fontWeight: 600, textTransform: "uppercase" }}>You Save</p>
            </div>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Notes from team */}
          {quote.notes && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#92400e", margin: "0 0 8px" }}>Message from our team</p>
              <p style={{ fontSize: 14, color: "#78350f", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{quote.notes}</p>
            </div>
          )}

          {/* Line items */}
          <div style={{ background: "white", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Items in this Quote</h2>
            </div>

            {items.map((item, i) => {
              const lineSaving = (Number(item.original_price) - Number(item.quoted_price)) * item.quantity;
              const pct = Number(item.original_price) > 0
                ? ((Number(item.original_price) - Number(item.quoted_price)) / Number(item.original_price)) * 100 : 0;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0, position: "relative", background: "#f8fafc" }}>
                    <ProductImage src={item.product_image} alt={item.product_name} fill sizes="60px" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/products/${item.product_slug}`} style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", textDecoration: "none" }}>{item.product_name}</Link>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>
                      SKU: {item.product_sku || "—"} · Qty: {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                      {Number(item.original_price) !== Number(item.quoted_price) && (
                        <span style={{ fontSize: 13, color: "#94a3b8", textDecoration: "line-through" }}>{fmt(Number(item.original_price))}</span>
                      )}
                      <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{fmt(Number(item.quoted_price))}</span>
                      {pct !== 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: pct > 0 ? "#dcfce7" : "#fee2e2", color: pct > 0 ? "#15803d" : "#dc2626" }}>
                          {pct > 0 ? `-${pct.toFixed(0)}%` : `+${Math.abs(pct).toFixed(0)}%`}
                        </span>
                      )}
                    </div>
                    {lineSaving > 0 && <p style={{ fontSize: 11, color: "#15803d", fontWeight: 700, margin: "4px 0 0" }}>Save {fmt(lineSaving)}</p>}
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Line total: {fmt(Number(item.quoted_price) * item.quantity)}</p>
                  </div>
                </div>
              );
            })}

            {/* Total bar */}
            <div style={{ padding: "14px 20px", background: "#f8fafc", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: 32 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 3px" }}>List Total</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", textDecoration: "line-through", margin: 0 }}>{fmt(listTotal)}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 3px" }}>Your Price</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: "var(--color-foreground)", margin: 0 }}>{fmt(quotedTotal)}</p>
              </div>
            </div>
          </div>

          {/* Action panel */}
          {!isExpired && quote.status !== "declined" && !quote.order_id && (
            <QuoteActions
              quoteId={quote.id}
              status={quote.status}
              items={items}
              expiresAt={quote.expires_at}
              userFirstName={session.firstName}
              userLastName={session.lastName}
              userEmail={session.email}
            />
          )}

          {quote.order_id && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontWeight: 700, color: "#15803d", fontSize: 15, margin: 0 }}>✓ Order Placed!</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>This quote was converted to an order.</p>
              </div>
              <Link href={`/account/orders`} style={{ padding: "8px 18px", borderRadius: 8, background: "#15803d", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                View Order #{quote.order_id} →
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 10, border: "1px solid var(--color-border)", padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Quote Details</h3>
            {[
              { label: "Quote #", val: `#${quote.id}` },
              { label: "Received", val: new Date(quote.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
              { label: "Expires", val: quote.expires_at ? new Date(quote.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "No expiry" },
              { label: "Items", val: `${items.length} product${items.length !== 1 ? "s" : ""}` },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#15803d", margin: "0 0 8px" }}>💰 Your Savings</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#15803d", margin: "0 0 4px" }}>{fmt(savings)}</p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>compared to list price of {fmt(listTotal)}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
