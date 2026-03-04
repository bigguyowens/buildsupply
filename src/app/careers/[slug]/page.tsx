import { getPostingBySlug } from "@/app/actions/careers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ApplyForm } from "./apply-form";

const TYPE_COLOR: Record<string, string> = {
  "Full-Time":  "#dbeafe", "Part-Time": "#fef9c3",
  "Contract":   "#ede9fe", "Internship": "#dcfce7",
};
const TYPE_TEXT: Record<string, string> = {
  "Full-Time":  "#1e40af", "Part-Time": "#854d0e",
  "Contract":   "#6d28d9", "Internship": "#15803d",
};

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posting = await getPostingBySlug(slug);
  if (!posting) notFound();

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 36px" }}>
          <Link href="/careers" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 14 }}>
            ← All open roles
          </Link>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.15 }}>
            {posting.title}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>📍 {posting.location}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>🏢 {posting.department}</span>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 9999, background: TYPE_COLOR[posting.type] ?? "#f1f5f9", color: TYPE_TEXT[posting.type] ?? "#475569" }}>
              {posting.type}
            </span>
            {posting.salary_range && (
              <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 700 }}>💰 {posting.salary_range}</span>
            )}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Posted {fmtDate(posting.created_at)}</span>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 40, alignItems: "start" }} className="career-detail-layout">

        {/* Left: description */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {posting.description && (
            <section>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px", color: "#0f172a" }}>About the Role</h2>
              <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {posting.description}
              </div>
            </section>
          )}

          {posting.requirements && (
            <section>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 16px", color: "#0f172a" }}>Requirements</h2>
              <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {posting.requirements}
              </div>
            </section>
          )}

          {/* Perks */}
          <section style={{ background: "#f8fafc", borderRadius: 12, padding: "24px 28px", border: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px", color: "#0f172a" }}>Why BuildSupply?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: "🌎", title: "Remote-first", desc: "Work from wherever you do your best work" },
                { icon: "🏥", title: "Full benefits",  desc: "Medical, dental, and vision on day one" },
                { icon: "📈", title: "Equity",          desc: "Ownership stake in what we're building" },
                { icon: "🎓", title: "Learning budget", desc: "$1,500/year for courses and conferences" },
                { icon: "🏖️", title: "Unlimited PTO",  desc: "Take time when you need it" },
                { icon: "💻", title: "Home office",     desc: "$500 setup stipend" },
              ].map(p => (
                <div key={p.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: "#0f172a" }}>{p.title}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: apply form */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: "28px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#0f172a" }}>Apply for this role</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>Takes about 5 minutes. No account needed.</p>
            <ApplyForm postingId={posting.id} postingTitle={posting.title} />
          </div>
        </div>

      </main>
    </div>
  );
}
