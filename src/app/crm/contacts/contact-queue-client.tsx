"use client";

import { useState, useTransition } from "react";
import { sendContactReply } from "@/app/actions/send-reply";

type Contact = { id: number; name: string; email: string; reason: string | null; message: string; status: string; created_at: string; replied_at: string | null };

export function ContactQueueClient({ contacts }: { contacts: Contact[] }) {
  const [tab, setTab] = useState<"new" | "replied" | "all">("new");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sent, setSent] = useState<number[]>([]);
  const [, startT] = useTransition();

  const filtered = contacts.filter(c =>
    tab === "all" ? true : tab === "new" ? c.status === "new" : c.status === "replied"
  );
  const newCount = contacts.filter(c => c.status === "new").length;

  function sendReply() {
    if (!selected || !replyBody.trim()) return;
    startT(async () => {
      await sendContactReply(selected.id, selected.email, selected.name, `Re: ${selected.reason ?? "Your inquiry"}`, replyBody);
      setSent(s => [...s, selected.id]);
      setReplyBody("");
      setSelected(null);
    });
  }

  const tabs: { key: typeof tab; label: string; count?: number }[] = [
    { key: "new",     label: "New",     count: newCount },
    { key: "replied", label: "Replied" },
    { key: "all",     label: "All",     count: contacts.length },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

      {/* Left: list */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f1f1", padding: "0 16px" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "12px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              background: "none", border: "none",
              borderBottom: tab === t.key ? "2px solid #f5c700" : "2px solid transparent",
              color: tab === t.key ? "#0d0d0d" : "#9ca3af",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
              {t.count !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 999,
                  background: t.key === "new" && t.count > 0 ? "#ef4444" : "#f1f1f1",
                  color: t.key === "new" && t.count > 0 ? "#fff" : "#9ca3af" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 14, padding: "40px 24px", textAlign: "center" }}>
            No submissions in this category
          </p>
        ) : filtered.map((c, i) => (
          <div key={c.id} onClick={() => { setSelected(c); setReplyBody(""); }}
            style={{ padding: "14px 18px", borderBottom: "1px solid #f9f9f9", cursor: "pointer",
              background: selected?.id === c.id ? "#fffbeb" : sent.includes(c.id) ? "#f0fdf4" : "#fff",
              borderLeft: `3px solid ${selected?.id === c.id ? "#f5c700" : sent.includes(c.id) ? "#22c55e" : "transparent"}`,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d" }}>{c.name}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: sent.includes(c.id) || c.status === "replied" ? "#dcfce7" : "#fee2e2",
                  color: sent.includes(c.id) || c.status === "replied" ? "#15803d" : "#991b1b" }}>
                  {sent.includes(c.id) || c.status === "replied" ? "Replied" : "New"}
                </span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                  {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>{c.reason ?? "General Inquiry"}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
              {c.message.slice(0, 80)}{c.message.length > 80 ? "…" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Right: reply panel */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
        {!selected ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>✉️</p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Select a submission to reply</p>
          </div>
        ) : (
          <div>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1", background: "#0d0d0d" }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#f5c700", margin: "0 0 2px" }}>{selected.reason ?? "General Inquiry"}</p>
              <p style={{ fontSize: 12, color: "#6b6b6b", margin: 0 }}>{selected.name} · {selected.email}</p>
            </div>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #f9f9f9",
              background: "#fafafa", maxHeight: 180, overflowY: "auto" }}>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.7,
                whiteSpace: "pre-wrap" }}>{selected.message}</p>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 8px" }}>Your Reply</p>
              <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
                rows={6} placeholder={`Reply to ${selected.name}...`}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 13,
                  border: "1px solid #e5e5e5", outline: "none", resize: "vertical",
                  fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", marginBottom: 12 }} />
              <button onClick={sendReply} disabled={!replyBody.trim()}
                style={{ background: "#0d0d0d", color: "#f5c700", border: "none", borderRadius: 8,
                  padding: "10px 24px", fontWeight: 800, fontSize: 13, cursor: "pointer", width: "100%" }}>
                Send Reply via Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
