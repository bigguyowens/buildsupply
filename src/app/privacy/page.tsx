import { PRIVACY_POLICY_VERSION } from "@/lib/consent";

const LAST_UPDATED = "March 10, 2026";
const COMPANY = "BuildSupply, Inc.";
const CONTACT_EMAIL = "privacy@buildsupply.com";

export const metadata = {
  title: "Privacy & Security Policy | BuildSupply",
  description: "How BuildSupply collects, uses, and protects your personal and business information.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 12px", paddingBottom: 10, borderBottom: "2px solid #f97316" }}>
        {title}
      </h2>
      <div style={{ color: "#374151", lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: "#0f172a", padding: "56px 24px 48px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: "0 0 12px" }}>Legal</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "0 0 12px" }}>Privacy &amp; Security Policy</h1>
        <p style={{ color: "#94a3b8", fontSize: 15, margin: 0 }}>
          Version {PRIVACY_POLICY_VERSION} &nbsp;&middot;&nbsp; Last updated {LAST_UPDATED}
        </p>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Intro callout */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "24px 28px", marginBottom: 40, borderLeft: "4px solid #f97316" }}>
          <p style={{ margin: 0, fontSize: 15, color: "#374151", lineHeight: 1.8 }}>
            {COMPANY} (&ldquo;BuildSupply,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting the privacy
            and security of your personal and business information. This policy describes how we collect, use, store, and
            protect data when you use our platform, and outlines your rights as a customer. By using our services, you
            agree to the practices described herein.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <SubSection title="Account &amp; Contact Information">
            <p>When you register or place an order, we collect:</p>
            <Ul items={[
              "Full name, business name, email address, and phone number",
              "Billing and shipping addresses",
              "Account credentials (passwords are hashed using bcrypt — we never store plain-text passwords)",
              "Job title and company role where provided",
            ]} />
          </SubSection>
          <SubSection title="Transaction &amp; Order Data">
            <p>We retain complete records of your:</p>
            <Ul items={[
              "Orders, order items, quantities, and pricing",
              "Quote requests and custom pricing agreements",
              "Applied promotional codes and discount history",
              "Wishlists and saved product lists",
            ]} />
          </SubSection>
          <SubSection title="Usage &amp; Behavioral Data">
            <Ul items={[
              "Products viewed and browsing patterns (used to power recommendations)",
              "Search queries within the platform",
              "Device type, browser, and approximate geographic region (derived from IP)",
              "Session timestamps and page interactions",
            ]} />
          </SubSection>
          <SubSection title="Communications">
            <Ul items={[
              "Contact form submissions and support inquiries",
              "Quote communications and negotiation history",
              "Job applications, including uploaded resumes (stored securely in our database)",
            ]} />
          </SubSection>
        </Section>

        <Section title="2. How We Use Your Information">
          <SubSection title="To Fulfill Your Orders">
            <p>We use your information to process purchases, generate quotes, send order confirmations, manage shipping and returns, and provide customer support.</p>
          </SubSection>
          <SubSection title="To Personalize Your Experience">
            <p>Browsing and order history powers features like &ldquo;Recently Viewed&rdquo; and &ldquo;Similar Products.&rdquo; We do not sell this data to third parties or use it for cross-site advertising.</p>
          </SubSection>
          <SubSection title="To Communicate with You">
            <Ul items={[
              "Transactional emails: order confirmations, quote updates, shipping notifications",
              "Account security alerts: password changes, suspicious login attempts",
              "Service updates: policy changes, platform maintenance",
              "Marketing communications: only with your explicit consent, and always with an unsubscribe option",
            ]} />
          </SubSection>
          <SubSection title="To Improve Our Platform">
            <p>Aggregated, anonymized usage data helps us improve search relevance, catalog organization, and site performance. No individual customer is identified in this analysis.</p>
          </SubSection>
        </Section>

        <Section title="3. Data Sharing &amp; Third Parties">
          <p>We do <strong>not sell, rent, or trade</strong> your personal information. We share data only with:</p>
          <SubSection title="Service Providers">
            <Ul items={[
              "Neon (database hosting) — stores all platform data in SOC 2 compliant infrastructure on Azure",
              "Vercel (application hosting) — serves the BuildSupply platform",
              "Resend (email delivery) — sends transactional emails; no access to order or account data",
            ]} />
          </SubSection>
          <SubSection title="Legal Requirements">
            <p>We may disclose information if required by law, court order, or to protect the rights and safety of BuildSupply, our customers, or the public.</p>
          </SubSection>
          <SubSection title="Business Transfers">
            <p>In the event of a merger, acquisition, or sale of assets, customer data may transfer to the acquiring entity under the same protections described in this policy.</p>
          </SubSection>
        </Section>

        <Section title="4. Data Security">
          <SubSection title="Technical Safeguards">
            <Ul items={[
              "All data transmitted via HTTPS/TLS encryption",
              "Database access restricted to application-level credentials; no direct public access",
              "Passwords hashed using bcrypt with a cost factor of 12",
              "Session tokens signed with a secure secret and expire after 7 days",
              "Admin panel restricted to authorized personnel with role-based access control",
              "Resume files stored as encrypted base64 in the database — never publicly accessible",
            ]} />
          </SubSection>
          <SubSection title="Organizational Safeguards">
            <Ul items={[
              "Production system access limited to essential personnel only",
              "All admin actions are logged and auditable via the Error Logs system",
              "Security incidents are reviewed and remediated promptly",
              "Error logs retained for debugging and purged on a rolling 90-day basis",
            ]} />
          </SubSection>
          <SubSection title="Breach Notification">
            <p>In the event of a data breach that materially affects your personal information, we will notify affected customers within 72 hours of discovery via the email address on file.</p>
          </SubSection>
        </Section>

        <Section title="5. Cookies &amp; Tracking">
          <SubSection title="Essential Cookies">
            <p>We use a session cookie (<code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: 13 }}>bs_token</code>) to maintain your logged-in state. This cookie is <strong>strictly necessary</strong> for the platform to function and cannot be disabled while you are signed in.</p>
          </SubSection>
          <SubSection title="Preference Storage">
            <p>We store your admin theme preference (<code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: 13 }}>admin-theme</code>) in localStorage to preserve your light/dark mode choice across sessions.</p>
          </SubSection>
          <SubSection title="Analytics">
            <p>We do not use third-party analytics platforms (e.g., Google Analytics). All usage data is stored in our own database and not shared with advertising networks.</p>
          </SubSection>
          <SubSection title="Your Consent">
            <p>By continuing to use the BuildSupply platform after being presented with our consent notice, you acknowledge this policy and consent to the data practices described above.</p>
          </SubSection>
        </Section>

        <Section title="6. Data Retention">
          <Ul items={[
            "Account data: retained for the life of your account, plus 3 years after closure",
            "Order records: retained for 7 years to meet commercial and tax record-keeping requirements",
            "Quote history: retained for 5 years",
            "Job applications: retained for 2 years after submission; resumes deleted upon request",
            "Contact form submissions: retained for 1 year",
            "Error logs: rolling 90-day retention",
            "Product view history: retained for 18 months",
          ]} />
        </Section>

        <Section title="7. Your Rights">
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <Ul items={[
            "Access — Request a copy of the personal data we hold about you",
            "Correction — Request correction of inaccurate or incomplete information",
            "Deletion — Request erasure of your data (subject to legal retention requirements)",
            "Portability — Receive your data in a structured, machine-readable format",
            "Objection — Object to processing for marketing purposes at any time",
            "Withdrawal — Withdraw consent without affecting the lawfulness of prior processing",
          ]} />
          <p style={{ marginTop: 12 }}>
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#f97316", fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>BuildSupply is a B2B platform intended for businesses and professionals. We do not knowingly collect personal information from individuals under the age of 18. If you believe a minor has provided us with information, contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#f97316", fontWeight: 600 }}>{CONTACT_EMAIL}</a> immediately.</p>
        </Section>

        <Section title="9. International Users">
          <p>BuildSupply is operated from the United States. If you access our platform from outside the U.S., your data will be transferred to and processed in the U.S. in accordance with this policy and applicable data protection laws.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this policy periodically. When we do:</p>
          <Ul items={[
            "The version number and Last Updated date will be revised",
            "Existing logged-in users will see the consent banner again on their next visit",
            "Material changes will be communicated via email",
            "Continued use of the platform constitutes acceptance of the revised policy",
          ]} />
        </Section>

        {/* Contact box */}
        <div style={{ background: "#0f172a", borderRadius: 12, padding: "28px 32px", color: "#e2e8f0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>Contact Our Privacy Team</h2>
          <p style={{ margin: "0 0 20px", color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>
            For privacy requests, data inquiries, or security concerns:
          </p>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", margin: "0 0 4px" }}>Email</p>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#f97316", fontWeight: 600, textDecoration: "none", fontSize: 15 }}>{CONTACT_EMAIL}</a>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", margin: "0 0 4px" }}>Company</p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{COMPANY}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", margin: "0 0 4px" }}>Policy Version</p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{PRIVACY_POLICY_VERSION} &middot; {LAST_UPDATED}</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
