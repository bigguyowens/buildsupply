'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptQuoteAction, declineQuoteAction, placeQuoteOrderAction } from "@/app/actions/quotes";

const TAX_RATE   = 0.07;
const SHIP_FEE   = 29.99;
const SHIP_THRESH = 500;
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function Field({ label, name, placeholder, type = "text", required = true, span2 = false, defaultValue = "" }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean; span2?: boolean; defaultValue?: string;
}) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#374151" }}>
        {label}{required && <span style={{ color: "#f97316" }}> *</span>}
      </label>
      <input name={name} type={type} placeholder={placeholder} required={required} defaultValue={defaultValue}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
    </div>
  );
}

type QuoteItem = { product_name: string; product_sku: string; quantity: number; original_price: number; quoted_price: number };

export function QuoteActions({
  quoteId, status, items, expiresAt,
  userFirstName, userLastName, userEmail,
}: {
  quoteId: number;
  status: string;
  items: QuoteItem[];
  expiresAt: string | null;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [view, setView]       = useState<"idle" | "checkout" | "confirm_decline">("idle");
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + Number(i.quoted_price) * i.quantity, 0);
  const shipping = subtotal < SHIP_THRESH ? SHIP_FEE : 0;
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + shipping + tax;

  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  async function handleAccept() {
    setWorking(true); setError(null);
    const r = await acceptQuoteAction(quoteId);
    if (r.success) { router.refresh(); setView("checkout"); }
    else { setError(r.error ?? "Failed"); setWorking(false); }
  }

  async function handleDecline() {
    setWorking(true); setError(null);
    const r = await declineQuoteAction(quoteId);
    if (r.success) { router.refresh(); setView("idle"); }
    else { setError(r.error ?? "Failed"); setWorking(false); }
  }

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const shipping = {
      firstName: fd.get("firstName") as string,
      lastName:  fd.get("lastName")  as string,
      email:     fd.get("email")     as string,
      phone:     fd.get("phone")     as string,
      company:   fd.get("company")   as string,
      address:   fd.get("address")   as string,
      city:      fd.get("city")      as string,
      state:     fd.get("state")     as string,
      zip:       fd.get("zip")       as string,
      country:   fd.get("country")   as string,
    };
    const r = await placeQuoteOrderAction(quoteId, shipping);
    if (r.success) { router.push(`/order-confirmation/${r.orderId}`); }
    else { setError(r.error ?? "Failed"); setWorking(false); }
  }

  if (status === "declined") return (
    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: 20, textAlign: "center" }}>
      <p style={{ fontWeight: 700, color: "#be123c", margin: 0 }}>You declined this quote.</p>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>Contact us if you'd like to revisit this offer.</p>
    </div>
  );

  if (status === "accepted" && view !== "checkout") return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
      <p style={{ fontWeight: 700, color: "#15803d", fontSize: 15, margin: "0 0 12px" }}>✓ Quote Accepted</p>
      <button onClick={() => setView("checkout")} style={{ padding: "11px 24px", borderRadius: 8, background: "#f97316", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
        Proceed to Checkout →
      </button>
    </div>
  );

  if (view === "checkout" || status === "accepted") return (
    <form onSubmit={handleCheckout}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 20px" }}>Complete Your Order</h3>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="First Name" name="firstName" defaultValue={userFirstName} />
          <Field label="Last Name"  name="lastName"  defaultValue={userLastName} />
          <Field label="Email"      name="email"     type="email" defaultValue={userEmail} />
          <Field label="Phone"      name="phone"     required={false} />
          <Field label="Company"    name="company"   required={false} span2 />
          <Field label="Street Address" name="address" span2 />
          <Field label="City"   name="city" />
          <Field label="State"  name="state" />
          <Field label="ZIP"    name="zip" />
          <Field label="Country" name="country" defaultValue="United States" />
        </div>

        {/* Order total */}
        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 20, paddingTop: 16, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, marginBottom: 20 }}>
          {[
            { label: "Subtotal (quoted prices)", val: fmt(subtotal) },
            { label: `Shipping${subtotal >= SHIP_THRESH ? " (free)" : ""}`, val: shipping === 0 ? "Free" : fmt(shipping) },
            { label: "Tax (7%)", val: fmt(tax) },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>{r.label}</span><span>{r.val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>

        <button type="submit" disabled={working} style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: working ? "#9ca3af" : "#f97316", color: "white", border: "none", fontWeight: 700, fontSize: 15, cursor: working ? "not-allowed" : "pointer" }}>
          {working ? "Placing Order…" : `Place Order · ${fmt(total)}`}
        </button>
      </div>
    </form>
  );

  // Default: sent + not expired → action buttons
  if (status === "sent" && !isExpired) return (
    <div style={{ background: "white", border: "1px solid #fed7aa", borderRadius: 10, padding: 20, boxShadow: "0 0 0 3px #fff7ed" }}>
      <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 6px", color: "#0f172a" }}>Ready to respond to this quote?</p>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
        Accept to proceed to checkout at the quoted prices, or decline if you're not interested.
        {expiresAt && ` This quote expires ${new Date(expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`}
      </p>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {view === "confirm_decline" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: 0 }}>Are you sure you want to decline this quote?</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDecline} disabled={working} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#dc2626", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>Yes, Decline</button>
            <button onClick={() => setView("idle")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", fontWeight: 700, cursor: "pointer", color: "#374151" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleAccept} disabled={working} style={{ flex: 1, padding: "11px 0", borderRadius: 8, background: "#f97316", color: "white", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ✓ Accept Quote
          </button>
          <button onClick={() => setView("confirm_decline")} disabled={working} style={{ padding: "11px 20px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Decline
          </button>
        </div>
      )}
    </div>
  );

  return null;
}
