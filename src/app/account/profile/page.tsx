import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { PasswordForm } from "@/components/password-form";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>

      <div style={{ marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Profile</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "4px 0 0" }}>Manage your personal information and password</p>
      </div>

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

      <ProfileForm
        firstName={session.firstName}
        lastName={session.lastName}
        email={session.email}
      />

      <PasswordForm />

    </div>
  );
}
