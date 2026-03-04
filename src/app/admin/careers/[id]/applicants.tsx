'use client';

import { useState } from "react";
import { adminUpdateApplicationStatus } from "@/app/actions/careers";
import type { JobApplication } from "@/app/actions/careers";

const STATUSES = [
  { value: "new",         label: "New",         bg: "#dbeafe", color: "#1e40af" },
  { value: "reviewing",   label: "Reviewing",   bg: "#fef9c3", color: "#854d0e" },
  { value: "interviewed", label: "Interviewed", bg: "#ede9fe", color: "#6d28d9" },
  { value: "offered",     label: "Offered",     bg: "#dcfce7", color: "#15803d" },
  { value: "rejected",    label: "Rejected",    bg: "#fee2e2", color: "#991b1b" },
];

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ApplicantCard({ app }: { app: JobApplication }) {
  const [status, setStatus]   = useState(app.status);
  const [notes, setNotes]     = useState(app.admin_notes ?? "");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]   = useState(false);

  const ss = STATUSES.find(s => s.value === status) ?? STATUSES[0];

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    await adminUpdateApplicationStatus(app.id, newStatus);
    setStatus(newStatus);
    setSaving(false);
  }

  async function handleSaveNotes() {
    setSaving(true);
    await adminUpdateApplicationStatus(app.id, status, notes);
    setSaving(false);
  }

  return (
    <div style={{ background: "white", borderRadius: 10, border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-accent, #f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
          {app.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" }}>{app.name}</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{app.email}{app.phone ? ` · ${app.phone}` : ""}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(app.created_at)}</span>
          <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: ss.bg, color: ss.color }}>
            {ss.label}
          </span>
          <span style={{ color: "#94a3b8", fontSize: 14, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Links row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {app.linkedin && (
              <a href={app.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textDecoration: "none" }}>
                🔗 LinkedIn
              </a>
            )}
            {app.portfolio && (
              <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>
                🌐 Portfolio
              </a>
            )}
          </div>

          {/* Cover letter */}
          {app.cover_letter && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Cover Letter</p>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 220, overflowY: "auto" }}>
                {app.cover_letter}
              </div>
            </div>
          )}

          {/* Resume */}
          {app.resume_text && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Resume</p>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#374151", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {app.resume_text}
              </div>
            </div>
          )}

          {/* Status + notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Pipeline Status</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    disabled={saving}
                    style={{
                      padding: "7px 12px", borderRadius: 8, border: `1px solid ${status === s.value ? s.color : "#e2e8f0"}`,
                      background: status === s.value ? s.bg : "white",
                      color: status === s.value ? s.color : "#64748b",
                      fontWeight: status === s.value ? 700 : 400,
                      fontSize: 12, cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {status === s.value ? "✓ " : ""}{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Internal Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={7}
                placeholder="Interview feedback, skills notes, next steps…"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                style={{ marginTop: 8, padding: "7px 14px", borderRadius: 8, border: "none", background: "#0f172a", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {saving ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApplicantList({ applications }: { applications: JobApplication[] }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);
  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s.value] = applications.filter(a => a.status === s.value).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setFilter("all")} style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, border: "none", background: filter === "all" ? "#0f172a" : "#f1f5f9", color: filter === "all" ? "white" : "#64748b", cursor: "pointer" }}>
          All ({applications.length})
        </button>
        {STATUSES.map(s => counts[s.value] > 0 && (
          <button key={s.value} onClick={() => setFilter(s.value)} style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, border: "none", background: filter === s.value ? s.bg : "#f1f5f9", color: filter === s.value ? s.color : "#64748b", cursor: "pointer" }}>
            {s.label} ({counts[s.value]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <p style={{ margin: 0 }}>No applicants in this stage yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(app => <ApplicantCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
