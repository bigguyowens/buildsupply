"use client";

import { useState, useTransition } from "react";
import { issueTempPassword } from "@/app/actions/temp-password";

export function TempPasswordButton({ userId, userName }: {
  userId: number;
  userName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tempPassword: string; issuedAt: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleIssue() {
    setError("");
    startTransition(async () => {
      const res = await issueTempPassword(userId);
      if (res.ok && res.tempPassword) {
        setResult({ tempPassword: res.tempPassword, issuedAt: new Date().toLocaleTimeString() });
        setShowConfirm(false);
      } else {
        setError(res.error ?? "Failed to issue temporary password");
      }
    });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setResult(null);
    setShowConfirm(false);
    setError("");
  }

  if (result) {
    return (
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#92400e", margin: 0 }}>
            Temporary Password Issued
          </p>
        </div>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 10px" }}>
          Share this with {userName}. It expires in 24 hours and they'll be forced to change it on login.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <code style={{ flex: 1, background: "#fff", border: "1px solid #fde68a",
            borderRadius: 6, padding: "8px 12px", fontSize: 15, fontWeight: 800,
            color: "#0d0d0d", letterSpacing: "0.05em", fontFamily: "monospace" }}>
            {result.tempPassword}
          </code>
          <button onClick={handleCopy} style={{ padding: "8px 14px", borderRadius: 6,
            background: copied ? "#22c55e" : "#0d0d0d", color: copied ? "#fff" : "#f5c700",
            border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            flexShrink: 0 }}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 10px" }}>
          Issued at {result.issuedAt} · Valid for 24 hours
        </p>
        <button onClick={handleReset} style={{ fontSize: 12, color: "#9ca3af",
          background: "none", border: "none", cursor: "pointer",
          textDecoration: "underline", padding: 0 }}>
          Issue another
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 700,
          background: "#fee2e2", padding: "6px 10px", borderRadius: 6,
          marginBottom: 8 }}>⚠ {error}</p>
      )}

      {showConfirm ? (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a",
          borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e", margin: "0 0 4px" }}>
            Issue temp password to {userName}?
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>
            This will override their current password and force them to change it on next login.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleIssue} disabled={isPending} style={{
              padding: "7px 16px", borderRadius: 6, border: "none",
              background: isPending ? "#9ca3af" : "#0d0d0d",
              color: "#f5c700", fontSize: 12, fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "Issuing…" : "Yes, Issue Password"}
            </button>
            <button onClick={() => setShowConfirm(false)} style={{
              padding: "7px 14px", borderRadius: 6,
              background: "transparent", border: "1px solid #e5e5e5",
              color: "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowConfirm(true)} style={{
          width: "100%", padding: "9px 0", borderRadius: 7,
          background: "transparent", border: "1px dashed #d1d5db",
          color: "#6b7280", fontSize: 12, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6 }}>
          🔐 Issue Temporary Password
        </button>
      )}
    </div>
  );
}
