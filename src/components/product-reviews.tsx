"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/app/actions/reviews";
import type { Review, ReviewSummary } from "@/app/actions/reviews";

const fmt = (n: number) => n.toFixed(1);

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 28, color: (hover || value) >= s ? "#f97316" : "#d1d5db", lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, color: "#f97316", letterSpacing: 1 }}>
      {[1,2,3,4,5].map(s => s <= Math.round(rating) ? "★" : "☆").join("")}
    </span>
  );
}

function RatingSummary({ summary }: { summary: ReviewSummary }) {
  const { average, count, distribution } = summary;
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
      {/* Big average */}
      <div style={{ textAlign: "center", minWidth: 80 }}>
        <p style={{ fontSize: 48, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1 }}>{fmt(average)}</p>
        <StarDisplay rating={average} size={18} />
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>{count.toLocaleString()} review{count !== 1 ? "s" : ""}</p>
      </div>

      {/* Distribution bars */}
      <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 5 }}>
        {[5,4,3,2,1].map(s => {
          const c = distribution[s as 1|2|3|4|5] ?? 0;
          const pct = count > 0 ? (c / count) * 100 : 0;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 14, color: "#64748b", textAlign: "right", flexShrink: 0 }}>{s}</span>
              <span style={{ color: "#f97316", fontSize: 11, flexShrink: 0 }}>★</span>
              <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#f97316", borderRadius: 4, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ width: 28, color: "#64748b", flexShrink: 0 }}>{c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9", padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <StarDisplay rating={review.rating} size={14} />
            {review.title && <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{review.title}</span>}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            {review.reviewer_name} · {new Date(review.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {!review.user_id && <span style={{ marginLeft: 6, color: "#f97316", fontWeight: 600 }}>Guest</span>}
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.75 }}>{review.body}</p>
    </div>
  );
}

function ReviewForm({ productId, isLoggedIn }: { productId: string; isLoggedIn: boolean }) {
  const [rating, setRating]     = useState(0);
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [result, setResult]     = useState<{ ok: boolean; status?: string; error?: string } | null>(null);
  const [, startT]              = useTransition();

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, boxSizing: "border-box",
    border: "1px solid #e2e8f0", outline: "none", color: "#0f172a", background: "white",
  };

  function submit() {
    if (!rating) { setResult({ ok: false, error: "Please select a star rating." }); return; }
    if (!body.trim() || body.trim().length < 10) { setResult({ ok: false, error: "Review must be at least 10 characters." }); return; }
    startT(async () => {
      const res = await submitReview({ productId, rating, title, body, guestName: name, guestEmail: email });
      setResult(res);
      if (res.ok) { setRating(0); setTitle(""); setBody(""); setName(""); setEmail(""); }
    });
  }

  if (result?.ok) {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#15803d", margin: "0 0 6px" }}>
          {result.status === "approved" ? "✓ Review published!" : "✓ Review submitted for review"}
        </p>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          {result.status === "approved" ? "Your review is now live. Thank you!" : "Our team will review it shortly and publish it soon."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "24px" }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Write a Review</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Your Rating *</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        {!isLoggedIn && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={inputStyle} />
            </div>
          </div>
        )}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summarize your experience" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Review *</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="What did you think of this product?" rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
        </div>
        {result?.error && <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>{result.error}</p>}
        <button onClick={submit} style={{ background: "#f97316", color: "white", border: "none", borderRadius: 8, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>
          Submit Review
        </button>
      </div>
    </div>
  );
}

export function ProductReviews({ reviews, summary, productId, isLoggedIn }: {
  reviews: Review[];
  summary: ReviewSummary;
  productId: string;
  isLoggedIn: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ marginTop: 48, borderTop: "1px solid #e2e8f0", paddingTop: 40 }}>
      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>
          Customer Reviews
          {summary.count > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: "#64748b", marginLeft: 10 }}>({summary.count})</span>}
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ background: "#f97316", color: "white", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Write a review form */}
      {showForm && (
        <div style={{ marginBottom: 32 }}>
          <ReviewForm productId={productId} isLoggedIn={isLoggedIn} />
        </div>
      )}

      {/* Rating summary */}
      {summary.count > 0 ? (
        <>
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "24px 28px", marginBottom: 28 }}>
            <RatingSummary summary={summary} />
          </div>
          <div>
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        </>
      ) : (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#0f172a", fontWeight: 600, margin: "0 0 6px" }}>No reviews yet</p>
          <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px" }}>Be the first to review this product.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ background: "#f97316", color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Write the First Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}
