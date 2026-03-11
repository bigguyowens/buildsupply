import { getFaqAdmin } from "@/app/actions/faq";
import { FaqAdminClient } from "./faq-client";

export default async function AdminFaqPage() {
  const categories = await getFaqAdmin();
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>FAQ Manager</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          Manage categories and questions — changes go live instantly on the FAQ page.
        </p>
      </div>
      <FaqAdminClient initialCategories={categories} />
    </div>
  );
}
