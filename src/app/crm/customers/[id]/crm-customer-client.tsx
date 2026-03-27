"use client";

import { useState, useTransition } from "react";
import { addCRMNote, deleteCRMNote, togglePinNote, logCRMActivity } from "@/app/actions/crm";
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
            border: "1px solid #e5e5e5", outline: "none", resize: "vertical",
            fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={submit} disabled={!body.trim()}
            style={{ background: C.accent, color: "#000", border: "none", borderRadius: 6,
              padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Save Note
          </button>
          <button onClick={() => { startT(async () => { await logCRMActivity(customerId, "call", "Logged a call"); }); }}
            style={{ background: "transparent", border: "1px solid #e5e5e5", borderRadius: 6,
              padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>
            📞 Log Call
          </button>
        </div>
      </div>

      {/* Pinned notes */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "#9ca3af", margin: "0 0 8px" }}>📌 Pinned</p>
          {pinned.map(n => <NoteCard key={n.id} note={n} onPin={pin} onDelete={del} />)}
        </div>
      )}

      {/* All notes */}
      {rest.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "#9ca3af", margin: "0 0 8px" }}>All Notes</p>
          {rest.map(n => <NoteCard key={n.id} note={n} onPin={pin} onDelete={del} />)}
        </div>
      )}
      {notes.length === 0 && (
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
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
      <p style={{ fontSize: 13, color: "#0d0d0d", margin: "0 0 8px", lineHeight: 1.6 }}>{note.body}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
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
    <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
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
            <p style={{ fontSize: 13, color: "#0d0d0d", margin: "0 0 2px", fontWeight: 500 }}>
              {a.description}
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
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
    border: "1px solid #e5e5e5", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ background: "#f9f9f9", borderRadius: 8, border: "1px solid #e5e5e5", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>Email to {customerEmail}</p>
        <button onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>✕</button>
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
