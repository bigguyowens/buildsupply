"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";

const initialState: { error?: string } = {};

const inputStyle = {
  padding: "9px 12px", borderRadius: 6,
  border: "1px solid var(--color-border)", fontSize: 14, outline: "none", width: "100%",
};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "var(--color-foreground)" }}>Create account</h1>

      {state?.error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>
          {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>First Name</label>
          <input type="text" name="firstName" required autoFocus style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Last Name</label>
          <input type="text" name="lastName" required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
        <input type="email" name="email" required autoComplete="email" style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Password <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>(min 8 characters)</span></label>
        <input type="password" name="password" required autoComplete="new-password" style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Confirm Password</label>
        <input type="password" name="confirm" required autoComplete="new-password" style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border)")} />
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: 4, padding: "10px 0", borderRadius: 6, border: "none",
          background: pending ? "#9ca3af" : "var(--color-accent)",
          color: "white", fontWeight: 700, fontSize: 15, cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "Creating account…" : "Create Account"}
      </button>

      <p style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center", margin: 0 }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
