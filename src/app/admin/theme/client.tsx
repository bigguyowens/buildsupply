'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteTheme } from "@/app/actions/theme";
import { saveSiteTheme } from "@/app/actions/theme";
import { HEADING_FONTS, BODY_FONTS, COLOR_PRESETS } from "@/lib/theme-config";

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#64748b", display: "block", marginBottom: 6 };
const card: React.CSSProperties = { background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: "20px 24px" };

function darken(hex: string, amount = 15): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ position: "absolute", inset: "-4px", width: "calc(100% + 8px)", height: "calc(100% + 8px)", border: "none", cursor: "pointer", padding: 0 }} />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={7}
          style={{ flex: 1, padding: "8px 11px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "monospace", outline: "none" }} />
      </div>
    </div>
  );
}

function Preview({ theme }: { theme: SiteTheme }) {
  const hFont = theme.heading_font === "Geist" ? "system-ui, sans-serif" : `'${theme.heading_font}', sans-serif`;
  const bFont = theme.body_font    === "Geist" ? "system-ui, sans-serif" : `'${theme.body_font}', sans-serif`;

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      {/* Nav bar */}
      <div style={{ background: theme.color_primary, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: hFont, fontWeight: 800, fontSize: 14, color: "white" }}>
          <span style={{ color: theme.color_accent }}>Build</span>Supply
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", padding: "4px 10px", borderRadius: 4, fontSize: 10, fontFamily: bFont }}>Products</span>
          <span style={{ background: theme.color_accent, color: "white", padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: bFont }}>Shop Now</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: theme.color_primary, padding: "20px 16px 24px", borderBottom: `3px solid ${theme.color_accent}` }}>
        <p style={{ fontFamily: hFont, fontSize: 18, fontWeight: 900, color: "white", margin: "0 0 6px", lineHeight: 1.2 }}>
          Industrial Supply<br/>Built for the Job Site
        </p>
        <p style={{ fontFamily: bFont, fontSize: 10, color: "rgba(255,255,255,0.65)", margin: "0 0 12px", lineHeight: 1.5 }}>
          40,000+ products. Fast shipping. Built for contractors.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ background: theme.color_accent, color: "white", padding: "6px 12px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: bFont }}>Shop the Catalog</span>
          <span style={{ border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "6px 12px", borderRadius: 4, fontSize: 10, fontFamily: bFont }}>Contact Us</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: theme.color_background, padding: "14px 16px" }}>
        <p style={{ fontFamily: hFont, fontSize: 13, fontWeight: 800, color: theme.color_foreground, margin: "0 0 8px" }}>Featured Products</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["Concrete Mix", "Safety Harness", "Power Drill"].map(name => (
            <div key={name} style={{ background: "white", borderRadius: 6, border: "1px solid #e2e8f0", padding: "10px 8px" }}>
              <div style={{ height: 36, background: "#f1f5f9", borderRadius: 4, marginBottom: 6 }} />
              <p style={{ fontFamily: bFont, fontSize: 10, fontWeight: 700, color: theme.color_foreground, margin: "0 0 2px" }}>{name}</p>
              <p style={{ fontFamily: bFont, fontSize: 9, color: "#64748b", margin: "0 0 6px" }}>$24.99</p>
              <div style={{ background: theme.color_accent, color: "white", textAlign: "center", padding: "3px 0", borderRadius: 3, fontSize: 9, fontWeight: 700, fontFamily: bFont }}>Add to Cart</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer strip */}
      <div style={{ background: theme.color_primary, padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: bFont, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>© 2025 BuildSupply</span>
        <span style={{ fontFamily: bFont, fontSize: 9, color: theme.color_accent, fontWeight: 700 }}>Privacy · Terms</span>
      </div>
    </div>
  );
}

export function AdminThemeClient({ theme: initial }: { theme: SiteTheme }) {
  const router = useRouter();
  const [theme, setTheme]   = useState<SiteTheme>(initial);
  const [busy,  setBusy]    = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const set = (k: keyof SiteTheme, v: string) => { setTheme(t => ({ ...t, [k]: v })); setSaved(false); };

  async function handleSave() {
    setBusy(true); setError(""); setSaved(false);
    const r = await saveSiteTheme(theme);
    setBusy(false);
    if (r.ok) { setSaved(true); router.refresh(); }
    else setError(r.error ?? "Error saving theme.");
  }

  function applyPreset(p: typeof COLOR_PRESETS[number]) {
    setTheme(t => ({ ...t, color_primary: p.primary, color_accent: p.accent, color_background: p.background, color_foreground: p.foreground }));
    setSaved(false);
  }

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(initial);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0 0 4px" }}>Admin · Settings</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>Site Theme</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>Customize colors and typography across the entire site</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ Saved!</span>}
          {error && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>{error}</span>}
          <button onClick={handleSave} disabled={busy || !hasChanges} style={{ padding: "9px 22px", borderRadius: 7, border: "none", background: hasChanges ? "var(--color-accent)" : "#e2e8f0", color: hasChanges ? "white" : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: hasChanges ? "pointer" : "default", transition: "all 0.15s" }}>
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Left — controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Color Presets */}
          <div style={card}>
            <p style={{ ...lbl, marginBottom: 14 }}>Quick Presets</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COLOR_PRESETS.map(preset => (
                <button key={preset.label} onClick={() => applyPreset(preset)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: preset.primary }} />
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: preset.accent }} />
                  </div>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={card}>
            <p style={{ ...lbl, marginBottom: 14 }}>Colors</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ColorField label="Primary (Nav / Header)" value={theme.color_primary}    onChange={v => set("color_primary", v)} />
              <ColorField label="Accent (Buttons / CTAs)" value={theme.color_accent}    onChange={v => set("color_accent", v)} />
              <ColorField label="Background"              value={theme.color_background} onChange={v => set("color_background", v)} />
              <ColorField label="Foreground (Text)"       value={theme.color_foreground} onChange={v => set("color_foreground", v)} />
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                💡 Hover variants are auto-generated from your selections. Tip: keep Primary dark and Accent vibrant for the best contrast.
              </p>
            </div>
          </div>

          {/* Fonts */}
          <div style={card}>
            <p style={{ ...lbl, marginBottom: 14 }}>Typography</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Heading Font</label>
                <select value={theme.heading_font} onChange={e => set("heading_font", e.target.value)}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer", outline: "none", background: "white" }}>
                  {HEADING_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <p style={{ margin: "8px 0 0", fontFamily: `'${theme.heading_font}', system-ui, sans-serif`, fontSize: 20, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                  The quick brown fox
                </p>
              </div>
              <div>
                <label style={lbl}>Body Font</label>
                <select value={theme.body_font} onChange={e => set("body_font", e.target.value)}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, cursor: "pointer", outline: "none", background: "white" }}>
                  {BODY_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <p style={{ margin: "8px 0 0", fontFamily: `'${theme.body_font}', system-ui, sans-serif`, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                  Industrial-grade construction supplies for contractors and project managers.
                </p>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                💡 Font previews above reflect your selection immediately. The live site preview on the right shows both fonts together. Fonts are loaded from Google Fonts — Geist (default) is self-hosted.
              </p>
            </div>
          </div>

          {/* Reset to defaults */}
          <div style={{ textAlign: "right" }}>
            <button onClick={() => setTheme({ color_primary: "#002244", color_accent: "#e8561c", color_background: "#f4f5f6", color_foreground: "#111827", heading_font: "Geist", body_font: "Geist" })}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#64748b" }}>
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Right — live preview */}
        <div style={{ position: "sticky", top: 24 }}>
          <p style={{ ...lbl, marginBottom: 10 }}>Live Preview</p>
          <Preview theme={theme} />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10, textAlign: "center" }}>
            Preview updates instantly. Click <strong>Save Changes</strong> to apply site-wide.
          </p>
        </div>

      </div>
    </div>
  );
}
