import { getCRMCompany, getAccountManagers, getOnboarding } from "@/app/actions/crm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyDetailClient } from "./company-detail-client";
import { OnboardingTracker } from "@/components/onboarding-tracker";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  company_admin: { label: "Admin",    bg: "#fef3c7", color: "#92400e" },
  customer:      { label: "Member",   bg: "#f1f5f9", color: "#475569" },
  admin:         { label: "Admin",    bg: "#fce7f3", color: "#9d174d" },
};

export default async function CRMCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, accountManagers, onboarding] = await Promise.all([
    getCRMCompany(Number(id)),
    getAccountManagers(),
    getOnboarding("company", Number(id)),
  ]);
  if (!data) notFound();
  const { company, employees } = data;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/companies" style={{ color: "#9ca3af", textDecoration: "none" }}>Companies</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "#0d0d0d", fontWeight: 700 }}>{company.name}</span>
      </div>

      {/* Company header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "20px 24px",
        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: "#f5c700",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#000", flexShrink: 0 }}>
            {company.name[0]}
          </div>
          <div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 900, margin: "0 0 2px",
              letterSpacing: "-0.02em" }}>{company.name}</h1>
            <p style={{ color: "#6b6b6b", fontSize: 13, margin: 0 }}>
              {company.industry ?? ""}{company.domain ? ` · ${company.domain}` : ""}
              {company.city ? ` · ${company.city}, ${company.state}` : ""}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Employees",   value: company.employee_count },
            { label: "Revenue",     value: fmt(Number(company.total_spent)) },
            { label: "Orders",      value: company.order_count },
            { label: "Open Quotes", value: company.open_quotes },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: "#f5c700", fontSize: 20, fontWeight: 900, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#6b6b6b", fontSize: 11, margin: 0, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* Left: Employees table */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1", background: "#0d0d0d" }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
              Employees ({employees.length})
            </h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["Name", "Email", "Role", "Orders", "Spent", ""].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10,
                    fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => {
                const roleMeta = ROLE_META[emp.role] ?? ROLE_META.customer;
                return (
                  <tr key={emp.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f5c700",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <Link href={`/crm/customers/${emp.id}`}
                          style={{ fontWeight: 700, color: "#0d0d0d", textDecoration: "none" }}>
                          {emp.first_name} {emp.last_name}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#6b7280", fontSize: 12 }}>{emp.email}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: roleMeta.bg, color: roleMeta.color }}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "#0d0d0d" }}>{emp.order_count}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: "#22c55e" }}>
                      {fmt(Number(emp.total_spent))}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <Link href={`/crm/customers/${emp.id}`}
                        style={{ fontSize: 12, color: "#f5c700", fontWeight: 700, textDecoration: "none" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: Company details + AM assignment + Onboarding */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CompanyDetailClient
            company={company as any}
            accountManagers={accountManagers}
          />

          {/* Onboarding tracker */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Company Onboarding</h2>
              <span style={{ fontSize: 11, color: "#6b6b6b", fontWeight: 600 }}>
                {onboarding.complete}/{onboarding.total} steps
              </span>
            </div>
            <div style={{ padding: 14 }}>
              <OnboardingTracker
                entityType="company"
                entityId={company.id}
                initialData={onboarding}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
