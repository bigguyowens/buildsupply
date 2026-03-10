import { GuestReturnForm } from "./guest-return-form";
import Link from "next/link";

export const metadata = {
  title: "Start a Return | BuildSupply",
  description: "Return an item from a guest order. Enter your order number and email to get started.",
};

export default function GuestReturnsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Hero */}
      <div style={{ background: "#0f172a", borderBottom: "3px solid #f97316", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#f97316", margin: "0 0 10px" }}>
          Returns & Exchanges
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", margin: "0 0 12px" }}>Start a Return</h1>
        <p style={{ color: "#94a3b8", fontSize: 15, margin: "0 auto", maxWidth: 440 }}>
          Enter your order number and the email address used at checkout to begin your return.
        </p>
      </div>

      {/* Policy bar */}
      <div style={{ background: "#f97316" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 24px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
          {[
            { icon: "📦", label: "30-Day Returns" },
            { icon: "🔄", label: "Free Exchanges" },
            { icon: "💳", label: "Refund in 3–5 Days" },
            { icon: "🤝", label: "No-Hassle Policy" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, color: "white" }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 680, margin: "48px auto", padding: "0 24px" }}>
        <GuestReturnForm />

        <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginTop: 32 }}>
          Have an account?{" "}
          <Link href="/login" style={{ color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>{" "}
          to manage all your returns in one place.
        </p>
      </div>
    </div>
  );
}
