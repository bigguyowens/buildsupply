"use client";

import { useState, useTransition } from "react";
import type { ErrorLog } from "@/app/admin/error-logs/page";

const LEVEL_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  error: { bg: "#fef2f2", color: "#dc2626", label: "ERROR" },
  warn:  { bg: "#fffbeb", color: "#d97706", label: "WARN"  },
  info:  { bg: "#f0f9ff", color: "#0284c7", label: "INFO"  },
};

async function clearLogsAction() {
  await fetch("/api/log-error/clear", { method: "POST" });
}

export function ErrorLogsClient({ logs: initial }: { logs: ErrorLog[] }) {
  const [logs, setLogs]         = useState(initial);
  const [filter, setFilter]     = useState<string>("all");
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = logs.filter(log => {
    const matchLevel  = filter === "all" || log.level === filter;
    const matchSearch = !search || 
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      (log.source ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.url ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  function clearLogs() {
    startTransition(async () => {
      await clearLogsAction();
      setLogs([]);
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <input
          placeholder="Search message, source, URL, user…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
        />

        {/* Level filter tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "error", "warn", "info"].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              style={{
                padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                background: filter === lvl ? "#0f172a" : "#f1f5f9",
                color:      filter === lvl ? "white"   : "#64748b",
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Clear button */}
        <button
          onClick={clearLogs}
          disabled={pending || logs.length === 0}
          style={{
            padding: "7px 16px", borderRadius: 6, border: "1px solid #fecaca",
            background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 700,
            cursor: pending || logs.length === 0 ? "not-allowed" : "pointer",
            opacity: logs.length === 0 ? 0.5 : 1,
          }}
        >
          {pending ? "Clearing…" : "🗑 Clear All"}
        </button>
      </div>

      {/* Results count */}
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>
        Showing {filtered.length} of {logs.length} entries
      </p>

      {/* Log table */}
      {filtered.length === 0 ? (
        <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: "48px 24px", textAlign: "center", color: "#94a3b8" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
          <p style={{ fontWeight: 700, fontSize: 15 }}>No logs found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>{logs.length === 0 ? "Everything is running clean." : "Try adjusting your filters."}</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {filtered.map((log, i) => {
            const style = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.error;
            const isOpen = expanded === log.id;
            const date   = new Date(log.created_at);

            return (
              <div
                key={log.id}
                style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  style={{ display: "grid", gridTemplateColumns: "80px 90px 120px 1fr 160px", gap: 12, padding: "12px 16px", cursor: "pointer", alignItems: "center", background: isOpen ? "#f8fafc" : "white" }}
                >
                  {/* Level badge */}
                  <span style={{ background: style.bg, color: style.color, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 4, textAlign: "center", letterSpacing: "0.05em" }}>
                    {style.label}
                  </span>

                  {/* Source */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.source ?? "—"}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {/* Message */}
                  <span style={{ fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.message}
                  </span>

                  {/* User */}
                  <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.user_email ?? "Guest"}
                  </span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      {log.url && (
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>URL</p>
                          <p style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{log.url}</p>
                        </div>
                      )}
                      {log.user_email && (
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>User</p>
                          <p style={{ fontSize: 12, color: "#475569" }}>{log.user_email} (ID: {log.user_id})</p>
                        </div>
                      )}
                    </div>

                    {log.stack && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Stack Trace</p>
                        <pre style={{ background: "#0f172a", color: "#e2e8f0", padding: "12px 16px", borderRadius: 6, fontSize: 11, overflow: "auto", maxHeight: 200, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {log.stack}
                        </pre>
                      </div>
                    )}

                    {log.context && Object.keys(log.context).length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>Context</p>
                        <pre style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "10px 14px", borderRadius: 6, fontSize: 11, overflow: "auto", maxHeight: 150, margin: 0, whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </div>
                    )}
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
