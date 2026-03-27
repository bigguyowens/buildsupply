import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyCompany, getMyCompanyMembers } from "@/app/actions/company";
import { CompanyAdminClient } from "./company-admin-client";

export default async function AccountCompanyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["company_admin", "admin"].includes(session.role)) redirect("/account");

  const [company, members] = await Promise.all([
    getMyCompany(),
    getMyCompanyMembers(),
  ]);

  if (!company) {
    return (
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)",
        padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No company found</p>
        <p style={{ color: "var(--color-muted)", fontSize: 14 }}>
          Contact your account manager to set up your company account.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{company.name}</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {company.industry ?? ""}
          {company.city ? ` · ${company.city}, ${company.state}` : ""}
        </p>
      </div>

      {/* Company info */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)",
        padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {[
          { label: "Industry",        value: company.industry },
          { label: "Phone",           value: company.phone },
          { label: "Location",        value: company.city ? `${company.city}, ${company.state}` : null },
          { label: "Domain",          value: company.domain },
          { label: "Account Manager", value: company.account_manager_name },
          { label: "Members",         value: String(members.length) },
        ].map(f => f.value && (
          <div key={f.label}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--color-muted)", margin: "0 0 4px" }}>{f.label}</p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* Members */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
            Team Members ({members.length})
          </h2>
        </div>
        <CompanyAdminClient members={members} currentUserId={session.id} />
      </div>
    </div>
  );
}
