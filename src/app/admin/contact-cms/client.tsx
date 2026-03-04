'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactCMS, ContactHero, ContactForm, QuickContact, HoursRow, Location } from "@/app/actions/contact-cms";
import { saveHero, saveForm, saveQuickContacts, saveHours, saveLocations } from "@/app/actions/contact-cms";

const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted)", display: "block", marginBottom: 4 };

function Section({ title, children, onSave, saving, saved, error }: {
  title: string; children: React.ReactNode;
  onSave: () => void; saving: boolean; saved: boolean; error: string;
}) {
  return (
    <div style={{ background: "var(--ad-surface)", borderRadius: 10, border: "1px solid var(--ad-border)", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--ad-border2)", background: "var(--ad-surface2)" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ad-text)" }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved  && <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>✓ Saved</span>}
          {error  && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{error}</span>}
          <button onClick={onSave} disabled={saving}
            style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ── Hero section ─────────────────────────────────────────
function HeroSection({ initial }: { initial: ContactHero }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const set = (k: keyof ContactHero, v: string) => setData(d => ({ ...d, [k]: v }));

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await saveHero(data);
    setSaving(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else setError(r.error ?? "Error");
  }

  return (
    <Section title="Hero Banner" onSave={save} saving={saving} saved={saved} error={error}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><label style={lbl}>Badge Text</label><input value={data.badge} onChange={e => set("badge", e.target.value)} style={inp} /></div>
        <div><label style={lbl}>Headline</label><input value={data.headline} onChange={e => set("headline", e.target.value)} style={inp} /></div>
        <div><label style={lbl}>Subtext</label><textarea value={data.subtext} onChange={e => set("subtext", e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} /></div>
      </div>
    </Section>
  );
}

// ── Form section ─────────────────────────────────────────
function FormSection({ initial }: { initial: ContactForm }) {
  const router = useRouter();
  const [data, setData]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const set = (k: keyof ContactForm, v: string | string[]) => setData(d => ({ ...d, [k]: v }));

  function setReason(i: number, val: string) {
    const next = [...data.reasons];
    next[i] = val;
    set("reasons", next);
  }
  function addReason()    { set("reasons", [...data.reasons, ""]); }
  function removeReason(i: number) { set("reasons", data.reasons.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await saveForm(data);
    setSaving(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else setError(r.error ?? "Error");
  }

  return (
    <Section title="Contact Form" onSave={save} saving={saving} saved={saved} error={error}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={lbl}>Form Title</label><input value={data.title} onChange={e => set("title", e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Subtitle</label><input value={data.subtitle} onChange={e => set("subtitle", e.target.value)} style={inp} /></div>
        </div>
        <div><label style={lbl}>Submit Button Text</label><input value={data.button} onChange={e => set("button", e.target.value)} style={{ ...inp, maxWidth: 260 }} /></div>
        <div>
          <label style={lbl}>Reason for Contact Options</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.reasons.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--ad-muted2)", width: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
                <input value={r} onChange={e => setReason(i, e.target.value)} style={{ ...inp, flex: 1 }} />
                <button onClick={() => removeReason(i)} style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={addReason} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 6, border: "1px dashed #d1d5db", background: "var(--ad-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--ad-muted)" }}>
            + Add Option
          </button>
        </div>
      </div>
    </Section>
  );
}

// ── Quick Contacts section ────────────────────────────────
function QuickContactsSection({ initial }: { initial: QuickContact[] }) {
  const router = useRouter();
  const [items, setItems]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function setItem(i: number, k: keyof QuickContact, v: string) {
    const next = items.map((item, idx) => idx === i ? { ...item, [k]: v } : item);
    setItems(next);
  }
  function add()    { setItems([...items, { icon: "📞", label: "", value: "", href: "" }]); }
  function remove(i: number) { setItems(items.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await saveQuickContacts(items);
    setSaving(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else setError(r.error ?? "Error");
  }

  return (
    <Section title="Quick Contacts" onSave={save} saving={saving} saved={saved} error={error}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 1fr auto", gap: 8, alignItems: "center", background: "var(--ad-surface2)", borderRadius: 7, padding: "10px 12px", border: "1px solid var(--ad-border)" }}>
            <input value={item.icon} onChange={e => setItem(i, "icon", e.target.value)} style={{ ...inp, textAlign: "center", fontSize: 18, padding: "6px 4px" }} />
            <div><label style={{ ...lbl, marginBottom: 2 }}>Label</label><input value={item.label} onChange={e => setItem(i, "label", e.target.value)} style={inp} /></div>
            <div><label style={{ ...lbl, marginBottom: 2 }}>Display Value</label><input value={item.value} onChange={e => setItem(i, "value", e.target.value)} style={inp} /></div>
            <div><label style={{ ...lbl, marginBottom: 2 }}>Link (href)</label><input value={item.href} onChange={e => setItem(i, "href", e.target.value)} placeholder="tel:, mailto:, or #" style={inp} /></div>
            <button onClick={() => remove(i)} style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>✕</button>
          </div>
        ))}
        <button onClick={add} style={{ padding: "8px 14px", borderRadius: 6, border: "1px dashed #d1d5db", background: "var(--ad-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--ad-muted)", alignSelf: "flex-start" }}>
          + Add Contact
        </button>
      </div>
    </Section>
  );
}

// ── Hours section ─────────────────────────────────────────
function HoursSection({ initial }: { initial: HoursRow[] }) {
  const router = useRouter();
  const [rows, setRows]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function setRow(i: number, k: keyof HoursRow, v: string) {
    setRows(rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }
  function add()    { setRows([...rows, { day: "", hours: "" }]); }
  function remove(i: number) { setRows(rows.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await saveHours(rows);
    setSaving(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else setError(r.error ?? "Error");
  }

  return (
    <Section title="Business Hours" onSave={save} saving={saving} saved={saved} error={error}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
            <input value={row.day} onChange={e => setRow(i, "day", e.target.value)} placeholder="e.g. Monday – Friday" style={inp} />
            <input value={row.hours} onChange={e => setRow(i, "hours", e.target.value)} placeholder='e.g. 6:00am – 6:00pm MST or "Closed"' style={inp} />
            <button onClick={() => remove(i)} style={{ padding: "7px 10px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✕</button>
          </div>
        ))}
        <button onClick={add} style={{ marginTop: 4, padding: "6px 14px", borderRadius: 6, border: "1px dashed #d1d5db", background: "var(--ad-surface)", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--ad-muted)", alignSelf: "flex-start" }}>
          + Add Row
        </button>
        <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "4px 0 0" }}>Tip: type "Closed" for days off and it will render greyed out automatically.</p>
      </div>
    </Section>
  );
}

// ── Locations section ─────────────────────────────────────
function LocationsSection({ initial }: { initial: Location[] }) {
  const router = useRouter();
  const [locs, setLocs]     = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  function setLoc(i: number, k: keyof Location, v: string) {
    setLocs(locs.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  }
  function add() {
    setLocs([...locs, { city: "", label: "", address: "", phone: "", hours: "", mapUrl: "" }]);
  }
  function remove(i: number) { setLocs(locs.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    const r = await saveLocations(locs);
    setSaving(false);
    if (r.ok) { setSaved(true); router.refresh(); setTimeout(() => setSaved(false), 2000); }
    else setError(r.error ?? "Error");
  }

  return (
    <Section title="Locations" onSave={save} saving={saving} saved={saved} error={error}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {locs.map((loc, i) => (
          <div key={i} style={{ background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ad-text)" }}>{loc.city || `Location ${i + 1}`}</span>
              <button onClick={() => remove(i)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Remove
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>City / Name</label><input value={loc.city} onChange={e => setLoc(i, "city", e.target.value)} placeholder="Phoenix, AZ" style={inp} /></div>
              <div><label style={lbl}>Location Type</label><input value={loc.label} onChange={e => setLoc(i, "label", e.target.value)} placeholder="Headquarters & Distribution" style={inp} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={lbl}>Address</label><input value={loc.address} onChange={e => setLoc(i, "address", e.target.value)} placeholder="123 Main St, City, ST 00000" style={inp} /></div>
              <div><label style={lbl}>Phone</label><input value={loc.phone} onChange={e => setLoc(i, "phone", e.target.value)} placeholder="(602) 555-0180" style={inp} /></div>
              <div><label style={lbl}>Hours (short)</label><input value={loc.hours} onChange={e => setLoc(i, "hours", e.target.value)} placeholder="Mon–Fri 7am–5pm" style={inp} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={lbl}>Google Maps URL</label><input value={loc.mapUrl} onChange={e => setLoc(i, "mapUrl", e.target.value)} placeholder="https://maps.google.com/?q=..." style={inp} /></div>
            </div>
          </div>
        ))}
        <button onClick={add} style={{ padding: "8px 18px", borderRadius: 6, border: "1px dashed #d1d5db", background: "var(--ad-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--ad-muted)", alignSelf: "flex-start" }}>
          + Add Location
        </button>
      </div>
    </Section>
  );
}

// ── Main export ───────────────────────────────────────────
export function ContactCmsAdminClient({ cms }: { cms: ContactCMS }) {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ad-muted2)", margin: "0 0 4px" }}>Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>Contact Page</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 13, margin: 0 }}>Manage all content on the public <a href="/contact" target="_blank" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 600 }}>/contact</a> page.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <HeroSection        initial={cms.hero} />
        <FormSection        initial={cms.form} />
        <QuickContactsSection initial={cms.quick_contacts} />
        <HoursSection       initial={cms.hours} />
        <LocationsSection   initial={cms.locations} />
      </div>
    </div>
  );
}
