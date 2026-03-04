import { getActivePostings, getDepartments } from "@/app/actions/careers";
import Link from "next/link";
import Image from "next/image";

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

// Unsplash images — real photos, no auth needed
const LIFE_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    alt: "Team collaboration session",
    caption: "Weekly all-hands — everyone's voice counts",
  },
  {
    src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    alt: "Remote team video call",
    caption: "Remote-first means everyone's a first-class citizen",
  },
  {
    src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    alt: "Team offsite event",
    caption: "Annual company offsite — we actually like each other",
  },
];

const VALUES = [
  { icon: "🏗️", title: "Build with purpose", desc: "We're solving real problems for real people in the trades — not chasing trends." },
  { icon: "🔍", title: "Clarity over cleverness", desc: "We write code and make decisions that the next person can understand and trust." },
  { icon: "🚀", title: "Ship, learn, improve", desc: "We move fast and take ownership. Done is better than perfect, but we don't stop there." },
  { icon: "🤝", title: "Honest by default", desc: "We give direct feedback, share context freely, and treat each other like adults." },
];

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

      {/* ── Hero ── */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 56px" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", margin: "0 0 12px" }}>
            We&apos;re Hiring
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white", margin: "0 0 16px", lineHeight: 1.1 }}>
            Build the future<br />of supply with us
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 0 32px", lineHeight: 1.7 }}>
            We&apos;re a growing team passionate about making construction supply smarter, faster, and easier for the people who build things.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: "🌎", label: "Remote-first" },
              { icon: "🏥", label: "Full benefits" },
              { icon: "📈", label: "Equity options" },
              { icon: "🎓", label: "$1,500 learning budget" },
            ].map(b => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 16px" }}>
                <span style={{ fontSize: 16 }}>{b.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 48, alignItems: "start" }} className="careers-layout">

          {/* ── Left: job listings ── */}
          <div>
            {/* Department filter */}
            {departments.length > 1 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
                <Link href="/careers" style={{ padding: "7px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", background: !dept ? "var(--color-accent)" : "white", color: !dept ? "white" : "#64748b", border: "1px solid", borderColor: !dept ? "var(--color-accent)" : "#e2e8f0" }}>
                  All ({postings.length})
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {postings.map(p => <JobCard key={p.id} job={p} />)}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
                {Object.entries(byDept).map(([deptName, jobs]) => (
                  <div key={deptName}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>{deptName}</h2>
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
          </div>

          {/* ── Right: company sidebar ── */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 28, position: "sticky", top: 24 }}>

            {/* Life at BuildSupply photo stack */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-accent)", margin: "0 0 12px" }}>
                Life at BuildSupply
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {LIFE_PHOTOS.map((photo, i) => (
                  <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", position: "relative" }}>
                    <div style={{ position: "relative", height: i === 0 ? 200 : 150 }}>
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="360px"
                        style={{ objectFit: "cover" }}
                      />
                      {/* caption overlay */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)", padding: "24px 14px 12px" }}>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", margin: 0, fontWeight: 600 }}>{photo.caption}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About the company */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px 22px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", color: "#0f172a" }}>About BuildSupply</h3>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, margin: "0 0 12px" }}>
                We&apos;re modernizing how the construction industry buys. Contractors, project managers, and procurement teams rely on BuildSupply to source materials faster, track spending smarter, and keep job sites moving.
              </p>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, margin: 0 }}>
                Founded in Atlanta, we&apos;re a remote-first company with a tight-knit team that cares deeply about the craft — both in what we build and how we build it.
              </p>
            </div>

            {/* Our values */}
            <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px 22px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 18px", color: "#0f172a" }}>How we work</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {VALUES.map(v => (
                  <div key={v.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{v.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 3px", color: "#0f172a" }}>{v.title}</p>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 12, padding: "24px 22px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(249,115,22,0.9)", margin: "0 0 16px" }}>By the numbers</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  { num: "42",   label: "Team members" },
                  { num: "100%", label: "Remote-friendly" },
                  { num: "12",   label: "Countries represented" },
                  { num: "4.8★", label: "Glassdoor rating" },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 2px" }}>{s.num}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Don't see a fit CTA */}
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "20px 22px" }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#c2410c", margin: "0 0 6px" }}>Don&apos;t see your role?</p>
              <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, margin: "0 0 14px" }}>
                We&apos;re always interested in talented people. Send us a note and tell us what you&apos;d build here.
              </p>
              <Link href="/contact" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 8, background: "#f97316", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                Get in touch →
              </Link>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}

function JobCard({ job }: { job: { id: number; title: string; slug: string; department: string; location: string; type: string; salary_range: string | null } }) {
  return (
    <Link href={`/careers/${job.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "white", borderRadius: 10, border: "1px solid #e2e8f0",
        padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{job.title}</h3>
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
