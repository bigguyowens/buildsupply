import Image from "next/image";
import Link from "next/link";
import { getAboutContent } from "@/app/actions/about";

// ── Types ─────────────────────────────────────────────────
type HeroContent     = { tag?: string; headline?: string; subtext?: string; cta_primary_text?: string; cta_primary_link?: string; cta_secondary_text?: string; cta_secondary_link?: string; bg_image?: string };
type StatsContent    = { stats?: { value: string; label: string }[] };
type MissionContent  = { tag?: string; headline?: string; paragraphs?: string[]; image?: string; image_caption?: string };
type ValuesContent   = { tag?: string; headline?: string; values?: { icon: string; title: string; body: string }[] };
type LeaderContent   = { tag?: string; headline?: string; people?: { name: string; title: string; image: string; bio: string }[] };
type CtaContent      = { headline?: string; subtext?: string; cta_primary_text?: string; cta_primary_link?: string; cta_secondary_text?: string; cta_secondary_link?: string };

// ── Fallbacks ─────────────────────────────────────────────
const HERO_DEFAULT: HeroContent = {
  tag: "Our Story",
  headline: "Supply built for people who build things.",
  subtext: "Founded in 2012, BuildSupply exists to put industrial-grade materials in the hands of the contractors, foremen, and project managers who need them — fast, reliably, and at the right price.",
  cta_primary_text: "Shop the Catalog", cta_primary_link: "/products",
  cta_secondary_text: "Talk to an Account Manager", cta_secondary_link: "/contact",
  bg_image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=60",
};

const STATS_DEFAULT: StatsContent = { stats: [
  { value: "12+", label: "Years in Business" }, { value: "40,000+", label: "Products Available" },
  { value: "850+", label: "Brands Carried" },   { value: "99.2%", label: "On-Time Fulfillment" },
]};

export default async function AboutPage() {
  const cms = await getAboutContent();

  const hero       = (cms.hero?.content       ?? HERO_DEFAULT)   as HeroContent;
  const stats      = (cms.stats?.content      ?? STATS_DEFAULT)  as StatsContent;
  const mission    = (cms.mission?.content    ?? {})             as MissionContent;
  const values     = (cms.values?.content     ?? {})             as ValuesContent;
  const leadership = (cms.leadership?.content ?? {})             as LeaderContent;
  const cta        = (cms.cta?.content        ?? {})             as CtaContent;

  const heroOn       = cms.hero?.enabled       !== false;
  const statsOn      = cms.stats?.enabled      !== false;
  const missionOn    = cms.mission?.enabled    !== false;
  const valuesOn     = cms.values?.enabled     !== false;
  const leadershipOn = cms.leadership?.enabled !== false;
  const ctaOn        = cms.cta?.enabled        !== false;

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────── */}
      {heroOn && (
        <div style={{ position: "relative", overflow: "hidden", background: "var(--color-primary)", minHeight: 420, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
          {hero.bg_image && (
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "45%", opacity: 0.15, backgroundImage: `url(${hero.bg_image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--color-primary) 55%, transparent 100%)" }} />
          <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
            {hero.tag && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 16 }}>{hero.tag}</p>}
            <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, color: "white", lineHeight: 1.1, margin: "0 0 20px", maxWidth: 600 }}>{hero.headline}</h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 480, lineHeight: 1.7, margin: "0 0 32px" }}>{hero.subtext}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {hero.cta_primary_text && <Link href={hero.cta_primary_link ?? "/products"} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{hero.cta_primary_text}</Link>}
              {hero.cta_secondary_text && <Link href={hero.cta_secondary_link ?? "/contact"} style={{ display: "inline-block", padding: "12px 28px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{hero.cta_secondary_text}</Link>}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats bar ──────────────────────────────────── */}
      {statsOn && stats.stats && stats.stats.length > 0 && (
        <div style={{ background: "var(--color-accent)", padding: "0 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: `repeat(${stats.stats.length}, 1fr)` }}>
            {stats.stats.map((s, i) => (
              <div key={i} style={{ padding: "28px 0", textAlign: "center", borderRight: i < stats.stats!.length - 1 ? "1px solid rgba(255,255,255,0.25)" : "none" }}>
                <p style={{ fontSize: 34, fontWeight: 900, color: "white", margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", margin: "6px 0 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mission ────────────────────────────────────── */}
      {missionOn && mission.headline && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              {mission.tag && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>{mission.tag}</p>}
              <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, margin: "0 0 24px", color: "var(--color-foreground)" }}>{mission.headline}</h2>
              {(mission.paragraphs ?? []).map((p, i) => (
                <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: "#475569", marginBottom: 20 }}>{p}</p>
              ))}
            </div>
            {mission.image && (
              <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "4/3" }}>
                <Image src={mission.image} alt="Mission" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
                {mission.image_caption && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, rgba(15,23,42,0.8) 0%, transparent 100%)", padding: "24px 20px 20px" }}>
                    <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, margin: 0 }}>{mission.image_caption}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Values ─────────────────────────────────────── */}
      {valuesOn && values.values && values.values.length > 0 && (
        <div style={{ background: "#f8fafc", padding: "80px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              {values.tag && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>{values.tag}</p>}
              {values.headline && <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "var(--color-foreground)" }}>{values.headline}</h2>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              {values.values.map((v, i) => (
                <div key={i} style={{ background: "white", borderRadius: 10, padding: "28px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 10px", color: "var(--color-foreground)" }}>{v.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", margin: 0 }}>{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Leadership ─────────────────────────────────── */}
      {leadershipOn && leadership.people && leadership.people.length > 0 && (
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            {leadership.tag && <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 12 }}>{leadership.tag}</p>}
            {leadership.headline && <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, color: "var(--color-foreground)" }}>{leadership.headline}</h2>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
            {leadership.people.map((person, i) => (
              <div key={i} style={{ background: "white", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                {person.image && (
                  <div style={{ position: "relative", height: 220 }}>
                    <Image src={person.image} alt={person.name} fill style={{ objectFit: "cover" }} sizes="300px" />
                  </div>
                )}
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 3px", color: "var(--color-foreground)" }}>{person.name}</h3>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-accent)", margin: "0 0 12px" }}>{person.title}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b", margin: 0 }}>{person.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────── */}
      {ctaOn && cta.headline && (
        <div style={{ background: "var(--color-primary)", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "white", margin: "0 0 12px" }}>{cta.headline}</h2>
          {cta.subtext && <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 480, margin: "0 auto 28px" }}>{cta.subtext}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {cta.cta_primary_text && <Link href={cta.cta_primary_link ?? "/contact"} style={{ display: "inline-block", padding: "13px 32px", borderRadius: 6, background: "var(--color-accent)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{cta.cta_primary_text}</Link>}
            {cta.cta_secondary_text && <Link href={cta.cta_secondary_link ?? "/register"} style={{ display: "inline-block", padding: "13px 32px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.3)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>{cta.cta_secondary_text}</Link>}
          </div>
        </div>
      )}

    </div>
  );
}
