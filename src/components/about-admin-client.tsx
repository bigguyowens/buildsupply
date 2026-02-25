'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveAboutSectionAction } from "@/app/actions/about";

// ── Shared helpers ───────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 6,
  border: "1px solid #e2e8f0", fontSize: 13, outline: "none",
  boxSizing: "border-box", background: "white", fontFamily: "inherit",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ fontSize: 11, color: "#94a3b8", margin: "-2px 0 6px" }}>{hint}</p>}
      {children}
    </div>
  );
}

function SectionCard({ title, emoji, enabled: initEnabled, children, onSave, saving, saved }: {
  title: string; emoji: string; enabled: boolean;
  children: (enabled: boolean, setEnabled: (v: boolean) => void) => React.ReactNode;
  onSave: () => void; saving: boolean; saved: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(initEnabled);

  return (
    <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: open ? "1px solid #f1f5f9" : "none", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{title}</span>
        <div onClick={e => { e.stopPropagation(); setEnabled(v => !v); }} style={{ width: 40, height: 22, borderRadius: 11, position: "relative", cursor: "pointer", background: enabled ? "#f97316" : "#e2e8f0", transition: "background 0.2s", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 3, left: enabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </div>
        <span style={{ fontSize: 12, color: enabled ? "#f97316" : "#94a3b8", fontWeight: 600, minWidth: 32 }}>{enabled ? "On" : "Off"}</span>
        <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="#94a3b8" strokeWidth={2} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
        </svg>
      </div>
      {open && (
        <div style={{ padding: "20px" }}>
          {children(enabled, setEnabled)}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", alignItems: "center" }}>
            {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ Saved & live</span>}
            <Link href="/about" target="_blank" style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#64748b", textDecoration: "none" }}>
              Preview ↗
            </Link>
            <button onClick={onSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#f97316", color: "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Editors ──────────────────────────────────────

function HeroEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: Record<string, string>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <>
      <Field label="Tag / Label" hint="Small uppercase text above the headline">
        <input style={inp} value={data.tag ?? ""} onChange={e => set("tag", e.target.value)} />
      </Field>
      <Field label="Headline">
        <input style={inp} value={data.headline ?? ""} onChange={e => set("headline", e.target.value)} />
      </Field>
      <Field label="Subtext">
        <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={data.subtext ?? ""} onChange={e => set("subtext", e.target.value)} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Primary CTA Text"><input style={inp} value={data.cta_primary_text ?? ""} onChange={e => set("cta_primary_text", e.target.value)} /></Field>
        <Field label="Primary CTA Link"><input style={inp} value={data.cta_primary_link ?? ""} onChange={e => set("cta_primary_link", e.target.value)} /></Field>
        <Field label="Secondary CTA Text"><input style={inp} value={data.cta_secondary_text ?? ""} onChange={e => set("cta_secondary_text", e.target.value)} /></Field>
        <Field label="Secondary CTA Link"><input style={inp} value={data.cta_secondary_link ?? ""} onChange={e => set("cta_secondary_link", e.target.value)} /></Field>
      </div>
      <Field label="Background Image URL" hint="Used as the faded right-side photo in the hero">
        <input style={inp} value={data.bg_image ?? ""} onChange={e => set("bg_image", e.target.value)} />
      </Field>
      {/* Preview */}
      <div style={{ borderRadius: 8, overflow: "hidden", background: "#0f172a", padding: "24px", marginTop: 4, position: "relative" }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#f97316", margin: "0 0 8px" }}>{data.tag || "Tag"}</p>
        <p style={{ color: "white", fontWeight: 800, fontSize: 18, margin: "0 0 8px", lineHeight: 1.2 }}>{data.headline || "Headline…"}</p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, margin: "0 0 14px" }}>{data.subtext || "Subtext…"}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "#f97316", color: "white", padding: "6px 16px", borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{data.cta_primary_text || "Primary CTA"}</span>
          <span style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 16px", borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{data.cta_secondary_text || "Secondary CTA"}</span>
        </div>
      </div>
    </>
  );
}

function StatsEditor({ data, onChange }: { data: { stats?: { value: string; label: string }[] }; onChange: (d: unknown) => void }) {
  const stats = data.stats ?? [];
  const update = (i: number, k: string, v: string) => {
    const updated = stats.map((s, idx) => idx === i ? { ...s, [k]: v } : s);
    onChange({ ...data, stats: updated });
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 14, border: "1px solid #e2e8f0" }}>
          <Field label={`Stat ${i + 1} Value`}><input style={inp} value={s.value} onChange={e => update(i, "value", e.target.value)} placeholder="e.g. 40,000+" /></Field>
          <Field label="Label"><input style={inp} value={s.label} onChange={e => update(i, "label", e.target.value)} placeholder="e.g. Products Available" /></Field>
          {/* Mini preview */}
          <div style={{ background: "#f97316", borderRadius: 6, padding: "10px", textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: 22, margin: 0 }}>{s.value || "—"}</p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label || "Label"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MissionEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: unknown) => void }) {
  const paragraphs = (data.paragraphs as string[]) ?? ["", "", ""];
  const updatePara = (i: number, v: string) => {
    const updated = paragraphs.map((p, idx) => idx === i ? v : p);
    onChange({ ...data, paragraphs: updated });
  };
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Tag"><input style={inp} value={(data.tag as string) ?? ""} onChange={e => set("tag", e.target.value)} /></Field>
        <Field label="Headline"><input style={inp} value={(data.headline as string) ?? ""} onChange={e => set("headline", e.target.value)} /></Field>
      </div>
      {paragraphs.map((p, i) => (
        <Field key={i} label={`Paragraph ${i + 1}`}>
          <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={p} onChange={e => updatePara(i, e.target.value)} />
        </Field>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Photo URL" hint="Right-column image"><input style={inp} value={(data.image as string) ?? ""} onChange={e => set("image", e.target.value)} /></Field>
        <Field label="Photo Caption"><input style={inp} value={(data.image_caption as string) ?? ""} onChange={e => set("image_caption", e.target.value)} /></Field>
      </div>
    </>
  );
}

function ValuesEditor({ data, onChange }: { data: { tag?: string; headline?: string; values?: { icon: string; title: string; body: string }[] }; onChange: (d: unknown) => void }) {
  const values = data.values ?? [];
  const update = (i: number, k: string, v: string) => {
    const updated = values.map((val, idx) => idx === i ? { ...val, [k]: v } : val);
    onChange({ ...data, values: updated });
  };
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Field label="Tag"><input style={inp} value={data.tag ?? ""} onChange={e => set("tag", e.target.value)} /></Field>
        <Field label="Section Headline"><input style={inp} value={data.headline ?? ""} onChange={e => set("headline", e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {values.map((v, i) => (
          <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 14, border: "1px solid #e2e8f0" }}>
            <Field label="Icon (emoji)"><input style={inp} value={v.icon} onChange={e => update(i, "icon", e.target.value)} /></Field>
            <Field label="Title"><input style={inp} value={v.title} onChange={e => update(i, "title", e.target.value)} /></Field>
            <Field label="Body Text"><textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={v.body} onChange={e => update(i, "body", e.target.value)} /></Field>
          </div>
        ))}
      </div>
    </>
  );
}

function LeadershipEditor({ data, onChange }: { data: { tag?: string; headline?: string; people?: { name: string; title: string; image: string; bio: string }[] }; onChange: (d: unknown) => void }) {
  const people = data.people ?? [];
  const update = (i: number, k: string, v: string) => {
    const updated = people.map((p, idx) => idx === i ? { ...p, [k]: v } : p);
    onChange({ ...data, people: updated });
  };
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });

  function addPerson() { onChange({ ...data, people: [...people, { name: "", title: "", image: "", bio: "" }] }); }
  function removePerson(i: number) { onChange({ ...data, people: people.filter((_, idx) => idx !== i) }); }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Field label="Tag"><input style={inp} value={data.tag ?? ""} onChange={e => set("tag", e.target.value)} /></Field>
        <Field label="Section Headline"><input style={inp} value={data.headline ?? ""} onChange={e => set("headline", e.target.value)} /></Field>
      </div>
      {people.map((p, i) => (
        <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 16, marginBottom: 14, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Person {i + 1}{p.name ? ` — ${p.name}` : ""}</span>
            <button onClick={() => removePerson(i)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕ Remove</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Name"><input style={inp} value={p.name} onChange={e => update(i, "name", e.target.value)} /></Field>
            <Field label="Title / Role"><input style={inp} value={p.title} onChange={e => update(i, "title", e.target.value)} /></Field>
            <Field label="Photo URL" hint="Headshot image"><input style={inp} value={p.image} onChange={e => update(i, "image", e.target.value)} /></Field>
            <Field label="Bio"><textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={p.bio} onChange={e => update(i, "bio", e.target.value)} /></Field>
          </div>
        </div>
      ))}
      <button onClick={addPerson} style={{ padding: "8px 16px", borderRadius: 6, border: "1px dashed #e2e8f0", background: "white", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", width: "100%" }}>
        + Add Person
      </button>
    </>
  );
}

function CtaEditor({ data, onChange }: { data: Record<string, string>; onChange: (d: unknown) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <>
      <Field label="Headline"><input style={inp} value={data.headline ?? ""} onChange={e => set("headline", e.target.value)} /></Field>
      <Field label="Subtext"><textarea style={{ ...inp, minHeight: 60, resize: "vertical" }} value={data.subtext ?? ""} onChange={e => set("subtext", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Primary Button Text"><input style={inp} value={data.cta_primary_text ?? ""} onChange={e => set("cta_primary_text", e.target.value)} /></Field>
        <Field label="Primary Button Link"><input style={inp} value={data.cta_primary_link ?? ""} onChange={e => set("cta_primary_link", e.target.value)} /></Field>
        <Field label="Secondary Button Text"><input style={inp} value={data.cta_secondary_text ?? ""} onChange={e => set("cta_secondary_text", e.target.value)} /></Field>
        <Field label="Secondary Button Link"><input style={inp} value={data.cta_secondary_link ?? ""} onChange={e => set("cta_secondary_link", e.target.value)} /></Field>
      </div>
      {/* Preview */}
      <div style={{ background: "#0f172a", borderRadius: 8, padding: "24px", textAlign: "center", marginTop: 4 }}>
        <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: "0 0 8px" }}>{data.headline || "Headline…"}</p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "0 0 16px" }}>{data.subtext || "Subtext…"}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ background: "#f97316", color: "white", padding: "8px 20px", borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{data.cta_primary_text || "Primary"}</span>
          <span style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "8px 20px", borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{data.cta_secondary_text || "Secondary"}</span>
        </div>
      </div>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────
export function AboutAdminClient({ cms }: { cms: Record<string, { enabled: boolean; content: unknown }> }) {
  const [, startTransition] = useTransition();
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection,  setSavedSection]  = useState<string | null>(null);

  const [heroData,       setHeroData]       = useState<Record<string, string>>(       (cms.hero?.content       ?? {}) as Record<string, string>);
  const [heroOn,         setHeroOn]         = useState(cms.hero?.enabled         ?? true);
  const [statsData,      setStatsData]      = useState(                                cms.stats?.content       ?? { stats: [] });
  const [statsOn,        setStatsOn]        = useState(cms.stats?.enabled        ?? true);
  const [missionData,    setMissionData]    = useState<Record<string, unknown>>(       (cms.mission?.content    ?? {}) as Record<string, unknown>);
  const [missionOn,      setMissionOn]      = useState(cms.mission?.enabled      ?? true);
  const [valuesData,     setValuesData]     = useState(                                cms.values?.content      ?? { values: [] });
  const [valuesOn,       setValuesOn]       = useState(cms.values?.enabled       ?? true);
  const [leadershipData, setLeadershipData] = useState(                                cms.leadership?.content  ?? { people: [] });
  const [leadershipOn,   setLeadershipOn]   = useState(cms.leadership?.enabled   ?? true);
  const [ctaData,        setCtaData]        = useState<Record<string, string>>(        (cms.cta?.content        ?? {}) as Record<string, string>);
  const [ctaOn,          setCtaOn]          = useState(cms.cta?.enabled          ?? true);

  function save(section: string, enabled: boolean, content: unknown) {
    setSavingSection(section);
    startTransition(async () => {
      await saveAboutSectionAction(section, enabled, content);
      setSavingSection(null);
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 2500);
    });
  }

  const sections = [
    { key: "hero",       title: "Hero Banner",    emoji: "🦸", on: heroOn,       setOn: setHeroOn,       data: heroData,       setData: setHeroData,       Editor: HeroEditor },
    { key: "stats",      title: "Stats Bar",      emoji: "📊", on: statsOn,      setOn: setStatsOn,      data: statsData,      setData: setStatsData,      Editor: StatsEditor },
    { key: "mission",    title: "Mission Section",emoji: "🎯", on: missionOn,    setOn: setMissionOn,    data: missionData,    setData: setMissionData,    Editor: MissionEditor },
    { key: "values",     title: "Our Values",     emoji: "✅", on: valuesOn,     setOn: setValuesOn,     data: valuesData,     setData: setValuesData,     Editor: ValuesEditor },
    { key: "leadership", title: "Leadership",     emoji: "👥", on: leadershipOn, setOn: setLeadershipOn, data: leadershipData, setData: setLeadershipData, Editor: LeadershipEditor },
    { key: "cta",        title: "CTA Banner",     emoji: "📣", on: ctaOn,        setOn: setCtaOn,        data: ctaData,        setData: setCtaData,        Editor: CtaEditor },
  ];

  return (
    <div style={{ maxWidth: 860 }}>
      {sections.map(({ key, title, emoji, on, setOn, data, setData, Editor }) => (
        <SectionCard
          key={key}
          title={title}
          emoji={emoji}
          enabled={on}
          saving={savingSection === key}
          saved={savedSection === key}
          onSave={() => save(key, on, data)}
        >
          {(liveEnabled, setLiveEnabled) => {
            // sync toggle state back up
            if (liveEnabled !== on) setOn(liveEnabled);
            setLiveEnabled;
            return <Editor data={data as never} onChange={setData as never} />;
          }}
        </SectionCard>
      ))}
    </div>
  );
}
