'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContactSubmission } from "@/app/actions/contact";
import { updateSubmissionStatus } from "@/app/actions/contact";
import { sendContactReply } from "@/app/actions/send-reply";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  new:      { label: "New",      bg: "#dbeafe", color: "#1e40af" },
  read:     { label: "Read",     bg: "#f3f4f6", color: "var(--ad-text2)" },
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

function ReplyForm({ sub, onSent }: { sub: ContactSubmission; onSent: () => void }) {
  const [subject, setSubject] = useState(`Re: ${sub.reason ?? "Your inquiry"}`);
  const [body, setBody]       = useState(`Hi ${sub.name.split(" ")[0]},\n\nThank you for reaching out to BuildSupply.\n\n\n\nBest regards,\nThe BuildSupply Team`);
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; error?: string } | null>(null);

  async function handleSend() {
    setSending(true);
    setResult(null);
    const res = await sendContactReply(sub.id, sub.email, sub.name, subject, body);
    setSending(false);
    setResult(res);
    if (res.ok) setTimeout(onSent, 1200);
  }

  return (
    <div style={{ background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted)", margin: 0 }}>
        Reply to {sub.name} &lt;{sub.email}&gt;
      </p>

      {/* Subject */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Subject</label>
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </div>

      {/* Body */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--ad-muted2)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Message</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={8}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
        />
      </div>

      {/* Result feedback */}
      {result && (
        <p style={{ fontSize: 13, fontWeight: 600, color: result.ok ? "#15803d" : "#ef4444", margin: 0 }}>
          {result.ok ? "✓ Email sent — submission marked as Replied." : `Error: ${result.error}`}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onSent} disabled={sending} style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "var(--ad-muted)" }}>
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          style={{ padding: "8px 22px", borderRadius: 6, border: "none", background: sending ? "#94a3b8" : "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {sending ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ animation: "spin 1s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
              </svg>
              Sending...
            </>
          ) : "Send Reply"}
        </button>
      </div>
    </div>
  );
}

export function ContactAdminClient({ submissions }: { submissions: ContactSubmission[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded]     = useState<number | null>(null);
  const [replyOpen, setReplyOpen]   = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notes, setNotes]           = useState<Record<number, string>>({});

  const filtered = filterStatus === "all" ? submissions : submissions.filter(s => s.status === filterStatus);
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
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ad-muted2)", margin: "0 0 4px" }}>Admin</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>Contact Submissions</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 13, margin: 0 }}>{submissions.length} total · {counts.new} new</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", ...ALL_STATUSES] as const).map(s => {
          const active = filterStatus === s;
          const meta = s === "all" ? null : STATUS_META[s];
          return (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", background: active ? (meta?.bg ?? "#0f172a") : "white", color: active ? (meta?.color ?? "white") : "#64748b", borderColor: active ? (meta?.bg ?? "#0f172a") : "#e2e8f0" }}>
              {s === "all" ? "All" : STATUS_META[s].label} ({counts[s as keyof typeof counts]})
            </button>
          );
        })}
      </div>

      {/* Submissions */}
      {filtered.length === 0 ? (
        <div style={{ background: "var(--ad-surface)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: "64px 24px", textAlign: "center", color: "var(--ad-muted2)", fontSize: 14 }}>
          No submissions{filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(sub => {
            const isOpen   = expanded === sub.id;
            const isReply  = replyOpen === sub.id;
            return (
              <div key={sub.id} style={{ background: "var(--ad-surface)", borderRadius: 8, border: `1px solid ${sub.status === "new" ? "#bfdbfe" : "#e2e8f0"}`, overflow: "hidden", boxShadow: sub.status === "new" ? "0 0 0 1px #bfdbfe" : "none" }}>

                {/* Row header */}
                <button onClick={() => { setExpanded(isOpen ? null : sub.id); setReplyOpen(null); }} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "var(--ad-text)" }}>{sub.name}</p>
                      <p style={{ fontSize: 12, color: "var(--ad-muted)", margin: "1px 0 0" }}>{sub.email}</p>
                    </div>
                    {sub.company && <p style={{ fontSize: 12, color: "var(--ad-muted2)", margin: 0 }}>{sub.company}</p>}
                    {sub.reason  && <p style={{ fontSize: 12, color: "var(--ad-muted)", margin: 0, fontStyle: "italic" }}>re: {sub.reason}</p>}
                    <p style={{ fontSize: 12, color: "var(--ad-muted2)", margin: 0, marginLeft: "auto" }}>
                      {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <StatusBadge status={sub.status} />
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--ad-border2)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Contact info */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {[{ label: "Email", value: sub.email }, { label: "Phone", value: sub.phone }, { label: "Company", value: sub.company }].filter(f => f.value).map(f => (
                        <div key={f.label}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted2)", margin: "0 0 2px" }}>{f.label}</p>
                          <p style={{ fontSize: 13, color: "var(--ad-text)", margin: 0, fontWeight: 600 }}>{f.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Message */}
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted2)", margin: "0 0 6px" }}>Message</p>
                      <div style={{ background: "var(--ad-surface2)", borderRadius: 6, padding: "14px 16px", fontSize: 14, color: "var(--ad-text2)", lineHeight: 1.7, whiteSpace: "pre-wrap", border: "1px solid var(--ad-border)" }}>
                        {sub.message}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted2)", margin: "0 0 6px" }}>Internal Notes</p>
                      <textarea defaultValue={sub.notes ?? ""} onChange={e => setNotes(n => ({ ...n, [sub.id]: e.target.value }))} placeholder="Add internal notes..." rows={2}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
                    </div>

                    {/* Reply form */}
                    {isReply && (
                      <ReplyForm sub={sub} onSent={() => { setReplyOpen(null); router.refresh(); }} />
                    )}

                    {/* Action row */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <p style={{ fontSize: 12, color: "var(--ad-muted2)", margin: 0, fontWeight: 600 }}>Set status:</p>
                      {ALL_STATUSES.filter(s => s !== sub.status).map(s => {
                        const m = STATUS_META[s];
                        return (
                          <button key={s} disabled={isPending} onClick={() => handleStatus(sub.id, s)}
                            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${m.bg}`, background: m.bg, color: m.color, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: isPending ? 0.6 : 1 }}>
                            Mark {m.label}
                          </button>
                        );
                      })}
                      {!isReply && (
                        <button onClick={() => setReplyOpen(sub.id)}
                          style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 6, background: "var(--color-accent)", color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Reply by Email
                        </button>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
