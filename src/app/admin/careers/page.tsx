import { adminGetPostings } from "@/app/actions/careers";
import Link from "next/link";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:  { bg: "#f1f5f9", color: "#475569" },
  active: { bg: "#dcfce7", color: "#15803d" },
  closed: { bg: "#fee2e2", color: "#991b1b" },
};

export default async function AdminCareersPage() {
  const postings = await adminGetPostings();
  const active = postings.filter(p => p.status === "active");
  const total  = postings.reduce((s, p) => s + (p.application_count ?? 0), 0);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Careers</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>Manage job postings and applications</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/careers" target="_blank" style={{ padding: "9px 16px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", color: "#374151", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
            View Public Page ↗
          </Link>
          <Link href="/admin/careers/new" style={{ padding: "9px 18px", borderRadius: 8, background: "#f97316", color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            + New Posting
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Postings",  value: postings.length,                          color: "#0f172a" },
          { label: "Active Roles",    value: active.length,                            color: "#15803d" },
          { label: "Total Applicants", value: total,                                   color: "#1e40af" },
          { label: "Avg per Role",    value: active.length ? (total / active.length).toFixed(1) : "0", color: "#7c3aed" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {postings.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 0 16px" }}>No postings yet</p>
            <Link href="/admin/careers/new" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>Create your first job posting →</Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Title", "Department", "Type", "Location", "Status", "Applicants", "Posted", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {postings.map(p => {
                const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.draft;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700 }}>{p.title}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.department}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.type}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b" }}>{p.location}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: ss.bg, color: ss.color }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 700, color: (p.application_count ?? 0) > 0 ? "#1e40af" : "#94a3b8" }}>
                        {p.application_count ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Link href={`/admin/careers/${p.id}`} style={{ color: "#f97316", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>View</Link>
                        <Link href={`/admin/careers/${p.id}/edit`} style={{ color: "#64748b", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>Edit</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
