import { getAboutContent } from "@/app/actions/about";
import { AboutAdminClient } from "@/components/about-admin-client";

export default async function AdminAboutPage() {
  const cms = await getAboutContent();
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>About Us Content</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          Edit each section — changes go live instantly on the About page.
        </p>
      </div>
      <AboutAdminClient cms={cms} />
    </div>
  );
}
