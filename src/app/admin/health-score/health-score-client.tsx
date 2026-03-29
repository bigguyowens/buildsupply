"use client";

import { useState, useTransition } from "react";
import { saveHealthScoreConfig, type HealthScoreConfig } from "@/app/actions/health-config";

type Cfg = Omit<HealthScoreConfig, "id" | "updated_at" | "updated_by_name">;

const ACCENT = "#f97316";

// ── Inline number input ───────────────────────────────────────────────────
function NumInput({ label, value, onChange, min = 0, max = 100, suffix = "pts", hint }:
  { label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; suffix?: string; hint?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted)",
        textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" value={value} min={min} max={max}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          style={{ width: 68, padding: "6px 8px", borderRadius: 6, fontSize: 13, fontWeight: 700,
            border: "1px solid var(--ad-border)", background: "var(--ad-surface)",
            color: "var(--ad-text)", outline: "none", textAlign: "center" }} />
        <span style={{ fontSize: 11, color: "var(--ad-muted)" }}>{suffix}</span>
      </div>
      {hint && <p style={{ fontSize: 10, color: "var(--ad-muted2)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────
function Section({ title, icon, children }:
  { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--ad-surface)", borderRadius: 10,
      border: "1px solid var(--ad-border)", overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--ad-border)",
        display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "var(--ad-text)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

// ── Live score preview ────────────────────────────────────────────────────
function ScorePreview({ cfg }: { cfg: Cfg }) {
  const maxTotal = cfg.pts_recency + cfg.pts_frequency + cfg.pts_spend +
                   cfg.pts_onboarding + cfg.pts_engagement + cfg.pts_quotes;

  const factors = [
    { label: "Recency",    pts: cfg.pts_recency,    color: "#3b82f6" },
    { label: "Frequency",  pts: cfg.pts_frequency,  color: "#8b5cf6" },
    { label: "Spend",      pts: cfg.pts_spend,      color: "#22c55e" },
    { label: "Onboarding", pts: cfg.pts_onboarding, color: "#f59e0b" },
    { label: "Engagement", pts: cfg.pts_engagement, color: "#f97316" },
    { label: "Quotes",     pts: cfg.pts_quotes,     color: "#ec4899" },
  ];

  const isValid = maxTotal === 100;

  const HEALTH_COLORS = {
    Healthy:         { color: "#15803d", bg: "#dcfce7" },
    "At Risk":       { color: "#92400e", bg: "#fef3c7" },
    "Needs Attention": { color: "#991b1b", bg: "#fee2e2" },
    New:             { color: "#1e40af", bg: "#dbeafe" },
  };

  return (
    <div style={{ background: "var(--ad-surface)", borderRadius: 10,
      border: `2px solid ${isValid ? "var(--ad-border)" : "#ef4444"}`, overflow: "hidden",
      position: "sticky", top: 20 }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--ad-border)",
        background: "var(--ad-surface2)" }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.07em", color: "var(--ad-text)", margin: 0 }}>
          📊 Live Preview
        </h2>
      </div>
      <div style={{ padding: 20 }}>

        {/* Points allocation bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ad-muted)" }}>
              Factor Allocation
            </span>
            <span style={{ fontSize: 14, fontWeight: 900,
              color: isValid ? "#22c55e" : "#ef4444" }}>
              {maxTotal} / 100 pts
            </span>
          </div>
          {/* Stacked bar */}
          <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden",
            background: "var(--ad-border)" }}>
            {factors.map(f => (
              <div key={f.label} title={`${f.label}: ${f.pts}pts`}
                style={{ width: `${f.pts}%`, background: f.color,
                  transition: "width 0.2s" }} />
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 10 }}>
            {factors.map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: f.color }} />
                <span style={{ fontSize: 11, color: "var(--ad-muted)" }}>
                  {f.label} ({f.pts})
                </span>
              </div>
            ))}
          </div>
          {!isValid && (
            <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700,
              margin: "8px 0 0", padding: "6px 10px", background: "#fee2e2",
              borderRadius: 5 }}>
              ⚠ Points must total exactly 100 to save
            </p>
          )}
        </div>

        {/* Label thresholds */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted)",
            textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
            Score Labels
          </p>
          {[
            { label: "Healthy",          range: `${cfg.threshold_healthy}–100`, ...HEALTH_COLORS.Healthy },
            { label: "At Risk",          range: `${cfg.threshold_at_risk}–${cfg.threshold_healthy - 1}`, ...HEALTH_COLORS["At Risk"] },
            { label: "Needs Attention",  range: `0–${cfg.threshold_at_risk - 1}`, ...HEALTH_COLORS["Needs Attention"] },
            { label: "New",              range: "No orders + low activity", ...HEALTH_COLORS.New },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "7px 10px", borderRadius: 6,
              background: l.bg, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: l.color }}>{l.label}</span>
              <span style={{ fontSize: 11, color: l.color, opacity: 0.8 }}>{l.range}</span>
            </div>
          ))}
        </div>

        {/* Recency preview */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted)",
            textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
            Recency Scoring
          </p>
          {[
            { label: `≤ ${cfg.recency_great} days`, pts: cfg.recency_pts_great },
            { label: `≤ ${cfg.recency_good} days`,  pts: cfg.recency_pts_good },
            { label: `≤ ${cfg.recency_ok} days`,    pts: cfg.recency_pts_ok },
            { label: `> ${cfg.recency_ok} days`,    pts: cfg.recency_pts_stale },
            { label: "Never ordered",               pts: 0 },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
              fontSize: 12, padding: "4px 0",
              borderBottom: "1px solid var(--ad-border2)" }}>
              <span style={{ color: "var(--ad-text2)" }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: "var(--ad-text)" }}>{r.pts} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────
export function HealthScoreConfigClient({ config }: { config: HealthScoreConfig }) {
  const [cfg, setCfg] = useState<Cfg>({ ...config });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof Cfg>(key: K, val: Cfg[K]) {
    setCfg(prev => ({ ...prev, [key]: val }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveHealthScoreConfig(cfg);
      if (res.ok) { setSaved(true); setError(null); }
      else { setError(res.error ?? "Save failed"); setSaved(false); }
    });
  }

  function handleReset() {
    setCfg({ ...config });
    setSaved(false);
    setError(null);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24,
      alignItems: "start" }}>

      {/* Left: all config sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Factor weights */}
        <Section title="Factor Weights (must total 100)" icon="⚖️">
          <NumInput label="Recency"    value={cfg.pts_recency}    onChange={v => set("pts_recency", v)}    hint="Last order date" />
          <NumInput label="Frequency"  value={cfg.pts_frequency}  onChange={v => set("pts_frequency", v)}  hint="Order count" />
          <NumInput label="Spend"      value={cfg.pts_spend}      onChange={v => set("pts_spend", v)}      hint="vs platform avg" />
          <NumInput label="Onboarding" value={cfg.pts_onboarding} onChange={v => set("pts_onboarding", v)} hint="Completion %" />
          <NumInput label="Engagement" value={cfg.pts_engagement} onChange={v => set("pts_engagement", v)} hint="Recent activity" />
          <NumInput label="Quotes"     value={cfg.pts_quotes}     onChange={v => set("pts_quotes", v)}     hint="Accepted quotes" />
        </Section>

        {/* Recency thresholds */}
        <Section title="Recency Thresholds" icon="📅">
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Day Thresholds</p>
              <NumInput label="Great (≤ N days)"  value={cfg.recency_great} onChange={v => set("recency_great", v)} suffix="days" max={365} />
              <NumInput label="Good (≤ N days)"   value={cfg.recency_good}  onChange={v => set("recency_good", v)}  suffix="days" max={365} />
              <NumInput label="OK (≤ N days)"     value={cfg.recency_ok}    onChange={v => set("recency_ok", v)}    suffix="days" max={365} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Points Awarded</p>
              <NumInput label="Great tier"  value={cfg.recency_pts_great} onChange={v => set("recency_pts_great", v)} />
              <NumInput label="Good tier"   value={cfg.recency_pts_good}  onChange={v => set("recency_pts_good", v)} />
              <NumInput label="OK tier"     value={cfg.recency_pts_ok}    onChange={v => set("recency_pts_ok", v)} />
              <NumInput label="Stale tier"  value={cfg.recency_pts_stale} onChange={v => set("recency_pts_stale", v)} />
            </div>
          </div>
        </Section>

        {/* Frequency thresholds */}
        <Section title="Frequency Thresholds" icon="🛒">
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Order Thresholds</p>
              <NumInput label="High (≥ N orders)"  value={cfg.freq_high} onChange={v => set("freq_high", v)} suffix="orders" max={50} />
              <NumInput label="Mid (≥ N orders)"   value={cfg.freq_mid}  onChange={v => set("freq_mid", v)}  suffix="orders" max={50} />
              <NumInput label="Low (≥ N orders)"   value={cfg.freq_low}  onChange={v => set("freq_low", v)}  suffix="orders" max={50} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Points Awarded</p>
              <NumInput label="High tier"  value={cfg.freq_pts_high} onChange={v => set("freq_pts_high", v)} />
              <NumInput label="Mid tier"   value={cfg.freq_pts_mid}  onChange={v => set("freq_pts_mid", v)} />
              <NumInput label="Low tier"   value={cfg.freq_pts_low}  onChange={v => set("freq_pts_low", v)} />
            </div>
          </div>
        </Section>

        {/* Engagement thresholds */}
        <Section title="Engagement Thresholds" icon="💬">
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Days Since Last Activity</p>
              <NumInput label="Great (≤ N days)"  value={cfg.engage_great} onChange={v => set("engage_great", v)} suffix="days" max={365} />
              <NumInput label="Good (≤ N days)"   value={cfg.engage_good}  onChange={v => set("engage_good", v)}  suffix="days" max={365} />
              <NumInput label="OK (≤ N days)"     value={cfg.engage_ok}    onChange={v => set("engage_ok", v)}    suffix="days" max={365} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--ad-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Points Awarded</p>
              <NumInput label="Great tier"       value={cfg.engage_pts_great} onChange={v => set("engage_pts_great", v)} />
              <NumInput label="Good tier"        value={cfg.engage_pts_good}  onChange={v => set("engage_pts_good", v)} />
              <NumInput label="OK tier"          value={cfg.engage_pts_ok}    onChange={v => set("engage_pts_ok", v)} />
              <NumInput label="Has notes only"   value={cfg.engage_pts_note}  onChange={v => set("engage_pts_note", v)} hint="Has notes but no activity" />
            </div>
          </div>
        </Section>

        {/* Label thresholds */}
        <Section title="Label Thresholds" icon="🏷️">
          <NumInput label="Healthy (≥ score)"    value={cfg.threshold_healthy}  onChange={v => set("threshold_healthy", v)}
            hint="Score to be labelled Healthy" max={100} />
          <NumInput label="At Risk (≥ score)"    value={cfg.threshold_at_risk}  onChange={v => set("threshold_at_risk", v)}
            hint="Score to be labelled At Risk" max={100} />
          <div style={{ width: "100%", padding: "12px 14px", background: "var(--ad-surface2)",
            borderRadius: 8, fontSize: 12, color: "var(--ad-muted)" }}>
            Scores below <strong style={{ color: "var(--ad-text)" }}>{cfg.threshold_at_risk}</strong> → Needs Attention &nbsp;·&nbsp;
            {cfg.threshold_at_risk}–{cfg.threshold_healthy - 1} → At Risk &nbsp;·&nbsp;
            ≥{cfg.threshold_healthy} → Healthy
          </div>
        </Section>

        {/* Save bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", background: "var(--ad-surface)",
          borderRadius: 10, border: "1px solid var(--ad-border)" }}>
          <button onClick={handleSave} disabled={isPending}
            style={{ padding: "10px 28px", borderRadius: 8, border: "none",
              background: isPending ? "var(--ad-muted2)" : ACCENT,
              color: "#fff", fontWeight: 800, fontSize: 14, cursor: isPending ? "not-allowed" : "pointer" }}>
            {isPending ? "Saving…" : "Save Configuration"}
          </button>
          <button onClick={handleReset} disabled={isPending}
            style={{ padding: "10px 18px", borderRadius: 8,
              border: "1px solid var(--ad-border)", background: "transparent",
              color: "var(--ad-muted)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Reset
          </button>
          {saved && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
              ✓ Saved — scores will update on next page load
            </span>
          )}
          {error && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
              ⚠ {error}
            </span>
          )}
        </div>
      </div>

      {/* Right: sticky live preview */}
      <ScorePreview cfg={cfg} />
    </div>
  );
}
