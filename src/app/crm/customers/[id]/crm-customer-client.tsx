"use client";

import { useState, useTransition } from "react";
import { addCRMNote, deleteCRMNote, togglePinNote, logCRMActivity, updateUserRole, assignAccountManager } from "@/app/actions/crm";
import { sendContactReply } from "@/app/actions/send-reply";
import type { CRMNote, CRMActivity } from "@/app/actions/crm";

const C = { accent: "#f5c700", dark: "#0d0d0d" };

const ACTIVITY_ICONS: Record<string, string> = {
  order_placed: "🛒", order: "📦", quote: "📋", quote_created: "📋",
  email_sent: "✉️", contact_form: "📨", note: "📝", call: "📞",
  return: "↩️", return_requested: "↩️", review: "⭐",
};
const ACTIVITY_COLORS: Record<string, string> = {
  order_placed: "#22c55e", order: "#22c55e", quote: "#f5c700", quote_created: "#f5c700",
  email_sent: "#3b82f6", contact_form: "#8b5cf6", note: "#94a3b8", call: "#f97316",
  return: "#ef4444", return_requested: "#ef4444",
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── AM Assigner ───────────────────────────────────────────────────────────
export function AMAssigner({ customerId, currentAMId, accountManagers }: {
  customerId: number;
  currentAMId: number | null;
  accountManagers: { id: number; first_name: string; last_name: string; email: string }[];
}) {
  const [amId, setAmId] = useState<number | null>(currentAMId);
  const [saved, setSaved] = useState(false);
  const [, startT] = useTransition();

  function assign(newAmId: number | null) {
    setAmId(newAmId);
    setSaved(false);
    startT(async () => {
      await assignAccountManager(customerId, newAmId);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  const currentAM = accountManagers.find(am => am.id === amId);

  return (
    <div style={{ background: "var(--crm-surface2)", borderRadius: 8, border: "1px solid var(--crm-border)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--crm-muted)", margin: 0 }}>Account Manager</p>
        {saved && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✓ Saved</span>}
      </div>

      {/* Current AM display */}
      {currentAM ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
          background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5c700",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#000", flexShrink: 0 }}>
            {currentAM.first_name[0]}{currentAM.last_name[0]}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)", margin: 0 }}>
              {currentAM.first_name} {currentAM.last_name}
            </p>
            <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>{currentAM.email}</p>
          </div>
        </div>
      ) : (
        <div style={{ background: "#f1f5f9", borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, fontWeight: 600 }}>No account manager assigned</p>
        </div>
      )}

      {/* Dropdown */}
      <select
        value={amId ?? ""}
        onChange={e => assign(e.target.value ? Number(e.target.value) : null)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
          border: "1px solid var(--crm-border)", background: "var(--crm-surface)", cursor: "pointer", outline: "none" }}>
        <option value="">— Unassigned —</option>
        {accountManagers.map(am => (
          <option key={am.id} value={am.id}>
            {am.first_name} {am.last_name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Role Manager ─────────────────────────────────────────────────────────────
export function RoleManager({ customerId, currentRole, sessionRole }:
  { customerId: number; currentRole: string; sessionRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startT] = useTransition();

  const ROLES = [
    { value: "customer",        label: "Customer",        desc: "Standard account" },
    { value: "company_admin",   label: "Company Admin",   desc: "Manages their team" },
    { value: "account_manager", label: "Account Manager", desc: "CRM access" },
    ...(sessionRole === "admin" ? [
      { value: "manager",       label: "Manager",         desc: "Manages AMs" },
      { value: "admin",         label: "Admin",           desc: "Full platform access" },
    ] : []),
  ];

  const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    customer:        { bg: "#f1f5f9", color: "#475569" },
    company_admin:   { bg: "#ede9fe", color: "#5b21b6" },
    account_manager: { bg: "#fef3c7", color: "#92400e" },
    manager:         { bg: "#f0fdf4", color: "#15803d" },
    admin:           { bg: "#fce7f3", color: "#9d174d" },
  };

  function save(newRole: string) {
    setError(null);
    setSaved(false);
    startT(async () => {
      const res = await updateUserRole(customerId, newRole);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setRole(newRole);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.customer;

  return (
    <div style={{ background: "var(--crm-surface2)", borderRadius: 8, border: "1px solid var(--crm-border)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "var(--crm-muted)", margin: 0 }}>User Role</p>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
          background: colors.bg, color: colors.color, textTransform: "capitalize" }}>
          {role.replace("_", " ")}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ROLES.map(r => (
          <button key={r.value} onClick={() => save(r.value)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", borderRadius: 6, cursor: "pointer", textAlign: "left",
              border: `2px solid ${role === r.value ? "#f5c700" : "#e5e5e5"}`,
              background: role === r.value ? "#fffbeb" : "#fff",
              transition: "all 0.15s",
            }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0,
                color: role === r.value ? "#0d0d0d" : "#374151" }}>{r.label}</p>
              <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>{r.desc}</p>
            </div>
            {role === r.value && (
              <span style={{ color: "#f5c700", fontSize: 16, fontWeight: 900 }}>✓</span>
            )}
          </button>
        ))}
      </div>
      {saved && <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, margin: "8px 0 0" }}>✓ Role updated</p>}
      {error && <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, margin: "8px 0 0" }}>⚠ {error}</p>}
    </div>
  );
}

// ── Notes Panel ──────────────────────────────────────────────────────────────
export function NotesPanel({ customerId, initialNotes }: { customerId: number; initialNotes: CRMNote[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [, startT] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startT(async () => {
      await addCRMNote(customerId, body.trim());
      setBody("");
    });
  }

  function pin(id: number) { startT(async () => { await togglePinNote(id); }); }
  function del(id: number) {
    if (!confirm("Delete this note?")) return;
    startT(async () => { await deleteCRMNote(id); setNotes(n => n.filter(x => x.id !== id)); });
  }

  const pinned = notes.filter(n => n.pinned);
  const rest   = notes.filter(n => !n.pinned);

  return (
    <div>
      {/* Add note */}
      <div style={{ marginBottom: 16 }}>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Add a note, call log, or observation..."
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13,
            border: "1px solid var(--crm-border)", outline: "none", resize: "vertical",
            fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={submit} disabled={!body.trim()}
            style={{ background: C.accent, color: "#000", border: "none", borderRadius: 6,
              padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Save Note
          </button>
          <button onClick={() => { startT(async () => { await logCRMActivity(customerId, "call", "Logged a call"); }); }}
            style={{ background: "transparent", border: "1px solid var(--crm-border)", borderRadius: 6,
              padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--crm-muted)" }}>
            📞 Log Call
          </button>
        </div>
      </div>

      {/* Pinned notes */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--crm-muted2)", margin: "0 0 8px" }}>📌 Pinned</p>
          {pinned.map(n => <NoteCard key={n.id} note={n} onPin={pin} onDelete={del} />)}
        </div>
      )}

      {/* All notes */}
      {rest.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--crm-muted2)", margin: "0 0 8px" }}>All Notes</p>
          {rest.map(n => <NoteCard key={n.id} note={n} onPin={pin} onDelete={del} />)}
        </div>
      )}
      {notes.length === 0 && (
        <p style={{ color: "var(--crm-muted2)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          No notes yet. Add your first note above.
        </p>
      )}
    </div>
  );
}

function NoteCard({ note, onPin, onDelete }: { note: CRMNote; onPin: (id: number) => void; onDelete: (id: number) => void }) {
  return (
    <div style={{ background: note.pinned ? "#fffbeb" : "#f9f9f9",
      border: `1px solid ${note.pinned ? "#fde68a" : "#f0f0f0"}`,
      borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
      <p style={{ fontSize: 13, color: "var(--crm-text)", margin: "0 0 8px", lineHeight: 1.6 }}>{note.body}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--crm-muted2)" }}>
          {note.author_name} · {timeAgo(note.created_at)}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onPin(note.id)}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: note.pinned ? C.accent : "#d1d5db", padding: "2px 4px" }}>
            📌
          </button>
          <button onClick={() => onDelete(note.id)}
            style={{ background: "none", border: "none", cursor: "pointer",
              fontSize: 13, color: "#fca5a5", padding: "2px 4px" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity Feed ────────────────────────────────────────────────────────────
export function ActivityFeed({ activities }: { activities: CRMActivity[] }) {
  if (activities.length === 0) return (
    <p style={{ color: "var(--crm-muted2)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
      No activity recorded yet
    </p>
  );

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 17, top: 0, bottom: 0, width: 2,
        background: "#f0f0f0", zIndex: 0 }} />
      {activities.map((a, i) => (
        <div key={a.id} style={{ display: "flex", gap: 14, marginBottom: 16, position: "relative" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, zIndex: 1,
            background: `${ACTIVITY_COLORS[a.type] ?? "#94a3b8"}18`,
            border: `2px solid ${ACTIVITY_COLORS[a.type] ?? "#94a3b8"}60`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            {ACTIVITY_ICONS[a.type] ?? "📌"}
          </div>
          <div style={{ flex: 1, paddingTop: 6 }}>
            <p style={{ fontSize: 13, color: "var(--crm-text)", margin: "0 0 2px", fontWeight: 500 }}>
              {a.description}
            </p>
            <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>
              {a.author_name && a.author_name !== "System" ? `${a.author_name} · ` : ""}{timeAgo(a.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Email Sender ─────────────────────────────────────────────────────────────
export function EmailSender({ customerId, customerEmail, customerName }:
  { customerId: number; customerEmail: string; customerName: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [, startT] = useTransition();

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ background: "#0d0d0d", color: "#f5c700", border: "none", borderRadius: 8,
        padding: "10px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer", width: "100%" }}>
      ✉️ Send Email to {customerName}
    </button>
  );

  if (sent) return (
    <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "16px 20px", textAlign: "center" }}>
      <p style={{ fontWeight: 700, color: "#15803d", margin: 0 }}>✓ Email sent to {customerEmail}</p>
    </div>
  );

  function send() {
    if (!subject.trim() || !body.trim()) return;
    startT(async () => {
      await sendContactReply(0, customerEmail, customerName, subject, body);
      await logCRMActivity(customerId, "email_sent", `Sent email: "${subject}"`);
      setSent(true);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    border: "1px solid var(--crm-border)", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ background: "var(--crm-surface2)", borderRadius: 8, border: "1px solid var(--crm-border)", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>Email to {customerEmail}</p>
        <button onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--crm-muted2)" }}>✕</button>
      </div>
      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" style={{ ...inputStyle, marginBottom: 8 }} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message body..."
        rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 8 }} />
      <button onClick={send} disabled={!subject.trim() || !body.trim()}
        style={{ background: "#0d0d0d", color: "#f5c700", border: "none", borderRadius: 6,
          padding: "9px 20px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
        Send Email
      </button>
    </div>
  );
}
