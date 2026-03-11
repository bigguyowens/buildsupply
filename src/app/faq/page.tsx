import { getFaqPublic } from "@/app/actions/faq";
import { FaqAccordion } from "./faq-accordion";
import Link from "next/link";

export const metadata = { title: "FAQ — BuildSupply", description: "Answers to common questions about orders, shipping, returns, and more." };

export default async function FaqPage() {
  const categories = await getFaqPublic();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero */}
      <div style={{ background: "#0f172a", padding: "56px 24px 48px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: "0 0 12px" }}>
            Help Center
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.15 }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: 17, color: "#94a3b8", margin: "0 0 28px", lineHeight: 1.6 }}>
            Everything you need to know about orders, shipping, returns, and your account.
          </p>
          <Link href="/contact" style={{
            display: "inline-block", padding: "11px 28px", background: "#f97316",
            color: "white", borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: "none",
          }}>
            Can't find your answer? Contact Us →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        {categories.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", fontSize: 15, marginTop: 48 }}>
            No FAQ content yet — check back soon.
          </p>
        ) : (
          categories.map((cat, i) => (
            cat.items.length > 0 && (
              <div key={cat.id} style={{ marginBottom: 48 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 4, height: 24, background: "#f97316", borderRadius: 2 }} />
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{cat.name}</h2>
                </div>
                <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: "4px 24px" }}>
                  <FaqAccordion items={cat.items} />
                </div>
              </div>
            )
          ))
        )}

        {/* Contact CTA */}
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 32, textAlign: "center", marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Still have questions?</h3>
          <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 15 }}>
            Our team is available Mon–Fri 7am–6pm. We typically respond within a few hours.
          </p>
          <Link href="/contact" style={{
            display: "inline-block", padding: "10px 24px", background: "#0f172a",
            color: "white", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none",
          }}>
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
