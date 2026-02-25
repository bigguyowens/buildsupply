"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

const initialState: { error?: string } = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "var(--color-foreground)" }}>Welcome back</h1>

      {state?.error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>Email</label>
        <input
          type="email" name="email" required autoComplete="email" autoFocus
          style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 14, outline: "none" }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>Password</label>
        <input
          type="password" name="password" required autoComplete="current-password"
          style={{ padding: "9px 12px", borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 14, outline: "none" }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: 4, padding: "10px 0", borderRadius: 6, border: "none",
          background: pending ? "#9ca3af" : "var(--color-accent)",
          color: "white", fontWeight: 700, fontSize: 15, cursor: pending ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
