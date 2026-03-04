import { query } from "@/lib/db";
import { ErrorLogsClient } from "@/components/error-logs-client";

export type ErrorLog = {
  id: number;
  level: string;
  source: string;
  message: string;
  stack: string | null;
  context: Record<string, unknown>;
  url: string | null;
  user_id: number | null;
  user_email: string | null;
  created_at: string;
};

export default async function ErrorLogsPage() {
  const logs = await query<ErrorLog>(`
    SELECT el.id, el.level, el.source, el.message, el.stack,
           el.context, el.url, el.user_id, el.created_at,
           u.email AS user_email
    FROM error_logs el
    LEFT JOIN users u ON u.id = el.user_id
    ORDER BY el.created_at DESC
    LIMIT 500
  `);

  const stats = {
    total:  logs.length,
    errors: logs.filter(l => l.level === "error").length,
    warns:  logs.filter(l => l.level === "warn").length,
    infos:  logs.filter(l => l.level === "info").length,
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Error Logs</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          Last 500 entries — server and client errors captured automatically.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Logs",  value: stats.total,  bg: "#f8fafc", color: "var(--ad-text)" },
          { label: "Errors",      value: stats.errors, bg: "#fef2f2", color: "#dc2626" },
          { label: "Warnings",    value: stats.warns,  bg: "#fffbeb", color: "#d97706" },
          { label: "Info",        value: stats.infos,  bg: "#f0f9ff", color: "#0284c7" },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: 8, padding: "16px 20px", border: "1px solid var(--ad-border)" }}>
            <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ad-muted)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <ErrorLogsClient logs={logs} />
    </div>
  );
}
