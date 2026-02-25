import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/account" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13 }}>← Account</Link>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Profile</h1>
        </div>
      </div>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Avatar / identity summary */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", padding: "24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 22, flexShrink: 0,
          }}>
            {session.firstName[0]}{session.lastName[0]}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{session.firstName} {session.lastName}</p>
            <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "2px 0 0" }}>{session.email}</p>
            <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "4px 0 0", textTransform: "capitalize" }}>
              {session.role} account
            </p>
          </div>
        </div>

        {/* Profile info form */}
        <ProfileForm
          firstName={session.firstName}
          lastName={session.lastName}
          email={session.email}
        />

        {/* Password change form */}
        <PasswordForm />

      </main>
    </div>
  );
}
