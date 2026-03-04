import { getActivePostings, getDepartments } from "@/app/actions/careers";
import Link from "next/link";

const TYPE_COLOR: Record<string, string> = {
  "Full-Time":  "#dbeafe",
  "Part-Time":  "#fef9c3",
  "Contract":   "#ede9fe",
  "Internship": "#dcfce7",
};
const TYPE_TEXT: Record<string, string> = {
  "Full-Time":  "#1e40af",
  "Part-Time":  "#854d0e",
  "Contract":   "#6d28d9",
  "Internship": "#15803d",
};

export default async function CareersPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const { dept } = await searchParams;
  const [postings, departments] = await Promise.all([
    getActivePostings(dept),
    getDepartments(),
  ]);

  const byDept = postings.reduce<Record<string, typeof postings>>((acc, p) => {
    (acc[p.department] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Hero */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 56px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", margin: "0 0 12px" }}>
            We&apos;re Hiring
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.1 }}>
            Build the future<br />of supply with us
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 0 32px", lineHeight: 1.7 }}>
            We&apos;re a growing team passionate about making construction supply smarter, faster, and easier. Join us.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { icon: "🌎", label: "Remote-first" },
              { icon: "🏥", label: "Full benefits" },
              { icon: "📈", label: "Equity options" },
              { icon: "🎓", label: "Learning budget" },
            ].map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>

        {/* Department filter */}
        {departments.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 40 }}>
            <Link href="/careers" style={{ padding: "7px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", background: !dept ? "var(--color-accent)" : "white", color: !dept ? "white" : "#64748b", border: "1px solid", borderColor: !dept ? "var(--color-accent)" : "#e2e8f0" }}>
              All Departments ({postings.length})
            </Link>
            {departments.map(d => (
              <Link key={d} href={`/careers?dept=${encodeURIComponent(d)}`} style={{ padding: "7px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", background: dept === d ? "var(--color-accent)" : "white", color: dept === d ? "white" : "#64748b", border: "1px solid", borderColor: dept === d ? "var(--color-accent)" : "#e2e8f0" }}>
                {d}
              </Link>
            ))}
          </div>
        )}

        {postings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 16px" }}>🔭</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>No open roles right now</h2>
            <p style={{ color: "#64748b", fontSize: 15 }}>Check back soon — we&apos;re always growing.</p>
          </div>
        ) : dept ? (
          /* Flat list when dept filtered */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {postings.map(p => <JobCard key={p.id} job={p} />)}
          </div>
        ) : (
          /* Grouped by department */
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {Object.entries(byDept).map(([deptName, jobs]) => (
              <div key={deptName}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{deptName}</h2>
                  <span style={{ fontSize: 12, fontWeight: 700, background: "#f1f5f9", color: "#64748b", padding: "2px 10px", borderRadius: 9999 }}>
                    {jobs.length} open role{jobs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {jobs.map(p => <JobCard key={p.id} job={p} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JobCard({ job }: { job: { id: number; title: string; slug: string; department: string; location: string; type: string; salary_range: string | null } }) {
  return (
    <Link href={`/careers/${job.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "white", borderRadius: 10, border: "1px solid #e2e8f0",
        padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s, border-color 0.15s",
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{job.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>📍 {job.location}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 9999, background: TYPE_COLOR[job.type] ?? "#f1f5f9", color: TYPE_TEXT[job.type] ?? "#475569" }}>
              {job.type}
            </span>
            {job.salary_range && (
              <span style={{ fontSize: 13, color: "#15803d", fontWeight: 700 }}>💰 {job.salary_range}</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-accent)", flexShrink: 0, marginLeft: 16 }}>
          Apply →
        </span>
      </div>
    </Link>
  );
}
