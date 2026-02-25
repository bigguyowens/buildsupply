'use client';

import { useState } from "react";
import Link from "next/link";

const REASONS = [
  "General Inquiry",
  "Open an Account",
  "Order Support",
  "Product Availability",
  "Bulk / Volume Pricing",
  "Returns & Exchanges",
  "Billing Question",
  "Other",
];

const OFFICES = [
  {
    city: "Phoenix, AZ",
    label: "Headquarters & Distribution",
    address: "4820 W McDowell Rd, Phoenix, AZ 85035",
    phone: "(602) 555-0180",
    hours: "Mon–Fri 6am–6pm · Sat 7am–3pm",
    mapUrl: "https://maps.google.com/?q=4820+W+McDowell+Rd+Phoenix+AZ",
  },
  {
    city: "Dallas, TX",
    label: "Regional Distribution",
    address: "2310 Merritt Dr, Garland, TX 75041",
    phone: "(972) 555-0241",
    hours: "Mon–Fri 7am–5pm",
    mapUrl: "https://maps.google.com/?q=2310+Merritt+Dr+Garland+TX",
  },
  {
    city: "Atlanta, GA",
    label: "Regional Distribution",
    address: "1640 Marietta Blvd NW, Atlanta, GA 30318",
    phone: "(404) 555-0193",
    hours: "Mon–Fri 7am–5pm",
    mapUrl: "https://maps.google.com/?q=1640+Marietta+Blvd+NW+Atlanta+GA",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", reason: REASONS[0], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch { setStatus("error"); }
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 6,
    border: "1px solid #e2e8f0", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit",
    transition: "border-color 0.15s",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6 };

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={{ background: "var(--color-primary)", borderBottom: "4px solid var(--color-accent)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>Get in Touch</p>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "white", margin: "0 0 14px", lineHeight: 1.1 }}>
            We&apos;re here to help
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 500, margin: 0, lineHeight: 1.7 }}>
            Whether you&apos;re opening an account, tracking an order, or need to talk product specs — our team responds within one business day.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "1fr 440px", gap: 48, alignItems: "start" }}>

        {/* ── Contact Form ───────────────────────────── */}
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: "var(--color-foreground)" }}>Send us a message</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>We typically respond within 1 business day.</p>

            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 10px" }}>Message received!</h3>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>We&apos;ll get back to you at <strong>{form.email}</strong> within one business day.</p>
                <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", company: "", reason: REASONS[0], message: "" }); }}
                  style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@company.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(602) 555-0100" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input value={form.company} onChange={e => set("company", e.target.value)} placeholder="Acme Contractors LLC" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Reason for Contact</label>
                  <select value={form.reason} onChange={e => set("reason", e.target.value)}
                    style={{ ...inputStyle, appearance: "none" as const, background: `white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center` }}>
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Message *</label>
                  <textarea required value={form.message} onChange={e => set("message", e.target.value)} rows={5} placeholder="Tell us how we can help..."
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} />
                </div>

                {status === "error" && (
                  <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 16 }}>
                    ⚠ Something went wrong. Please try again or call us directly.
                  </p>
                )}

                <button type="submit" disabled={status === "sending"}
                  style={{ width: "100%", padding: "13px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.75 : 1 }}>
                  {status === "sending" ? "Sending…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Sidebar info ───────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick contacts */}
          <div style={{ background: "white", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 18px" }}>Quick Contacts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: "📞", label: "Sales & Accounts", value: "(602) 555-0180", href: "tel:+16025550180" },
                { icon: "🎧", label: "Order Support", value: "(602) 555-0199", href: "tel:+16025550199" },
                { icon: "📧", label: "General Email", value: "hello@buildsupply.com", href: "mailto:hello@buildsupply.com" },
                { icon: "💬", label: "Live Chat", value: "Available 6am–6pm MST", href: "#" },
              ].map((item, i) => (
                <a key={i} href={item.href} style={{ display: "flex", alignItems: "flex-start", gap: 12, textDecoration: "none", color: "inherit" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-foreground)", margin: 0 }}>{item.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div style={{ background: "var(--color-primary)", borderRadius: 12, padding: "24px", color: "white" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", margin: "0 0 14px" }}>Business Hours</h3>
            {[
              { day: "Monday – Friday", hours: "6:00am – 6:00pm MST" },
              { day: "Saturday",        hours: "7:00am – 3:00pm MST" },
              { day: "Sunday",          hours: "Closed" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{row.day}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.hours === "Closed" ? "rgba(255,255,255,0.35)" : "white" }}>{row.hours}</span>
              </div>
            ))}
          </div>

          {/* Locations */}
          <div style={{ background: "white", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 18px" }}>Our Locations</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {OFFICES.map((office, i) => (
                <div key={i} style={{ paddingBottom: i < OFFICES.length - 1 ? 16 : 0, borderBottom: i < OFFICES.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 2px" }}>{office.city}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-accent)", margin: 0 }}>{office.label}</p>
                    </div>
                    <a href={office.mapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textDecoration: "none", whiteSpace: "nowrap", padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                      Map →
                    </a>
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 2px" }}>{office.address}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>{office.phone}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{office.hours}</p>
                </div>
              ))}
            </div>
          </div>

          {/* About link */}
          <Link href="/about" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 10, padding: "16px 20px", border: "1px solid #e2e8f0", textDecoration: "none", color: "inherit" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 2px" }}>Learn about BuildSupply</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Our story, values, and team</p>
            </div>
            <span style={{ fontSize: 20, color: "#94a3b8" }}>→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
