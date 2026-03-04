'use client';

import { useState, useRef } from "react";
import { submitApplicationAction } from "@/app/actions/careers";

function Field({ label, name, type = "text", placeholder, required = false, rows }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; rows?: number;
}) {
  const base = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" as const,
    fontFamily: "inherit", resize: "vertical" as const,
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
        {label}{required && <span style={{ color: "#f97316" }}> *</span>}
      </label>
      {rows
        ? <textarea name={name} placeholder={placeholder} rows={rows} style={base} />
        : <input name={name} type={type} placeholder={placeholder} style={base} />
      }
    </div>
  );
}

// ── Resume uploader ───────────────────────────────────────────────────────────
function ResumeUploader({ onUpload }: {
  onUpload: (result: { url: string; filename: string; size: number } | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus]     = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [file, setFile]         = useState<{ name: string; size: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);

  const fmtSize = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  async function upload(f: File) {
    setStatus("uploading");
    setFile({ name: f.name, size: f.size });
    setErrorMsg("");

    const fd = new FormData();
    fd.append("file", f);

    try {
      const res  = await fetch("/api/upload-resume", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setErrorMsg(data.error ?? "Upload failed."); onUpload(null); return; }
      setStatus("done");
      onUpload(data);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again.");
      onUpload(null);
    }
  }

  function handleFile(f: File | undefined) {
    if (!f) return;
    upload(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  if (status === "done" && file) {
    return (
      <div style={{ border: "2px solid #86efac", borderRadius: 10, padding: "14px 18px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#15803d" }}>{file.name}</p>
            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{fmtSize(file.size)} · Uploaded successfully</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setStatus("idle"); setFile(null); onUpload(null); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20, lineHeight: 1, padding: 4 }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#f97316" : status === "error" ? "#fca5a5" : "#e2e8f0"}`,
          borderRadius: 10, padding: "28px 20px", textAlign: "center",
          cursor: "pointer", background: dragging ? "#fff7ed" : "white",
          transition: "all 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: "none" }}
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {status === "uploading" ? (
          <div>
            <div style={{ width: 36, height: 36, border: "3px solid #f97316", borderTop: "3px solid transparent", borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#64748b", margin: 0 }}>Uploading {file?.name}…</p>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: 36, display: "block", marginBottom: 10 }}>📎</span>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#374151", margin: "0 0 4px" }}>
              Drop your resume here or <span style={{ color: "#f97316" }}>browse</span>
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>PDF, DOC, or DOCX · max 5MB</p>
          </div>
        )}
      </div>

      {status === "error" && (
        <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>⚠ {errorMsg}</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function ApplyForm({ postingId, postingTitle }: { postingId: number; postingTitle: string }) {
  const [state, setState]     = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [resume, setResume]   = useState<{ url: string; filename: string; size: number } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    const fd = new FormData(e.currentTarget);

    const result = await submitApplicationAction({
      posting_id:      postingId,
      name:            fd.get("name") as string,
      email:           fd.get("email") as string,
      phone:           fd.get("phone") as string,
      linkedin:        fd.get("linkedin") as string,
      portfolio:       fd.get("portfolio") as string,
      cover_letter:    fd.get("cover_letter") as string,
      resume_text:     "",
      resume_url:      resume?.url,
      resume_filename: resume?.filename,
      resume_size:     resume?.size,
    });

    if (result.success) { setState("success"); }
    else { setErrorMsg(result.error ?? "Something went wrong."); setState("error"); }
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
      <Field label="Cover Letter" name="cover_letter" placeholder="Tell us why you're a great fit…" rows={5} />

      {/* Resume upload */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>
          Resume <span style={{ color: "#94a3b8", fontWeight: 400 }}>(PDF, DOC, or DOCX)</span>
        </label>
        <ResumeUploader onUpload={setResume} />
      </div>

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
