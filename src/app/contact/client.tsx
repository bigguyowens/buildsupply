'use client';

import { useState } from "react";
import Link from "next/link";
import type { ContactCMS } from "@/app/actions/contact-cms";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 6,
  border: "1px solid #e2e8f0", fontSize: 14, outline: "none",
  boxSizing: "border-box" as const, fontFamily: "inherit",
  transition: "border-color 0.15s",
};
const labelStyle = {
  fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const,
  letterSpacing: "0.06em", color: "#64748b", display: "block", marginBottom: 6,
};

export function ContactPageClient({ cms }: { cms: ContactCMS }) {
  const { hero, form, quick_contacts, hours, locations } = cms;
  const reasons = form.reasons ?? [];

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "",
    reason: reasons[0] ?? "", message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const set = (k: string, v: string) => setFormData(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch { setStatus("error"); }
  }

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "var(--color-primary)", borderBottom: "4px solid var(--color-accent)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>{hero.badge}</p>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "white", margin: "0 0 14px", lineHeight: 1.1 }}>{hero.headline}</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 500, margin: 0, lineHeight: 1.7 }}>{hero.subtext}</p>
        </div>
      </div>

      <div className="contact-layout" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "1fr 440px", gap: 48, alignItems: "start" }}>

        {/* Form */}
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: "36px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px", color: "var(--color-foreground)" }}>{form.title}</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px" }}>{form.subtitle}</p>

            {status === "sent" ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 10px" }}>Message received!</h3>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
                  We&apos;ll get back to you at <strong>{formData.email}</strong> within one business day.
                </p>
                <button onClick={() => { setStatus("idle"); setFormData({ name: "", email: "", phone: "", company: "", reason: reasons[0] ?? "", message: "" }); }}
                  style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="contact-form-grid">
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input required value={formData.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input required type="email" value={formData.email} onChange={e => set("email", e.target.value)} placeholder="jane@company.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input type="tel" value={formData.phone} onChange={e => set("phone", e.target.value)} placeholder="(602) 555-0100" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input value={formData.company} onChange={e => set("company", e.target.value)} placeholder="Acme Contractors LLC" style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Reason for Contact</label>
                  <select value={formData.reason} onChange={e => set("reason", e.target.value)}
                    style={{ ...inputStyle, appearance: "none" as const, background: `white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center` }}>
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Message *</label>
                  <textarea required value={formData.message} onChange={e => set("message", e.target.value)} rows={5}
                    placeholder="Tell us how we can help..." style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} />
                </div>

                {status === "error" && (
                  <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 16 }}>
                    ⚠ Something went wrong. Please try again or call us directly.
                  </p>
                )}

                <button type="submit" disabled={status === "sending"}
                  style={{ width: "100%", padding: "13px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.75 : 1 }}>
                  {status === "sending" ? "Sending…" : form.button}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Quick Contacts */}
          {quick_contacts.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 18px" }}>Quick Contacts</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {quick_contacts.map((item, i) => (
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
          )}

          {/* Hours */}
          {hours.length > 0 && (
            <div style={{ background: "var(--color-primary)", borderRadius: 12, padding: "24px", color: "white" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", margin: "0 0 14px" }}>Business Hours</h3>
              {hours.map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < hours.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{row.day}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.hours.toLowerCase() === "closed" ? "rgba(255,255,255,0.35)" : "white" }}>{row.hours}</span>
                </div>
              ))}
            </div>
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <div style={{ background: "white", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 18px" }}>Our Locations</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {locations.map((office, i) => (
                  <div key={i} style={{ paddingBottom: i < locations.length - 1 ? 16 : 0, borderBottom: i < locations.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-foreground)", margin: "0 0 2px" }}>{office.city}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-accent)", margin: 0 }}>{office.label}</p>
                      </div>
                      {office.mapUrl && (
                        <a href={office.mapUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textDecoration: "none", whiteSpace: "nowrap", padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
                          Map →
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 2px" }}>{office.address}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>{office.phone}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{office.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
