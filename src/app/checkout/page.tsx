'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { placeOrderAction } from "@/app/actions/orders";

const TAX_RATE = 0.07;
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 29.99;
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

function Field({ label, name, placeholder, type = "text", required = true, colSpan2 = false }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean; colSpan2?: boolean;
}) {
  return (
    <div className={colSpan2 ? "checkout-span2" : ""} style={{ gridColumn: colSpan2 ? "span 2" : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 5, color: "var(--color-foreground)" }}>
        {label}{required && <span style={{ color: "var(--color-accent)" }}> *</span>}
      </label>
      <input
        name={name} type={type} placeholder={placeholder} required={required}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14,
          border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subtotal, shipping, tax, total } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shp = sub > 0 && sub < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    return { subtotal: sub, shipping: shp, tax: sub * TAX_RATE, total: sub + shp + sub * TAX_RATE };
  }, [items]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) return;
    setSubmitting(true);
    setError(null);

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
    const orderItems = items.map(i => ({
      id: i.id, name: i.name, slug: i.slug, image: i.image,
      price: i.price, quantity: i.quantity, sku: i.sku, brand: i.brand,
    }));

    const result = await placeOrderAction(orderItems, shipping, total);
    if (result.success) {
      clearCart();
      router.push(`/order-confirmation/${result.orderId}`);
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>Secure Checkout</p>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Complete Your Order</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <main className="checkout-layout" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

          {/* Left — forms */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "12px 16px", color: "#dc2626", fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Contact */}
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Contact Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="checkout-form-grid">
                <Field label="First Name" name="firstName" placeholder="Jane" />
                <Field label="Last Name"  name="lastName"  placeholder="Smith" />
                <Field label="Email"      name="email"     placeholder="jane@company.com" type="email" />
                <Field label="Phone"      name="phone"     placeholder="(555) 000-0000"   type="tel" required={false} />
                <Field label="Company / Organization" name="company" placeholder="ABC Contractors LLC" required={false} colSpan2 />
              </div>
            </div>

            {/* Shipping */}
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Shipping Address</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="checkout-form-grid">
                <Field label="Street Address" name="address" placeholder="123 Main St" colSpan2 />
                <Field label="City"    name="city"    placeholder="Atlanta" />
                <Field label="State"   name="state"   placeholder="GA" />
                <Field label="ZIP Code" name="zip"    placeholder="30301" />
                <Field label="Country" name="country" placeholder="United States" />
              </div>
            </div>

            {/* Payment placeholder */}
            <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Payment</h2>
              <div style={{ background: "#f9fafb", border: "1px solid var(--color-border)", borderRadius: 6, padding: "14px 16px", color: "var(--color-muted)", fontSize: 13 }}>
                💳 Payment integration ready — wire in Stripe or your preferred PSP
              </div>
            </div>
          </div>

          {/* Right — order summary */}
          <aside style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", position: "sticky", top: 24 }} className="checkout-aside">
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-muted)", margin: 0 }}>
                Order Summary ({items.length} item{items.length !== 1 ? "s" : ""})
              </h3>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Line items */}
              {items.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--color-muted)" }}>Your cart is empty.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {items.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative", width: 44, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                        <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="44px" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</p>
                        <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "2px 0 0" }}>Qty {item.quantity} × {fmt(item.price)}</p>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
                {[
                  { label: "Subtotal", value: fmt(subtotal) },
                  { label: "Shipping", value: shipping === 0 ? "Free" : fmt(shipping) },
                  { label: "Tax (7%)", value: fmt(tax) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", color: "var(--color-muted)" }}>
                    <span>{row.label}</span><span>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 2 }}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
                {shipping > 0 && (
                  <p style={{ fontSize: 11, color: "var(--color-muted)", margin: 0 }}>Add {fmt(SHIPPING_THRESHOLD - subtotal)} more for free shipping</p>
                )}
              </div>

              <button
                type="submit"
                disabled={items.length === 0 || submitting}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 6, border: "none",
                  background: items.length === 0 || submitting ? "#9ca3af" : "var(--color-accent)",
                  color: "white", fontWeight: 700, fontSize: 15,
                  cursor: items.length === 0 || submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Placing Order..." : "Place Order →"}
              </button>

              <Link href="/cart" style={{ display: "block", textAlign: "center", fontSize: 12, color: "var(--color-muted)", textDecoration: "none" }}>
                ← Back to Cart
              </Link>
            </div>
          </aside>

        </main>
      </form>
    </div>
  );
}
