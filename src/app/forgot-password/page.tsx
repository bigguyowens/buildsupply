"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError("");
    if (!email.trim()) { setError("Please enter your email address"); return; }
    startTransition(async () => {
      const res = await requestPasswordReset(email);
      if (res.ok) setSubmitted(true);
      else setError(res.error ?? "Something went wrong");
    });
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "44px 40px",
          maxWidth: 440, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 20px" }}>✉️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, margin: "0 0 6px" }}>
            If an account exists for <strong style={{ color: "#0d0d0d" }}>{email}</strong>,
            we've sent a password reset link to that address.
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 28px" }}>
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <Link href="/login" style={{ display: "inline-block", padding: "10px 28px",
            background: "#0d0d0d", color: "#f5c700", borderRadius: 8,
            fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
            Back to Login
          </Link>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
            Didn't get it?{" "}
            <button onClick={() => { setSubmitted(false); setEmail(""); }}
              style={{ background: "none", border: "none", color: "#f97316",
                fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "44px 40px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 22, fontWeight: 900, textDecoration: "none",
            color: "#0d0d0d", display: "block", marginBottom: 24 }}>
            <span style={{ color: "#f97316" }}>Build</span>Supply
          </Link>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fef3c7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 14px" }}>🔑</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 8px" }}>
            Forgot your password?
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
            No problem. Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 700,
            color: "#374151", marginBottom: 6 }}>Email Address</label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="you@example.com"
            autoFocus
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
              border: "1.5px solid #e5e5e5", outline: "none",
              boxSizing: "border-box" as const }} />
        </div>

        <button onClick={handleSubmit} disabled={isPending}
          style={{ width: "100%", padding: "12px 0",
            background: isPending ? "#9ca3af" : "#0d0d0d",
            color: "#f5c700", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 800,
            cursor: isPending ? "not-allowed" : "pointer",
            marginBottom: 16 }}>
          {isPending ? "Sending…" : "Send Reset Link"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", margin: 0 }}>
          Remember your password?{" "}
          <Link href="/login" style={{ color: "#f97316", fontWeight: 700,
            textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
