import { validateResetToken } from "@/app/actions/password-reset";
import { ResetPasswordClient } from "./reset-password-client";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  // No token at all
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "44px 40px",
          maxWidth: 440, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            Invalid Reset Link
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
            This password reset link is invalid or missing. Please request a new one.
          </p>
          <Link href="/forgot-password" style={{ display: "inline-block", padding: "10px 24px",
            background: "#0d0d0d", color: "#f5c700", borderRadius: 8,
            fontSize: 14, fontWeight: 800, textDecoration: "none" }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const validation = await validateResetToken(token);

  if (!validation.valid) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f2f2f2", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "44px 40px",
          maxWidth: 440, width: "100%", textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {validation.expired ? "⏰" : "🚫"}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0d0d0d", margin: "0 0 10px" }}>
            {validation.expired ? "Link Expired" : "Link Already Used"}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
            {validation.error}
            {validation.expired && " Reset links expire after 1 hour."}
          </p>
          <Link href="/forgot-password" style={{ display: "inline-block", padding: "10px 24px",
            background: "#0d0d0d", color: "#f5c700", borderRadius: 8,
            fontSize: 14, fontWeight: 800, textDecoration: "none", marginRight: 10 }}>
            Request New Link
          </Link>
          <Link href="/login" style={{ display: "inline-block", padding: "10px 20px",
            background: "transparent", border: "1px solid #e5e5e5",
            color: "#6b7280", borderRadius: 8,
            fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return <ResetPasswordClient token={token} />;
}
