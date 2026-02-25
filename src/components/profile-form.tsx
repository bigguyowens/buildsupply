'use client';

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";

const initial: { error?: string; success?: string } = {};

export function ProfileForm({ firstName, lastName, email }: {
  firstName: string; lastName: string; email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initial);

  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Personal Information</h2>
        <p style={{ fontSize: 13, color: "var(--color-muted)", margin: "4px 0 0" }}>Update your name and email address</p>
      </div>
      <form action={formAction} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

        {state?.error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>
            {state.error}
          </div>
        )}
        {state?.success && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 6, padding: "10px 14px", color: "#16a34a", fontSize: 13 }}>
            {state.success}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>First Name</label>
            <input
              name="firstName" type="text" required defaultValue={firstName}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
            <input
              name="lastName" type="text" required defaultValue={lastName}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address</label>
          <input
            name="email" type="email" required defaultValue={email}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 14, border: "1px solid var(--color-border)", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit" disabled={pending}
            style={{
              padding: "9px 24px", borderRadius: 6, border: "none",
              background: pending ? "#9ca3af" : "var(--color-accent)",
              color: "white", fontWeight: 700, fontSize: 14, cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
