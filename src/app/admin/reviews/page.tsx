import { getAdminReviews } from "@/app/actions/reviews";
import { ReviewsAdminClient } from "./reviews-client";

export default async function AdminReviewsPage() {
  const [pending, approved, rejected] = await Promise.all([
    getAdminReviews("pending"),
    getAdminReviews("approved"),
    getAdminReviews("rejected"),
  ]);
  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Product Reviews</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          Auto-approved reviews go live instantly. Flagged reviews need your sign-off.
        </p>
      </div>
      <ReviewsAdminClient pending={pending} approved={approved} rejected={rejected} />
    </div>
  );
}
