"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";

const initialState = { error: undefined };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 24, fontWeight: 700, textDecoration: "none", color: "var(--color-foreground)" }}>
            <span style={{ color: "var(--color-accent)" }}>Build</span>Supply
          </Link>
          <p style={{ marginTop: 8, color: "var(--color-muted)", fontSize: 14 }}>Create your account</p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 10, border: "1px solid var(--color-border)", padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {state?.error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>
                {state.error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>First Name</label>
                <input
                  name="firstName" type="text" required autoComplete="given-name" placeholder="Jane"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>Last Name</label>
                <input
                  name="lastName" type="text" required autoComplete="family-name" placeholder="Smith"
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>Email Address</label>
              <input
                name="email" type="email" required autoComplete="email" placeholder="you@example.com"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>Password</label>
              <input
                name="password" type="password" required autoComplete="new-password" placeholder="Min. 8 characters"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--color-foreground)" }}>Confirm Password</label>
              <input
                name="confirm" type="password" required autoComplete="new-password" placeholder="••••••••"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 6, border: "none",
                background: pending ? "#9ca3af" : "var(--color-accent)",
                color: "white", fontWeight: 700, fontSize: 15, cursor: pending ? "not-allowed" : "pointer",
              }}
            >
              {pending ? "Creating account..." : "Create Account"}
            </button>

          </form>
        </div>

        {/* Login link */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--color-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
