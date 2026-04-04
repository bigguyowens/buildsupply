"use client";

import { useState, useTransition } from "react";
import { createImpersonationToken } from "@/app/actions/impersonation";

export function ImpersonateButton({ userId, userName, compact = false }: {
  userId: number;
  userName: string;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  function handleImpersonate() {
    setError("");
    startTransition(async () => {
      const res = await createImpersonationToken(userId);
      if (res.ok && res.token) {
        window.open(`/api/impersonate?token=${res.token}`, "_blank", "noopener");
        setShowConfirm(false);
      } else {
        setError(res.error ?? "Failed to start impersonation");
      }
    });
  }

  // ── Compact version — lives in the dark header bar ────────────────────
  if (compact) {
    return (
      <div>
        {error && (
          <p style={{ fontSize: 11, color: "#fca5a5", margin: "0 0 4px" }}>⚠ {error}</p>
        )}
        {showConfirm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Open as {userName.split(" ")[0]}?</span>
            <button onClick={handleImpersonate} disabled={isPending} style={{
              padding: "5px 12px", borderRadius: 5, border: "none",
              background: isPending ? "#9ca3af" : "#f97316",
              color: "#fff", fontSize: 11, fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "…" : "👁 Yes"}
            </button>
            <button onClick={() => setShowConfirm(false)} style={{
              padding: "5px 10px", borderRadius: 5,
              background: "transparent", border: "1px solid #333",
              color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setShowConfirm(true)} style={{
            padding: "7px 14px", borderRadius: 6, border: "1px solid #f97316",
            background: "transparent", color: "#f97316",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            whiteSpace: "nowrap" as const,
          }}>
            👁 View as Customer
          </button>
        )}
      </div>
    );
  }

  // ── Full version — sidebar card ───────────────────────────────────────
  return (
    <div>
      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 700,
          background: "#fee2e2", padding: "6px 10px", borderRadius: 6,
          margin: "0 0 8px" }}>
          ⚠ {error}
        </p>
      )}
      {showConfirm ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: 8, padding: "12px 14px" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", margin: "0 0 4px" }}>
            Open session as {userName}?
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>
            A new tab will open with you authenticated as this customer. The session is
            tracked for audit purposes and expires in 30 minutes.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleImpersonate} disabled={isPending} style={{
              padding: "7px 16px", borderRadius: 6, border: "none",
              background: isPending ? "#9ca3af" : "#f97316",
              color: "#fff", fontSize: 12, fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "Opening…" : "👁 Open New Tab"}
            </button>
            <button onClick={() => setShowConfirm(false)} style={{
              padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: "transparent", border: "1px solid var(--crm-border, #e5e5e5)",
              color: "var(--crm-muted, #6b7280)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowConfirm(true)} style={{
          width: "100%", padding: "9px 0", borderRadius: 7,
          background: "transparent", border: "1px dashed #f97316",
          color: "#f97316", fontSize: 12, fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 6 }}>
          👁 Impersonate Customer
        </button>
      )}
    </div>
  );
}
