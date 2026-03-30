"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePassword } from "@/app/actions/temp-password";

export function ChangePasswordClient({ forced, isExpired, expiresAt, userRole }: {
  forced: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  userRole: string;
}) {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const homeRoute =
    userRole === "admin" ? "/admin" :
    userRole === "account_manager" || userRole === "manager" ? "/crm" : "/account";

  function handleSubmit() {
    setError("");
    if (!currentPw || !newPw || !confirmPw) {
      setError("All fields are required");
      return;
    }
    if (newPw.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ currentPassword: currentPw, newPassword: newPw });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push(homeRoute), 2000);
      } else {
        setError(res.error ?? "Failed to change password");
      }
    });
  }

  if (isExpired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "40px 36px",
          maxWidth: 420, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            Temporary Password Expired
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 24px" }}>
            Your temporary password has expired. Please contact your administrator to issue a new one.
          </p>
          <a href="/login" style={{ fontSize: 14, color: "#f97316", fontWeight: 700 }}>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "40px 36px",
          maxWidth: 420, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            Password Changed!
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Redirecting you now…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "40px 36px",
        maxWidth: 440, width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%",
            background: forced ? "#fef3c7" : "#dcfce7",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, margin: "0 auto 14px" }}>
            {forced ? "🔐" : "🔑"}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 8px" }}>
            {forced ? "Set Your New Password" : "Change Password"}
          </h1>
          {forced ? (
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
              A temporary password was issued for your account.
              You must set a new password before continuing.
              {expiresAt && (
                <span style={{ display: "block", marginTop: 6, fontSize: 12,
                  color: "#f59e0b", fontWeight: 700 }}>
                  Expires: {new Date(expiresAt).toLocaleString("en-US",
                    { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              Enter your current password and choose a new one.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
            ⚠ {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700,
              color: "#374151", marginBottom: 6 }}>
              {forced ? "Temporary Password" : "Current Password"}
            </label>
            <input type="password" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                border: "1.5px solid #e5e5e5", outline: "none",
                boxSizing: "border-box" as const }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700,
              color: "#374151", marginBottom: 6 }}>New Password</label>
            <input type="password" value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                border: "1.5px solid #e5e5e5", outline: "none",
                boxSizing: "border-box" as const }} />
            {/* Strength indicator */}
            {newPw.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
                {[1,2,3,4].map(i => {
                  const strength =
                    newPw.length >= 12 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^a-zA-Z0-9]/.test(newPw) ? 4 :
                    newPw.length >= 10 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) ? 3 :
                    newPw.length >= 8 ? 2 : 1;
                  const colors = ["#ef4444","#f59e0b","#3b82f6","#22c55e"];
                  return (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
                      background: i <= strength ? colors[strength-1] : "#f1f5f9",
                      transition: "background 0.2s" }} />
                  );
                })}
                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>
                  {newPw.length >= 12 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[^a-zA-Z0-9]/.test(newPw) ? "Strong" :
                   newPw.length >= 10 ? "Good" :
                   newPw.length >= 8  ? "Fair" : "Weak"}
                </span>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700,
              color: "#374151", marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
                border: `1.5px solid ${confirmPw && confirmPw !== newPw ? "#ef4444" : "#e5e5e5"}`,
                outline: "none", boxSizing: "border-box" as const }} />
            {confirmPw && confirmPw !== newPw && (
              <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0", fontWeight: 600 }}>
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isPending}
          style={{ width: "100%", marginTop: 24, padding: "12px 0",
            background: isPending ? "#9ca3af" : "#0d0d0d",
            color: "#f5c700", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 800, cursor: isPending ? "not-allowed" : "pointer" }}>
          {isPending ? "Changing Password…" : "Set New Password"}
        </button>

        {!forced && (
          <button onClick={() => router.push(homeRoute)}
            style={{ width: "100%", marginTop: 10, padding: "10px 0",
              background: "transparent", color: "#9ca3af",
              border: "1px solid #e5e5e5", borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
