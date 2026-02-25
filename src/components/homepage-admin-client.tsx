'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveHomepageSectionAction } from "@/app/actions/homepage";

// ── Shared UI ────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: "#94a3b8", margin: "-2px 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

const input = {
  width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
  fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "white",
};

const colorInput = {
  width: 48, height: 36, padding: 2, border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer",
};

function SectionCard({
  title, emoji, enabled: initEnabled, children, onSave,
}: {
  title: string; emoji: string; enabled: boolean;
  children: (enabled: boolean) => React.ReactNode;
  onSave: () => void;
}) {
  const [enabled, setEnabled] = useState(initEnabled);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: open ? "1px solid #f1f5f9" : "none", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{title}</span>
        {/* Toggle */}
        <div
          onClick={e => { e.stopPropagation(); setEnabled(v => !v); }}
          style={{
            width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.2s",
            background: enabled ? "#f97316" : "#e2e8f0",
          }}
        >
          <div style={{ position: "absolute", top: 3, left: enabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
        <span style={{ fontSize: 12, color: enabled ? "#f97316" : "#94a3b8", fontWeight: 600, minWidth: 40 }}>{enabled ? "On" : "Off"}</span>
        <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="#94a3b8" strokeWidth={2} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
        </svg>
      </div>
      {open && (
        <div style={{ padding: "20px" }}>
          {children(enabled)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <Link href="/" target="_blank" style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
              Preview Site ↗
            </Link>
            <button onClick={onSave} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#f97316", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section editors ──────────────────────────────────────
function PromoBarEditor({ data, enabled, onChange }: { data: any; enabled: boolean; onChange: (d: any) => void }) {
  return (
    <>
      <Field label="Message Text" hint="Shown in the thin bar above the hero">
        <input style={input} value={data.text ?? ""} onChange={e => onChange({ ...data, text: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Background Color">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" style={colorInput} value={data.bg ?? "#1e3a5f"} onChange={e => onChange({ ...data, bg: e.target.value })} />
            <input style={{ ...input, flex: 1 }} value={data.bg ?? ""} onChange={e => onChange({ ...data, bg: e.target.value })} />
          </div>
        </Field>
        <Field label="Text Color">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" style={colorInput} value={data.color ?? "#ffffff"} onChange={e => onChange({ ...data, color: e.target.value })} />
            <input style={{ ...input, flex: 1 }} value={data.color ?? ""} onChange={e => onChange({ ...data, color: e.target.value })} />
          </div>
        </Field>
      </div>
      {/* Live preview */}
      <div style={{ borderRadius: 6, overflow: "hidden", marginTop: 4 }}>
        <div style={{ background: data.bg, color: data.color, textAlign: "center", padding: "10px 16px", fontSize: 14, fontWeight: 600 }}>
          {data.text || "Preview..."}
        </div>
      </div>
    </>
  );
}

function HeroEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <>
      <Field label="Headline">
        <input style={input} value={data.headline ?? ""} onChange={e => onChange({ ...data, headline: e.target.value })} />
      </Field>
      <Field label="Subtext">
        <textarea style={{ ...input, minHeight: 72, resize: "vertical" }} value={data.subtext ?? ""} onChange={e => onChange({ ...data, subtext: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="CTA Button Text">
          <input style={input} value={data.cta_text ?? ""} onChange={e => onChange({ ...data, cta_text: e.target.value })} />
        </Field>
        <Field label="CTA Link">
          <input style={input} value={data.cta_link ?? ""} onChange={e => onChange({ ...data, cta_link: e.target.value })} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Background Color">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" style={colorInput} value={data.bg ?? "#0f172a"} onChange={e => onChange({ ...data, bg: e.target.value })} />
            <input style={{ ...input, flex: 1 }} value={data.bg ?? ""} onChange={e => onChange({ ...data, bg: e.target.value })} />
          </div>
        </Field>
        <Field label="Accent Color">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" style={colorInput} value={data.accent ?? "#f97316"} onChange={e => onChange({ ...data, accent: e.target.value })} />
            <input style={{ ...input, flex: 1 }} value={data.accent ?? ""} onChange={e => onChange({ ...data, accent: e.target.value })} />
          </div>
        </Field>
      </div>
      {/* Mini preview */}
      <div style={{ borderRadius: 8, overflow: "hidden", marginTop: 4, background: data.bg, padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 8px", lineHeight: 1.2 }}>{data.headline || "Headline..."}</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 16px" }}>{data.subtext || "Subtext..."}</p>
          <div style={{ display: "inline-block", background: data.accent, color: "white", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
            {data.cta_text || "CTA"}
          </div>
        </div>
      </div>
    </>
  );
}

function DealsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const deals = data.deals ?? [];

  function updateDeal(i: number, field: string, value: string) {
    const updated = deals.map((d: any, idx: number) => idx === i ? { ...d, [field]: value } : d);
    onChange({ ...data, deals: updated });
  }

  function addDeal() {
    onChange({ ...data, deals: [...deals, { label: "New Deal", badge: "Sale", link: "/products", bg: "#1e3a8a", color: "#ffffff" }] });
  }

  function removeDeal(i: number) {
    onChange({ ...data, deals: deals.filter((_: any, idx: number) => idx !== i) });
  }

  return (
    <>
      <Field label="Section Title">
        <input style={input} value={data.title ?? ""} onChange={e => onChange({ ...data, title: e.target.value })} />
      </Field>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 12 }}>Deal Tiles</p>
      {deals.map((deal: any, i: number) => (
        <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Tile {i + 1}</span>
            <button onClick={() => removeDeal(i)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕ Remove</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Label"><input style={input} value={deal.label ?? ""} onChange={e => updateDeal(i, "label", e.target.value)} /></Field>
            <Field label="Badge Text"><input style={input} value={deal.badge ?? ""} onChange={e => updateDeal(i, "badge", e.target.value)} /></Field>
            <Field label="Link URL"><input style={input} value={deal.link ?? ""} onChange={e => updateDeal(i, "link", e.target.value)} /></Field>
            <Field label="Background Color">
              <div style={{ display: "flex", gap: 8 }}>
                <input type="color" style={colorInput} value={deal.bg ?? "#000"} onChange={e => updateDeal(i, "bg", e.target.value)} />
                <input style={{ ...input, flex: 1 }} value={deal.bg ?? ""} onChange={e => updateDeal(i, "bg", e.target.value)} />
              </div>
            </Field>
          </div>
          {/* Tile preview */}
          <div style={{ marginTop: 10, background: deal.bg, borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ background: "rgba(255,255,255,0.2)", color: deal.color, fontSize: 10, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: 3, width: "fit-content" }}>{deal.badge || "Badge"}</span>
            <span style={{ color: deal.color, fontWeight: 800, fontSize: 16 }}>{deal.label || "Label"}</span>
          </div>
        </div>
      ))}
      <button onClick={addDeal} style={{ padding: "8px 16px", borderRadius: 6, border: "1px dashed #e2e8f0", background: "white", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", width: "100%" }}>
        + Add Deal Tile
      </button>
    </>
  );
}

function ValuePropsEditor({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const props = data.props ?? [];

  function updateProp(i: number, field: string, value: string) {
    const updated = props.map((p: any, idx: number) => idx === i ? { ...p, [field]: value } : p);
    onChange({ ...data, props: updated });
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {props.map((prop: any, i: number) => (
          <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 14, border: "1px solid #e2e8f0" }}>
            <Field label="Icon (emoji)"><input style={input} value={prop.icon ?? ""} onChange={e => updateProp(i, "icon", e.target.value)} /></Field>
            <Field label="Title"><input style={input} value={prop.title ?? ""} onChange={e => updateProp(i, "title", e.target.value)} /></Field>
            <Field label="Description"><input style={input} value={prop.text ?? ""} onChange={e => updateProp(i, "text", e.target.value)} /></Field>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main component ───────────────────────────────────────
export function HomepageAdminClient({ cms }: { cms: Record<string, { enabled: boolean; content: any }> }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  const [promoData,  setPromoData]  = useState(cms.promo_bar?.content     ?? {});
  const [heroData,   setHeroData]   = useState(cms.hero?.content           ?? {});
  const [dealsData,  setDealsData]  = useState(cms.featured_deals?.content ?? {});
  const [valueData,  setValueData]  = useState(cms.value_props?.content    ?? {});

  const [promoOn,  setPromoOn]  = useState(cms.promo_bar?.enabled     ?? true);
  const [heroOn,   setHeroOn]   = useState(cms.hero?.enabled           ?? true);
  const [dealsOn,  setDealsOn]  = useState(cms.featured_deals?.enabled ?? true);
  const [valueOn,  setValueOn]  = useState(cms.value_props?.enabled    ?? true);

  function save(section: string, enabled: boolean, content: any) {
    startTransition(async () => {
      await saveHomepageSectionAction(section, enabled, content);
      setSaved(section);
      setTimeout(() => setSaved(null), 2500);
    });
  }

  return (
    <div style={{ maxWidth: 860 }}>
      {saved && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ✓ {saved.replace("_", " ")} saved and live on homepage
        </div>
      )}

      <SectionCard title="Promo Bar" emoji="📣" enabled={promoOn} onSave={() => { save("promo_bar", promoOn, promoData); }}>
        {(en) => { setPromoOn(en); return <PromoBarEditor data={promoData} enabled={en} onChange={setPromoData} />; }}
      </SectionCard>

      <SectionCard title="Hero Banner" emoji="🦸" enabled={heroOn} onSave={() => save("hero", heroOn, heroData)}>
        {(en) => { setHeroOn(en); return <HeroEditor data={heroData} onChange={setHeroData} />; }}
      </SectionCard>

      <SectionCard title="Featured Deals" emoji="🏷️" enabled={dealsOn} onSave={() => save("featured_deals", dealsOn, dealsData)}>
        {(en) => { setDealsOn(en); return <DealsEditor data={dealsData} onChange={setDealsData} />; }}
      </SectionCard>

      <SectionCard title="Value Props" emoji="✅" enabled={valueOn} onSave={() => save("value_props", valueOn, valueData)}>
        {(en) => { setValueOn(en); return <ValuePropsEditor data={valueData} onChange={setValueData} />; }}
      </SectionCard>

      <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Shop by Category</p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "2px 0 0" }}>Driven by your 12 product categories — always shown</p>
        </div>
        <Link href="/admin/products" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Manage Products →</Link>
      </div>

      <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px dashed #e2e8f0", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Featured Products</p>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "2px 0 0" }}>Shows products with the Featured flag — toggle it in Products</p>
        </div>
        <Link href="/admin/products" style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>Manage Featured →</Link>
      </div>
    </div>
  );
}
