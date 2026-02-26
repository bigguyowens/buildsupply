'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactSubmission } from "@/app/actions/contact";
import { updateSubmissionStatus } from "@/app/actions/contact";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  new:      { label: "New",      bg: "#dbeafe", color: "#1e40af" },
  read:     { label: "Read",     bg: "#f3f4f6", color: "#374151" },
  replied:  { label: "Replied",  bg: "#dcfce7", color: "#15803d" },
  archived: { label: "Archived", bg: "#fef9c3", color: "#854d0e" },
};

const ALL_STATUSES = ["new", "read", "replied", "archived"] as const;

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.new;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

export function ContactAdminClient({ submissions }: { submissions: ContactSubmission[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notes, setNotes] = useState<Record<number, string>>({});

  const filtered = filterStatus === "all"
    ? submissions
    : submissions.filter(s => s.status === filterStatus);

  const counts = {
    all: submissions.length,
    new: submissions.filter(s => s.status === "new").length,
    read: submissions.filter(s => s.status === "read").length,
    replied: submissions.filter(s => s.status === "replied").length,
    archived: submissions.filter(s => s.status === "archived").length,
  };

  function handleStatus(id: number, status: string) {
    startTransition(async () => {
      await updateSubmissionStatus(id, status, notes[id]);
      router.refresh();
    });
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>Contact Submissions</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{submissions.length} total · {counts.new} new</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", ...ALL_STATUSES] as const).map(s => {
          const active = filterStatus === s;
          const meta = s === "all" ? null : STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: active ? (meta?.bg ?? "#0f172a") : "white",
                color: active ? (meta?.color ?? "white") : "#64748b",
                borderColor: active ? (meta?.bg ?? "#0f172a") : "#e2e8f0",
              }}
            >
              {s === "all" ? "All" : STATUS_META[s].label} ({counts[s]})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "64px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          No submissions{filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(sub => {
            const isOpen = expanded === sub.id;
            return (
              <div key={sub.id} style={{ background: "white", borderRadius: 8, border: `1px solid ${sub.status === "new" ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden", boxShadow: sub.status === "new" ? "0 0 0 1px #bfdbfe" : "none" }}>

                {/* Row header — click to expand */}
                <button
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                  </svg>

                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#0f172a" }}>{sub.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "1px 0 0" }}>{sub.email}</p>
                    </div>
                    {sub.company && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{sub.company}</p>}
                    {sub.reason && <p style={{ fontSize: 12, color: "#64748b", margin: 0, fontStyle: "italic" }}>re: {sub.reason}</p>}
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginLeft: "auto" }}>
                      {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <StatusBadge status={sub.status} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Contact info */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {[
                        { label: "Email",   value: sub.email,   href: `mailto:${sub.email}` },
                        { label: "Phone",   value: sub.phone },
                        { label: "Company", value: sub.company },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 2px" }}>{f.label}</p>
                          {f.href
                            ? <a href={f.href} style={{ fontSize: 13, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>{f.value}</a>
                            : <p style={{ fontSize: 13, color: "#0f172a", margin: 0, fontWeight: 600 }}>{f.value}</p>
                          }
                        </div>
                      ))}
                    </div>

                    {/* Message */}
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 6px" }}>Message</p>
                      <div style={{ background: "#f8fafc", borderRadius: 6, padding: "14px 16px", fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", border: "1px solid #e2e8f0" }}>
                        {sub.message}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 6px" }}>Internal Notes</p>
                      <textarea
                        defaultValue={sub.notes ?? ""}
                        onChange={e => setNotes(n => ({ ...n, [sub.id]: e.target.value }))}
                        placeholder="Add internal notes..."
                        rows={2}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontWeight: 600 }}>Set status:</p>
                      {ALL_STATUSES.filter(s => s !== sub.status).map(s => {
                        const m = STATUS_META[s];
                        return (
                          <button
                            key={s}
                            disabled={isPending}
                            onClick={() => handleStatus(sub.id, s)}
                            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${m.bg}`, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}
                          >
                            Mark {m.label}
                          </button>
                        );
                      })}
                      <a
                        href={`mailto:${sub.email}?subject=Re: ${sub.reason ?? "Your inquiry"}`}
                        style={{ marginLeft: "auto", padding: "6px 16px", borderRadius: 6, background: "#f97316", color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                      >
                        Reply by Email →
                      </a>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
