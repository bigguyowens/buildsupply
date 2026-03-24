"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: number;
  product_id: string;
  user_id: number | null;
  guest_name: string | null;
  guest_email: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  flag_reason: string | null;
  helpful_count: number;
  created_at: string;
  reviewer_name?: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
  distribution: Record<1|2|3|4|5, number>;
};

// ── Auto-moderation ────────────────────────────────────────────────────────
const PROFANITY = [
  "fuck","shit","ass","bitch","cunt","damn","dick","bastard","asshole",
  "piss","crap","cock","pussy","whore","slut","fag","retard","nigger",
  "motherfuck","bullshit","jackass","dumbass","shitty",
];

function moderate(text: string): { approved: boolean; reason: string | null } {
  const lower = text.toLowerCase();
  if (PROFANITY.some(w => new RegExp(`\\b${w}\\b`).test(lower))) {
    return { approved: false, reason: "profanity" };
  }
  if (/buildsupply/i.test(lower)) {
    return { approved: false, reason: "brand_mention" };
  }
  return { approved: true, reason: null };
}

// ── Public: submit a review ────────────────────────────────────────────────
export async function submitReview(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  guestName?: string;
  guestEmail?: string;
}): Promise<{ ok: boolean; status?: ReviewStatus; error?: string }> {
  const session = await getSession();
  const { productId, rating, title, body, guestName, guestEmail } = input;

  if (!body?.trim() || body.trim().length < 10) return { ok: false, error: "Review must be at least 10 characters." };
  if (rating < 1 || rating > 5) return { ok: false, error: "Rating must be 1–5." };

  if (!session && (!guestName?.trim() || !guestEmail?.trim())) {
    return { ok: false, error: "Name and email are required." };
  }

  // Prevent duplicate review (logged-in users)
  if (session) {
    const existing = await query<{ id: number }>(
      "SELECT id FROM product_reviews WHERE product_id=$1 AND user_id=$2 AND status != 'rejected'",
      [productId, session.id]
    );
    if (existing.length) return { ok: false, error: "You've already reviewed this product." };
  }

  // Run auto-moderation on title + body
  const combined = `${title ?? ""} ${body}`;
  const { approved, reason } = moderate(combined);
  const status: ReviewStatus = approved ? "approved" : "pending";

  await query(
    `INSERT INTO product_reviews
       (product_id, user_id, guest_name, guest_email, rating, title, body, status, flag_reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      productId,
      session?.id ?? null,
      session ? null : guestName?.trim(),
      session ? null : guestEmail?.trim().toLowerCase(),
      rating,
      title?.trim() || null,
      body.trim(),
      status,
      reason,
    ]
  );

  revalidatePath(`/products`);
  return { ok: true, status };
}

// ── Public: get approved reviews for a product ─────────────────────────────
export async function getProductReviews(productId: string): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
  const rows = await query<Review & { first_name: string; last_name: string }>(
    `SELECT r.*,
            COALESCE(u.first_name, r.guest_name, 'Anonymous') AS reviewer_name
     FROM product_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 AND r.status = 'approved'
     ORDER BY r.created_at DESC`,
    [productId]
  );

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rows.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  const count = rows.length;
  const average = count ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;

  return {
    reviews: rows,
    summary: { average: parseFloat(average.toFixed(1)), count, distribution: dist as ReviewSummary["distribution"] },
  };
}

// ── Admin: get reviews by status ───────────────────────────────────────────
export async function getAdminReviews(status: ReviewStatus | "all" = "all") {
  const where = status === "all" ? "" : "WHERE r.status = $1";
  const params = status === "all" ? [] : [status];
  return query<Review & { product_name: string }>(
    `SELECT r.*,
            COALESCE(u.first_name || ' ' || u.last_name, r.guest_name, 'Anonymous') AS reviewer_name,
            p.name AS product_name
     FROM product_reviews r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN products p ON p.id::text = r.product_id
     ${where}
     ORDER BY r.created_at DESC`,
    params
  );
}

// ── Admin: approve a review ────────────────────────────────────────────────
export async function approveReview(id: number) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  await query(
    `UPDATE product_reviews SET status='approved', flag_reason=NULL, updated_at=NOW() WHERE id=$1`,
    [id]
  );
  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  return { ok: true };
}

// ── Admin: reject a review ─────────────────────────────────────────────────
export async function rejectReview(id: number) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  await query(
    `UPDATE product_reviews SET status='rejected', updated_at=NOW() WHERE id=$1`,
    [id]
  );
  revalidatePath("/admin/reviews");
  revalidatePath("/products");
  return { ok: true };
}

// ── Admin: get pending count (for sidebar badge) ───────────────────────────
export async function getPendingReviewCount(): Promise<number> {
  const rows = await query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM product_reviews WHERE status='pending'"
  );
  return rows[0]?.count ?? 0;
}
