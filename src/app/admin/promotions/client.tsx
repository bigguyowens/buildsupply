'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Promotion, PromoUse } from "@/app/actions/promotions";
import { createPromotion, togglePromoActive, deletePromotion, getPromoUses } from "@/app/actions/promotions";

const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted)", display: "block", marginBottom: 4 };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
      background: active ? "#dcfce7" : "#f1f5f9", color: active ? "#15803d" : "#94a3b8" }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Uses flyout ───────────────────────────────────────────
function UsesDrawer({ promo, onClose }: { promo: Promotion; onClose: () => void }) {
  const [uses, setUses]       = useState<PromoUse[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getPromoUses(promo.id).then(u => { setUses(u); setLoading(false); });
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, maxWidth: "95vw", background: "var(--ad-surface)", zIndex: 201, boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--ad-border)", flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ad-text)" }}>{promo.code}</span>
            <span style={{ marginLeft: 10, fontSize: 13, color: "var(--ad-muted)" }}>{promo.discount_percent}% off · {promo.used_count} use{promo.used_count !== 1 ? "s" : ""}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ad-muted)", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading && <p style={{ color: "var(--ad-muted2)", fontSize: 14 }}>Loading…</p>}
          {uses && uses.length === 0 && <p style={{ color: "var(--ad-muted2)", fontSize: 14, fontStyle: "italic" }}>No uses yet.</p>}
          {uses && uses.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--ad-surface2)" }}>
                  {["Customer", "Order", "Date"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ad-muted2)", borderBottom: "1px solid var(--ad-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uses.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--ad-border2)" }}>
                    <td style={{ padding: "10px 12px" }}>
                      {u.user_name ? (
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{u.user_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--ad-muted2)" }}>{u.user_email}</p>
                        </div>
                      ) : <span style={{ color: "var(--ad-muted2)" }}>Guest</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: u.order_id ? "#374151" : "#94a3b8", fontWeight: u.order_id ? 700 : 400 }}>
                      {u.order_id ? `#${u.order_id}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--ad-muted)" }}>
                      {new Date(u.used_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

// ── Create drawer ─────────────────────────────────────────
function CreateDrawer({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: "", description: "", discount_percent: "", max_uses: "",
    one_per_customer: true, expires_at: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.code.trim() || !form.discount_percent) { setErr("Code and discount % are required."); return; }
    const pct = parseFloat(form.discount_percent);
    if (isNaN(pct) || pct <= 0 || pct > 100) { setErr("Discount must be between 1 and 100."); return; }
    setBusy(true); setErr("");
    const r = await createPromotion({
      code:             form.code.trim().toUpperCase(),
      description:      form.description.trim(),
      discount_percent: pct,
      max_uses:         form.max_uses ? parseInt(form.max_uses) : null,
      one_per_customer: form.one_per_customer,
      expires_at:       form.expires_at || null,
    });
    setBusy(false);
    if (r.ok) { onCreated(); onClose(); }
    else setErr(r.error ?? "Error");
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "95vw", background: "var(--ad-surface)", zIndex: 201, boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--ad-border)", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ad-text)" }}>New Promo Code</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ad-muted)", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Code *</label>
            <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} placeholder="SUMMER20" style={{ ...inp, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }} />
            <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "4px 0 0" }}>Auto-uppercased. Customers enter this at checkout.</p>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Summer sale — 20% off everything" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={lbl}>Discount % *</label>
              <input type="number" min={1} max={100} value={form.discount_percent} onChange={e => set("discount_percent", e.target.value)} placeholder="20" style={inp} />
            </div>
            <div>
              <label style={lbl}>Max Uses</label>
              <input type="number" min={1} value={form.max_uses} onChange={e => set("max_uses", e.target.value)} placeholder="Unlimited" style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Expiry Date</label>
            <input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} style={inp} />
            <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "4px 0 0" }}>Leave blank for no expiry.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)" }}>
            <input type="checkbox" id="opc" checked={form.one_per_customer} onChange={e => set("one_per_customer", e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
            <div>
              <label htmlFor="opc" style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text)", cursor: "pointer" }}>One per customer</label>
              <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "2px 0 0" }}>Logged-in customers can only use this code once.</p>
            </div>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, margin: 0 }}>{err}</p>}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--ad-border)", flexShrink: 0 }}>
          <button onClick={submit} disabled={busy} style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "var(--color-accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Creating…" : "Create Promo Code"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main client ───────────────────────────────────────────
export function PromotionsAdminClient({ promos: initial }: { promos: Promotion[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [promos, setPromos] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPromo, setViewPromo]   = useState<Promotion | null>(null);

  function refresh() { startTransition(() => router.refresh()); }

  async function handleToggle(id: number, active: boolean) {
    setPromos(p => p.map(x => x.id === id ? { ...x, active } : x));
    await togglePromoActive(id, active);
    refresh();
  }

  async function handleDelete(promo: Promotion) {
    if (!confirm(`Delete code "${promo.code}"? This also removes all usage history.`)) return;
    await deletePromotion(promo.id);
    setPromos(p => p.filter(x => x.id !== promo.id));
    refresh();
  }

  const now = new Date();
  const total     = promos.length;
  const active    = promos.filter(p => p.active && (!p.expires_at || new Date(p.expires_at) > now)).length;
  const totalUses = promos.reduce((s, p) => s + p.used_count, 0);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ad-muted2)", margin: "0 0 4px" }}>Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>Promotions</h1>
          <p style={{ color: "var(--ad-muted)", fontSize: 13, margin: 0 }}>Percentage-off promo codes with one-per-customer enforcement</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 7, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Code
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Codes",  value: total },
          { label: "Active",       value: active },
          { label: "Total Uses",   value: totalUses },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--ad-surface)", borderRadius: 8, padding: "16px 20px", border: "1px solid var(--ad-border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ad-muted2)", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--ad-surface)", borderRadius: 10, border: "1px solid var(--ad-border)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {promos.length === 0 ? (
          <p style={{ padding: "48px", textAlign: "center", color: "var(--ad-muted2)", fontSize: 14 }}>No promo codes yet. Create your first one!</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ad-surface2)" }}>
                {["Code", "Description", "Discount", "Uses", "Max Uses", "Expires", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-muted2)", borderBottom: "1px solid var(--ad-border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => {
                const expired = promo.expires_at && new Date(promo.expires_at) < now;
                const maxed   = promo.max_uses !== null && promo.used_count >= promo.max_uses;
                const effectivelyActive = promo.active && !expired && !maxed;
                return (
                  <tr key={promo.id} style={{ borderTop: "1px solid var(--ad-border2)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.06em", color: "var(--ad-text)", fontFamily: "monospace", background: "var(--ad-surface2)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ad-border)" }}>
                        {promo.code}
                      </span>
                      {promo.one_per_customer && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--ad-muted2)" }}>1x/customer</span>}
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--ad-muted)", maxWidth: 200 }}>{promo.description || "—"}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#15803d" }}>{promo.discount_percent}%</td>
                    <td style={{ padding: "14px 16px" }}>
                      <button onClick={() => setViewPromo(promo)} style={{ background: "none", border: "none", cursor: "pointer", color: promo.used_count > 0 ? "var(--color-accent)" : "#94a3b8", fontWeight: 700, fontSize: 13, padding: 0, textDecoration: promo.used_count > 0 ? "underline" : "none" }}>
                        {promo.used_count}
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--ad-muted)" }}>{promo.max_uses ?? "∞"}</td>
                    <td style={{ padding: "14px 16px", color: expired ? "#ef4444" : "#64748b", fontSize: 12 }}>
                      {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <StatusBadge active={effectivelyActive} />
                        {expired && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>EXPIRED</span>}
                        {maxed   && <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700 }}>MAXED OUT</span>}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleToggle(promo.id, !promo.active)}
                          style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: promo.active ? "#64748b" : "#15803d" }}>
                          {promo.active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => handleDelete(promo)}
                          style={{ padding: "5px 8px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && <CreateDrawer onCreated={refresh} onClose={() => setCreateOpen(false)} />}
      {viewPromo  && <UsesDrawer  promo={viewPromo}   onClose={() => setViewPromo(null)} />}
    </div>
  );
}
