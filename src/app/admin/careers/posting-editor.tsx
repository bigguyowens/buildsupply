'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreatePosting, adminUpdatePosting } from "@/app/actions/careers";
import type { JobPosting, PostingInput } from "@/app/actions/careers";

const DEPARTMENTS = ["Engineering","Product","Design","Sales","Marketing","Operations","Finance","Customer Success","HR","Legal"];
const TYPES = ["Full-Time","Part-Time","Contract","Internship"];
const STATUSES = [
  { value: "draft",  label: "Draft — not visible to public" },
  { value: "active", label: "Active — accepting applications" },
  { value: "closed", label: "Closed — no longer accepting" },
];

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--ad-text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {text}{required && <span style={{ color: "#f97316" }}> *</span>}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--ad-border)", fontSize: 14, boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

export function PostingEditor({ posting }: { posting?: JobPosting }) {
  const router = useRouter();
  const isEdit = !!posting;

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [form, setForm] = useState<PostingInput>({
    title:        posting?.title        ?? "",
    department:   posting?.department   ?? DEPARTMENTS[0],
    location:     posting?.location     ?? "Remote",
    type:         posting?.type         ?? "Full-Time",
    status:       posting?.status       ?? "draft",
    description:  posting?.description  ?? "",
    requirements: posting?.requirements ?? "",
    salary_range: posting?.salary_range ?? "",
  });

  function set(field: keyof PostingInput, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    setSaving(true); setError(null);

    const result = isEdit
      ? await adminUpdatePosting(posting!.id, form)
      : await adminCreatePosting(form);

    if (!result.success) { setError(result.error ?? "Failed to save."); setSaving(false); return; }

    const id = isEdit ? posting!.id : (result as { success: true; id: number }).id;
    router.push(`/admin/careers/${id}`);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

      {/* ── Main fields ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 }}>{error}</div>
        )}

        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 18px" }}>Job Details</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label text="Job Title" required />
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Frontend Engineer" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label text="Department" required />
                <select value={form.department} onChange={e => set("department", e.target.value)} style={inputStyle}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label text="Employment Type" required />
                <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label text="Location" required />
                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Remote / Atlanta, GA / Hybrid" style={inputStyle} />
              </div>
              <div>
                <Label text="Salary Range" />
                <input value={form.salary_range} onChange={e => set("salary_range", e.target.value)} placeholder="$80,000 – $120,000" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Label text="About the Role" required />
          <p style={{ fontSize: 12, color: "var(--ad-muted2)", margin: "0 0 10px" }}>Describe the role, team, and day-to-day responsibilities.</p>
          <textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={10}
            placeholder={"We're looking for a...\n\nYou'll work on...\n\nYou'll collaborate with..."}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Label text="Requirements" />
          <p style={{ fontSize: 12, color: "var(--ad-muted2)", margin: "0 0 10px" }}>Skills, experience, and qualifications. Use bullet points (one per line).</p>
          <textarea
            value={form.requirements}
            onChange={e => set("requirements", e.target.value)}
            rows={8}
            placeholder={"• 5+ years of experience in...\n• Proficiency in...\n• Nice to have: ..."}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Label text="Status" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
            {STATUSES.map(s => (
              <label key={s.value} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, border: `1px solid ${form.status === s.value ? "#f97316" : "#e2e8f0"}`, background: form.status === s.value ? "#fff7ed" : "white" }}>
                <input type="radio" name="status" value={s.value} checked={form.status === s.value} onChange={() => set("status", s.value)} style={{ marginTop: 2, accentColor: "#f97316" }} />
                <span style={{ fontSize: 13, fontWeight: form.status === s.value ? 700 : 400, color: form.status === s.value ? "#c2410c" : "#374151", lineHeight: 1.4 }}>
                  {s.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "12px 0", borderRadius: 8, border: "none", background: saving ? "#9ca3af" : "#f97316", color: "white", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", width: "100%" }}
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Posting"}
        </button>

        {isEdit && (
          <a href={`/careers/${posting!.slug}`} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", fontSize: 13, color: "var(--ad-muted)", textDecoration: "none", padding: "10px 0" }}>
            Preview public page ↗
          </a>
        )}
      </div>
    </div>
  );
}
