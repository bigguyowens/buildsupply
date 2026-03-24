"use client";

import { useState, useTransition } from "react";
import type { Review } from "@/app/actions/reviews";
import { approveReview, rejectReview } from "@/app/actions/reviews";

type Props = {
  pending:  (Review & { product_name: string })[];
  approved: (Review & { product_name: string })[];
  rejected: (Review & { product_name: string })[];
};

type Tab = "pending" | "approved" | "rejected";

const FLAG_LABELS: Record<string, string> = {
  profanity:     "🤬 Profanity",
  brand_mention: "🏷️ Brand Mention",
};

const stars = (n: number) => Array.from({ length: 5 }, (_, i) => i < n ? "★" : "☆").join("");

function ReviewRow({ review, tab }: { review: Review & { product_name: string }; tab: Tab }) {
  const [, startT] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return null;

  return (
    <div style={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, padding: "16px 20px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        {/* Left: review content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, color: "#f97316", letterSpacing: 2 }}>{stars(review.rating)}</span>
            {review.title && <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ad-text)" }}>{review.title}</span>}
            {review.flag_reason && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#92400e" }}>
                {FLAG_LABELS[review.flag_reason] ?? review.flag_reason}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: "var(--ad-text2)", margin: "0 0 10px", lineHeight: 1.6 }}>{review.body}</p>
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ad-muted)", flexWrap: "wrap" }}>
            <span>👤 {review.reviewer_name}</span>
            <span>📦 {review.product_name ?? review.product_id}</span>
            <span>🕒 {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            {!review.user_id && <span style={{ color: "#f97316" }}>Guest</span>}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {tab === "pending" && (
            <>
              <button
                onClick={() => startT(async () => { await approveReview(review.id); setDone(true); })}
                style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: 6, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ✓ Approve
              </button>
              <button
                onClick={() => startT(async () => { await rejectReview(review.id); setDone(true); })}
                style={{ background: "transparent", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 6, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                ✕ Reject
              </button>
            </>
          )}
          {tab === "approved" && (
            <button
              onClick={() => startT(async () => { await rejectReview(review.id); setDone(true); })}
              style={{ background: "transparent", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              Remove
            </button>
          )}
          {tab === "rejected" && (
            <button
              onClick={() => startT(async () => { await approveReview(review.id); setDone(true); })}
              style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", borderRadius: 6, padding: "7px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReviewsAdminClient({ pending, approved, rejected }: Props) {
  const [tab, setTab] = useState<Tab>("pending");

  const tabs: { key: Tab; label: string; count: number; alert?: boolean }[] = [
    { key: "pending",  label: "Needs Review", count: pending.length,  alert: pending.length > 0 },
    { key: "approved", label: "Approved",      count: approved.length },
    { key: "rejected", label: "Rejected",      count: rejected.length },
  ];
  const current = tab === "pending" ? pending : tab === "approved" ? approved : rejected;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--ad-border)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: tab === t.key ? "2px solid #f97316" : "2px solid transparent",
            color: tab === t.key ? "#f97316" : "var(--ad-muted)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
              background: t.alert ? "#f97316" : "var(--ad-surface2)",
              color: t.alert ? "white" : "var(--ad-muted)",
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Auto-mod info banner for pending tab */}
      {tab === "pending" && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
          <strong>Auto-moderation flagged these reviews</strong> — they contain profanity or mention "BuildSupply" and need your approval before going live.
        </div>
      )}

      {/* Review list */}
      {current.length === 0 ? (
        <div style={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, padding: "48px 24px", textAlign: "center", color: "var(--ad-muted)" }}>
          <p style={{ fontSize: 15, margin: 0 }}>
            {tab === "pending" ? "No reviews awaiting approval 🎉" :
             tab === "approved" ? "No approved reviews yet." :
             "No rejected reviews."}
          </p>
        </div>
      ) : (
        current.map(r => <ReviewRow key={r.id} review={r} tab={tab} />)
      )}
    </div>
  );
}
