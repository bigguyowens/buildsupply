'use client';

import { useState } from "react";
import { adminUpdateApplicationStatus } from "@/app/actions/careers";
import type { JobApplication } from "@/app/actions/careers";

// ── Pipeline definition ───────────────────────────────────────────────────────
const PIPELINE = [
  { status: "new",               label: "New",              icon: "📋", color: "#3b82f6", bg: "#dbeafe" },
  { status: "phone_review",      label: "Phone Review",     icon: "📞", color: "#f59e0b", bg: "#fef3c7" },
  { status: "interview_1",       label: "1st Interview",    icon: "🤝", color: "#8b5cf6", bg: "#ede9fe" },
  { status: "interview_2",       label: "2nd Interview",    icon: "💼", color: "#06b6d4", bg: "#cffafe" },
  { status: "offer_sent",        label: "Offer Sent",       icon: "📨", color: "#10b981", bg: "#d1fae5" },
  { status: "offer_accepted",    label: "Offer Accepted",   icon: "🎉", color: "#15803d", bg: "#bbf7d0" },
];

const DECLINE_STATUS = "declined";
const DECLINED_COLOR = "#ef4444";
const DECLINED_BG    = "#fee2e2";

// Which step index each status maps to (for the progress bar)
const STATUS_STEP: Record<string, number> = {
  new: 0, phone_review: 1, interview_1: 2,
  interview_2: 3, offer_sent: 4, offer_accepted: 5, declined: -1,
};

// Next status when "Move On" is clicked
const NEXT_STATUS: Record<string, string> = {
  new:          "phone_review",
  phone_review: "interview_1",
  interview_1:  "interview_2",
  interview_2:  "offer_sent",
  offer_sent:   "offer_accepted",
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ── Pipeline progress bar ─────────────────────────────────────────────────────
function PipelineBar({ status }: { status: string }) {
  const isDeclined = status === DECLINE_STATUS;
  const currentStep = STATUS_STEP[status] ?? 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "4px 0 16px" }}>
      {PIPELINE.map((step, i) => {
        const done    = !isDeclined && currentStep > i;
        const active  = !isDeclined && currentStep === i;
        const future  = isDeclined || currentStep < i;
        const isLast  = i === PIPELINE.length - 1;

        return (
          <div key={step.status} style={{ display: "flex", alignItems: "center", flex: isLast ? 0 : 1, minWidth: 0 }}>
            {/* Node */}
            <div title={step.label} style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
              background: done ? step.color : active ? step.bg : "#f1f5f9",
              border: `2px solid ${done || active ? step.color : "#e2e8f0"}`,
              color: done ? "white" : active ? step.color : "#cbd5e1",
              fontWeight: 800,
              transition: "all 0.2s",
              boxShadow: active ? `0 0 0 4px ${step.bg}` : "none",
            }}>
              {done ? "✓" : step.icon}
            </div>
            {/* Connector */}
            {!isLast && (
              <div style={{ flex: 1, height: 3, background: done ? step.color : "#e2e8f0", transition: "background 0.3s", margin: "0 2px" }} />
            )}
          </div>
        );
      })}

      {/* Declined indicator */}
      {isDeclined && (
        <div style={{ marginLeft: 12, padding: "3px 12px", borderRadius: 9999, background: DECLINED_BG, color: DECLINED_COLOR, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
          ✕ Declined
        </div>
      )}
    </div>
  );
}

// ── Decline modal ─────────────────────────────────────────────────────────────
function DeclineModal({ onConfirm, onCancel, saving }: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>Decline Applicant</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Provide a reason for declining (internal only — not shown to applicant).</p>
        <textarea
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Lacked required Next.js experience, moved forward with stronger candidate…"
          rows={4}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#64748b" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} disabled={saving || !reason.trim()}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: reason.trim() ? DECLINED_COLOR : "#fca5a5", color: "white", fontWeight: 700, fontSize: 13, cursor: reason.trim() ? "pointer" : "not-allowed" }}>
            {saving ? "Saving…" : "Confirm Decline"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Start date modal ──────────────────────────────────────────────────────────
function StartDateModal({ onConfirm, onCancel, saving }: {
  onConfirm: (date: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [date, setDate] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <p style={{ fontSize: 28, margin: "0 0 8px", textAlign: "center" }}>🎉</p>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#0f172a", textAlign: "center" }}>Offer Accepted!</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", textAlign: "center" }}>Set the candidate&apos;s start date.</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} disabled={saving}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#64748b" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(date)} disabled={saving || !date}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: date ? "#15803d" : "#86efac", color: "white", fontWeight: 700, fontSize: 13, cursor: date ? "pointer" : "not-allowed" }}>
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action buttons for current stage ─────────────────────────────────────────
function StageActions({ status, onMoveOn, onDecline, saving }: {
  status: string; onMoveOn: () => void; onDecline: () => void; saving: boolean;
}) {
  const nextStep = PIPELINE.find(s => s.status === NEXT_STATUS[status]);
  const isTerminal = status === "offer_accepted" || status === DECLINE_STATUS;
  if (isTerminal) return null;

  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      {nextStep && (
        <button onClick={onMoveOn} disabled={saving}
          style={{ flex: 1, padding: "9px 16px", borderRadius: 8, border: "none", background: nextStep.color, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {saving ? "Saving…" : <>{nextStep.icon} Move On → {nextStep.label}</>}
        </button>
      )}
      <button onClick={onDecline} disabled={saving}
        style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${DECLINED_COLOR}`, background: "white", color: DECLINED_COLOR, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
        ✕ Decline
      </button>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────
function ApplicantCard({ app }: { app: JobApplication }) {
  const [status, setStatus]         = useState(app.status);
  const [declineReason, setDeclineReason] = useState(app.decline_reason ?? "");
  const [startDate, setStartDate]   = useState(app.start_date ?? "");
  const [notes, setNotes]           = useState(app.admin_notes ?? "");
  const [expanded, setExpanded]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState<"decline" | "startdate" | null>(null);

  const currentPipelineStep = PIPELINE.find(s => s.status === status);
  const isDeclined = status === DECLINE_STATUS;

  const badgeColor = isDeclined ? DECLINED_COLOR : (currentPipelineStep?.color ?? "#94a3b8");
  const badgeBg    = isDeclined ? DECLINED_BG    : (currentPipelineStep?.bg ?? "#f1f5f9");
  const badgeLabel = isDeclined ? "Declined"     : (currentPipelineStep?.label ?? status);

  async function doStatusUpdate(newStatus: string, opts?: { declineReason?: string; startDate?: string }) {
    setSaving(true);
    const result = await adminUpdateApplicationStatus(app.id, newStatus, opts);
    if (result.success) {
      setStatus(newStatus);
      if (opts?.declineReason) setDeclineReason(opts.declineReason);
      if (opts?.startDate)     setStartDate(opts.startDate);
    }
    setSaving(false);
    setModal(null);
  }

  function handleMoveOn() {
    const next = NEXT_STATUS[status];
    if (!next) return;
    if (next === "offer_accepted") { setModal("startdate"); return; }
    doStatusUpdate(next);
  }

  function handleDeclineConfirm(reason: string) {
    doStatusUpdate(DECLINE_STATUS, { declineReason: reason });
  }

  function handleStartDateConfirm(date: string) {
    doStatusUpdate("offer_accepted", { startDate: date });
  }

  async function handleSaveNotes() {
    setSaving(true);
    await adminUpdateApplicationStatus(app.id, status, { notes });
    setSaving(false);
  }

  return (
    <>
      {modal === "decline"   && <DeclineModal   onConfirm={handleDeclineConfirm}   onCancel={() => setModal(null)} saving={saving} />}
      {modal === "startdate" && <StartDateModal onConfirm={handleStartDateConfirm} onCancel={() => setModal(null)} saving={saving} />}

      <div style={{ background: "white", borderRadius: 12, border: `1px solid ${isDeclined ? "#fecaca" : "#f1f5f9"}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: isDeclined ? "#fecaca" : (currentPipelineStep?.bg ?? "#f1f5f9"), border: `2px solid ${badgeColor}`, display: "flex", alignItems: "center", justifyContent: "center", color: badgeColor, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
            {app.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" }}>{app.name}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {app.email}{app.phone ? ` · ${app.phone}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {status === "offer_accepted" && startDate && (
              <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                🗓 Starts {new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(app.created_at)}</span>
            <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: badgeBg, color: badgeColor, letterSpacing: "0.04em" }}>
              {currentPipelineStep?.icon} {badgeLabel}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 14, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none" }}>▾</span>
          </div>
        </div>

        {expanded && (
          <div style={{ borderTop: `1px solid ${isDeclined ? "#fecaca" : "#f1f5f9"}`, padding: "20px 20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Pipeline bar */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 10px", letterSpacing: "0.06em" }}>Pipeline Progress</p>
              <PipelineBar status={status} />

              {/* Decline reason banner */}
              {isDeclined && declineReason && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#b91c1c" }}>
                  <strong>Decline reason:</strong> {declineReason}
                </div>
              )}

              {/* Stage actions */}
              {!isDeclined && (
                <StageActions status={status} onMoveOn={handleMoveOn} onDecline={() => setModal("decline")} saving={saving} />
              )}

              {/* Re-open if declined */}
              {isDeclined && (
                <button onClick={() => doStatusUpdate("new")} disabled={saving}
                  style={{ marginTop: 8, padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#64748b" }}>
                  ↩ Re-open Application
                </button>
              )}
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {app.has_resume && (
                <a href={`/api/resume/${app.id}`} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "white", background: "#0f172a", padding: "6px 14px", borderRadius: 8, textDecoration: "none" }}>
                  📄 Download Resume{app.resume_filename ? ` · ${app.resume_filename}` : ""}{app.resume_size ? ` (${Math.round(app.resume_size / 1024)}KB)` : ""}
                </a>
              )}
              {app.linkedin && (
                <a href={app.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textDecoration: "none" }}>🔗 LinkedIn</a>
              )}
              {app.portfolio && (
                <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>🌐 Portfolio</a>
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

            {/* Resume text */}
            {app.resume_text && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Resume</p>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#374151", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                  {app.resume_text}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>Internal Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder="Interview feedback, skills assessment, next steps…"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box" as const, fontFamily: "inherit" }}
              />
              <button onClick={handleSaveNotes} disabled={saving}
                style={{ marginTop: 8, padding: "7px 16px", borderRadius: 8, border: "none", background: "#0f172a", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── List + filters ────────────────────────────────────────────────────────────
const ALL_STATUSES = [
  ...PIPELINE,
  { status: DECLINE_STATUS, label: "Declined", icon: "✕", color: DECLINED_COLOR, bg: DECLINED_BG },
];

export function ApplicantList({ applications }: { applications: JobApplication[] }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);
  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = applications.filter(a => a.status === s.status).length;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={() => setFilter("all")}
          style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, border: "none", background: filter === "all" ? "#0f172a" : "#f1f5f9", color: filter === "all" ? "white" : "#64748b", cursor: "pointer" }}>
          All ({applications.length})
        </button>
        {ALL_STATUSES.map(s => counts[s.status] > 0 && (
          <button key={s.status} onClick={() => setFilter(s.status)}
            style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, border: "none", background: filter === s.status ? s.bg : "#f1f5f9", color: filter === s.status ? s.color : "#64748b", cursor: "pointer" }}>
            {s.icon} {s.label} ({counts[s.status]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
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
