"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ImpersonationCtx = {
  impersonatorName: string;
  impersonatorRole: string;
  targetName: string;
  targetUserId: number;
  returnUrl: string;
  logId: number;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function ImpersonationBanner() {
  const [ctx, setCtx] = useState<ImpersonationCtx | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = getCookie("bs_impersonating");
    if (raw) {
      try { setCtx(JSON.parse(raw)); } catch {}
    }
  }, []);

  if (!ctx) return null;

  function handleEnd() {
    window.location.href = "/api/impersonate/end";
  }

  const roleLabel = ctx.impersonatorRole === "account_manager" ? "Account Manager"
    : ctx.impersonatorRole === "manager" ? "Manager" : "Admin";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "#f97316",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", height: 44,
      boxShadow: "0 2px 8px rgba(249,115,22,0.4)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>👁</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          Viewing as{" "}
          <strong style={{ textDecoration: "underline" }}>{ctx.targetName}</strong>
          {" "}—{" "}
          <span style={{ fontWeight: 400, opacity: 0.85 }}>
            Impersonated by {ctx.impersonatorName} ({roleLabel})
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Session expires in 1 hour
        </span>
        <button
          onClick={handleEnd}
          style={{
            padding: "6px 16px", background: "#fff", color: "#f97316",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 800,
            cursor: "pointer",
          }}>
          ✕ End Session
        </button>
      </div>
    </div>
  );
}
