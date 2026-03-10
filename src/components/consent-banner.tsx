"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { recordConsent } from "@/app/actions/consent";

const CONSENT_COOKIE = "bs_privacy_consent";
const POLICY_VERSION = "1.0";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

export function ConsentBanner({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = getCookie(CONSENT_COOKIE);
    // Show banner if no consent cookie, or if policy version has changed
    if (!saved || saved !== POLICY_VERSION) {
      // Small delay so it doesn't pop in immediately on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  async function handleAccept() {
    setCookie(CONSENT_COOKIE, POLICY_VERSION, 365);
    setVisible(false);
    // If logged in, persist consent to DB
    if (isLoggedIn) {
      await recordConsent();
    }
  }

  function handleDecline() {
    // Still set cookie so we don't re-pester them, but don't record to DB
    setCookie(CONSENT_COOKIE, "declined", 30);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)",
        zIndex: 999, display: "none",
      }} />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Privacy consent"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "min(680px, calc(100vw - 32px))",
          background: "#0f172a",
          borderRadius: 14,
          padding: "20px 24px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: "rgba(249,115,22,0.15)",
          border: "1px solid rgba(249,115,22,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0, marginTop: 1,
        }}>
          🔒
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
            Your privacy matters to us
          </p>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            We use cookies and store usage data to process orders, personalize your experience, and improve our platform.
            We never sell your data.{" "}
            <Link href="/privacy" style={{ color: "#f97316", textDecoration: "underline", fontWeight: 600 }}>
              Read our Privacy &amp; Security Policy
            </Link>
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleAccept}
              style={{
                background: "#f97316", color: "#fff",
                border: "none", borderRadius: 8,
                padding: "9px 20px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.01em",
                transition: "opacity 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Accept &amp; Continue
            </button>
            <button
              onClick={handleDecline}
              style={{
                background: "rgba(255,255,255,0.06)", color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "9px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              Decline
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={handleDecline}
          aria-label="Dismiss"
          style={{
            background: "none", border: "none", color: "#475569",
            fontSize: 18, cursor: "pointer", flexShrink: 0,
            padding: "2px 4px", lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
