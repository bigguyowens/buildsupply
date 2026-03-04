'use client';

import { useState } from "react";
import { submitApplicationAction } from "@/app/actions/careers";

function Field({ label, name, type = "text", placeholder, required = false, rows }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; rows?: number;
}) {
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" as const,
    fontFamily: "inherit", resize: "vertical" as const,
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
        {label}{required && <span style={{ color: "#f97316" }}> *</span>}
      </label>
      {rows ? (
        <textarea name={name} placeholder={placeholder} rows={rows} style={inputStyle} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

export function ApplyForm({ postingId, postingTitle }: { postingId: number; postingTitle: string }) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    const fd = new FormData(e.currentTarget);

    const result = await submitApplicationAction({
      posting_id:   postingId,
      name:         fd.get("name") as string,
      email:        fd.get("email") as string,
      phone:        fd.get("phone") as string,
      linkedin:     fd.get("linkedin") as string,
      portfolio:    fd.get("portfolio") as string,
      cover_letter: fd.get("cover_letter") as string,
      resume_text:  fd.get("resume_text") as string,
    });

    if (result.success) {
      setState("success");
    } else {
      setErrorMsg(result.error ?? "Something went wrong.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "40px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎉</p>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#15803d", margin: "0 0 8px" }}>Application Submitted!</h3>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          Thanks for applying for <strong>{postingTitle}</strong>. We review every application and will be in touch if there&apos;s a strong match.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="apply-grid">
        <Field label="Full Name"    name="name"  placeholder="Jane Smith" required />
        <Field label="Email"        name="email" type="email" placeholder="jane@example.com" required />
        <Field label="Phone"        name="phone" type="tel"  placeholder="(555) 000-0000" />
        <Field label="LinkedIn URL" name="linkedin" placeholder="https://linkedin.com/in/…" />
      </div>
      <Field label="Portfolio / Website" name="portfolio" placeholder="https://yoursite.com" />
      <Field label="Cover Letter" name="cover_letter" placeholder="Tell us why you're a great fit for this role…" rows={5} />
      <Field label="Paste your Resume / CV" name="resume_text" placeholder="Copy and paste the text of your resume here…" rows={8} />

      {state === "error" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#dc2626", fontSize: 14 }}>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        style={{
          padding: "13px 0", borderRadius: 8, border: "none",
          background: state === "submitting" ? "#9ca3af" : "var(--color-accent)",
          color: "white", fontWeight: 700, fontSize: 15,
          cursor: state === "submitting" ? "not-allowed" : "pointer", width: "100%",
        }}
      >
        {state === "submitting" ? "Submitting…" : "Submit Application →"}
      </button>
      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", margin: 0 }}>
        No account required. We&apos;ll reach out via email.
      </p>
    </form>
  );
}
