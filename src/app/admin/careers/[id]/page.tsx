import { adminGetPostingById, adminGetApplications } from "@/app/actions/careers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ApplicantList } from "./applicants";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:  { bg: "#f1f5f9", color: "#475569" },
  active: { bg: "#dcfce7", color: "#15803d" },
  closed: { bg: "#fee2e2", color: "#991b1b" },
};

export default async function AdminCareerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [posting, applications] = await Promise.all([
    adminGetPostingById(Number(id)),
    adminGetApplications(Number(id)),
  ]);
  if (!posting) notFound();

  const ss = STATUS_STYLE[posting.status] ?? STATUS_STYLE.draft;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const pipeline = ["new","reviewing","interviewed","offered","rejected"].map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: applications.filter(a => a.status === s).length,
    s,
  }));

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Link href="/admin/careers" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Careers</Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{posting.title}</h1>
            <span style={{ padding: "2px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: ss.bg, color: ss.color }}>
              {posting.status}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0" }}>
            {posting.department} · {posting.location} · {posting.type}
            {posting.salary_range && ` · ${posting.salary_range}`}
            {" · "}Posted {fmtDate(posting.created_at)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {posting.status === "active" && (
            <Link href={`/careers/${posting.slug}`} target="_blank" style={{ padding: "8px 16px", borderRadius: 8, background: "white", border: "1px solid #e2e8f0", color: "#374151", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              View Live ↗
            </Link>
          )}
          <Link href={`/admin/careers/${id}/edit`} style={{ padding: "8px 18px", borderRadius: 8, background: "#f97316", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            Edit Posting
          </Link>
        </div>
      </div>

      {/* Pipeline summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 28 }}>
        {pipeline.map(p => (
          <div key={p.s} style={{ background: "white", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: p.count > 0 ? "#0f172a" : "#cbd5e1" }}>{p.count}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{p.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>

        {/* Applicants */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              Applications
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>({applications.length})</span>
            </h2>
          </div>

          {applications.length === 0 ? (
            <div style={{ background: "white", borderRadius: 10, padding: "48px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
              <p style={{ fontWeight: 700, color: "#64748b", margin: 0 }}>No applications yet</p>
              {posting.status === "draft" && (
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "8px 0 0" }}>Set the posting to Active so applicants can find it.</p>
              )}
            </div>
          ) : (
            <ApplicantList applications={applications} />
          )}
        </div>

        {/* Posting sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>Job Summary</h3>
            {[
              { label: "Department", val: posting.department },
              { label: "Type",       val: posting.type },
              { label: "Location",   val: posting.location },
              { label: "Salary",     val: posting.salary_range ?? "Not specified" },
              { label: "Posted",     val: fmtDate(posting.created_at) },
              { label: "Updated",    val: fmtDate(posting.updated_at) },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f8fafc", fontSize: 13 }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{r.val}</span>
              </div>
            ))}
          </div>

          {posting.description && (
            <div style={{ background: "white", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>Description Preview</h3>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" }}>
                {posting.description}
              </p>
              <Link href={`/admin/careers/${id}/edit`} style={{ fontSize: 12, color: "#f97316", fontWeight: 700, textDecoration: "none", display: "block", marginTop: 8 }}>
                Edit full description →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
