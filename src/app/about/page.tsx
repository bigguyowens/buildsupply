import Image from "next/image";
import Link from "next/link";

const STATS = [
  { value: "12+",    label: "Years in Business"   },
  { value: "40,000+",label: "Products Available"  },
  { value: "850+",   label: "Brands Carried"       },
  { value: "99.2%",  label: "On-Time Fulfillment"  },
];

const VALUES = [
  {
    icon: "🏗",
    title: "Built for the Trade",
    body: "We started on job sites, not in boardrooms. Every product decision we make is filtered through a single question: would a tradesperson stake their project on this?",
  },
  {
    icon: "⚡",
    title: "Speed When It Counts",
    body: "When work is held up waiting on materials, every hour costs money. Our distribution network is optimized for same-day and next-day fulfillment on core items.",
  },
  {
    icon: "🔍",
    title: "No Substitutions",
    body: "We stock the right grade, the right spec, the right brand. We don't swap out industry-standard products for cheaper alternatives without telling you.",
  },
  {
    icon: "🤝",
    title: "Account-Based Relationships",
    body: "Dedicated account managers, volume pricing, and net-30 terms for qualified contractors. We grow when you grow.",
  },
];

const LEADERSHIP = [
  {
    name: "Marcus Webb",
    title: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    bio: "20 years in industrial distribution. Former VP at Ferguson before founding BuildSupply in 2012.",
  },
  {
    name: "Sandra Okafor",
    title: "VP of Operations",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    bio: "Logistics and supply chain expert. Reduced average order fulfillment time by 40% since joining in 2018.",
  },
  {
    name: "James Tran",
    title: "Head of Sourcing",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    bio: "Manages relationships with 850+ manufacturer partners. Former category manager at Grainger.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", background: "var(--color-primary)", minHeight: 420, display: "flex", alignItems: "center" }}>
        {/* Background texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }} />
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: "45%", opacity: 0.15,
          backgroundImage: "url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=60)",
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        {/* Fade overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--color-primary) 55%, transparent 100%)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>
            Our Story
          </p>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: "white", lineHeight: 1.1, margin: "0 0 20px", maxWidth: 600 }}>
            Supply built for people<br />who build things.
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 480, lineHeight: 1.7, margin: "0 0 32px" }}>
            Founded in 2012, BuildSupply exists to put industrial-grade materials in the hands of the contractors, foremen, and project managers who need them — fast, reliably, and at the right price.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/products" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              Shop the Catalog
            </Link>
            <Link href="/contact" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              Talk to an Account Manager
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats bar ──────────────────────────────────── */}
      <div style={{ background: "var(--color-accent)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "28px 0", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.25)" : "none" }}>
              <p style={{ fontSize: 34, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mission section ────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>Our Mission</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, margin: "0 0 24px", color: "var(--color-foreground)" }}>
              The supply house that doesn&apos;t make you wait
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#475569", marginBottom: 20 }}>
              The construction industry has always tolerated slow, unreliable supply chains because there weren&apos;t better options. We decided to be the better option.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#475569", marginBottom: 20 }}>
              Our warehouses are stocked to keep even large projects moving. Our catalog is curated by people who understand what spec-grade really means. And our account team is staffed by former tradespeople who speak your language.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#475569" }}>
              We&apos;re not trying to be Amazon for construction. We&apos;re trying to be the best supply house in the business — one that happens to have a great website.
            </p>
          </div>
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3" }}>
            <Image
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80"
              alt="Construction workers on site"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(15,23,42,0.8) 0%, transparent 100%)", padding: "24px 20px 20px" }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, margin: 0 }}>Commercial jobsite — Phoenix, AZ · 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Values ─────────────────────────────────────── */}
      <div style={{ background: "#f8fafc", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>What We Stand For</p>
            <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "var(--color-foreground)" }}>Principles we don&apos;t compromise on</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{ background: "white", borderRadius: 10, padding: "28px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px", color: "var(--color-foreground)" }}>{v.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Leadership ─────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>The Team</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "var(--color-foreground)" }}>Leadership</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
          {LEADERSHIP.map((person, i) => (
            <div key={i} style={{ background: "white", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "relative", height: 220 }}>
                <Image src={person.image} alt={person.name} fill style={{ objectFit: "cover" }} sizes="300px" />
              </div>
              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 3px", color: "var(--color-foreground)" }}>{person.name}</h3>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)", margin: "0 0 12px" }}>{person.title}</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b", margin: 0 }}>{person.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA banner ─────────────────────────────────── */}
      <div style={{ background: "var(--color-primary)", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 12px" }}>Ready to open an account?</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 480, margin: "0 auto 28px" }}>
          Volume pricing, dedicated account management, and net-30 terms for qualified contractors.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/contact" style={{ display: "inline-block", padding: "13px 32px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Contact Our Team
          </Link>
          <Link href="/register" style={{ display: "inline-block", padding: "13px 32px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            Create an Account
          </Link>
        </div>
      </div>

    </div>
  );
}
