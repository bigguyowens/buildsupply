import { getCRMCompany, getAccountManagers, getOnboarding, getCRMTasks } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyTabView } from "./company-tab-view";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function CRMCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, accountManagers, onboarding, tasks, session] = await Promise.all([
    getCRMCompany(Number(id)),
    getAccountManagers(),
    getOnboarding("company", Number(id)),
    getCRMTasks({ entityType: "company", entityId: Number(id) }),
    getSession(),
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
              {company.industry ?? ""}
              {company.domain ? ` · ${company.domain}` : ""}
              {(company as any).city ? ` · ${(company as any).city}, ${(company as any).state}` : ""}
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

      {/* Tabbed content — full width */}
      <CompanyTabView
        company={company as any}
        employees={employees}
        onboarding={onboarding}
        accountManagers={accountManagers}
        tasks={tasks}
        sessionId={session?.id ?? 0}
        isAdmin={session?.role === "admin"}
      />
    </div>
  );
}
