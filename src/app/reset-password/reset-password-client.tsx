"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/app/actions/password-reset";

export function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [isPending, startTransition] = useTransition();

  // Password strength
  const strength =
    newPw.length >= 12 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^a-zA-Z0-9]/.test(newPw) ? 4 :
    newPw.length >= 10 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 3 :
    newPw.length >= 8 ? 2 : newPw.length > 0 ? 1 : 0;
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];

  function handleSubmit() {
    setError("");
    if (!newPw)               { setError("Please enter a new password"); return; }
    if (newPw.length < 8)     { setError("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw)  { setError("Passwords do not match"); return; }

    startTransition(async () => {
      const res = await resetPasswordWithToken(token, newPw);
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "44px 40px",
          maxWidth: 440, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 20px" }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            Password Reset!
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 6px" }}>
            Your password has been updated successfully.
          </p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            Redirecting you to login…
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
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dbeafe",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 14px" }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 8px" }}>
            Set New Password
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Choose a strong password for your account.
          </p>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* New password */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700,
              color: "#374151", marginBottom: 6 }}>New Password</label>
            <input type="password" value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                border: "1.5px solid #e5e5e5", outline: "none",
                boxSizing: "border-box" as const }} />
            {/* Strength bar */}
            {newPw.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
                      background: i <= strength ? strengthColors[strength] : "#f1f5f9",
                      transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: 11, color: "#9ca3af" }}>
                  <span style={{ color: strengthColors[strength], fontWeight: 700 }}>
                    {strengthLabels[strength]}
                  </span>
                  <span>Min. 8 characters</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700,
              color: "#374151", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Repeat new password"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, fontSize: 14,
                border: `1.5px solid ${confirmPw && confirmPw !== newPw ? "#ef4444" : "#e5e5e5"}`,
                outline: "none", boxSizing: "border-box" as const }} />
            {confirmPw && confirmPw !== newPw && (
              <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, margin: "4px 0 0" }}>
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        <button onClick={handleSubmit} disabled={isPending}
          style={{ width: "100%", marginTop: 24, padding: "12px 0",
            background: isPending ? "#9ca3af" : "#0d0d0d",
            color: "#f5c700", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 800,
            cursor: isPending ? "not-allowed" : "pointer" }}>
          {isPending ? "Resetting…" : "Reset Password"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af",
          margin: "16px 0 0" }}>
          <Link href="/login" style={{ color: "#f97316", fontWeight: 700,
            textDecoration: "none" }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
