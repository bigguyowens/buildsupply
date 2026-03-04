import { getHomepageContent } from "@/app/actions/homepage";
import { HomepageAdminClient } from "@/components/homepage-admin-client";

export default async function AdminHomepagePage() {
  const cms = await getHomepageContent();
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Homepage Content</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          Edit each section — changes go live instantly on the homepage.
        </p>
      </div>
      <HomepageAdminClient cms={cms} />
    </div>
  );
}
