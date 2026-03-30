import { getCRMCompany, getAccountManagers, getOnboarding, getCRMTasks } from "@/app/actions/crm";
import { getProjects } from "@/app/actions/projects";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyTabView } from "./company-tab-view";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function CRMCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, accountManagers, onboarding, tasks, session, projects] = await Promise.all([
    getCRMCompany(Number(id)),
    getAccountManagers(),
    getOnboarding("company", Number(id)),
    getCRMTasks({ entityType: "company", entityId: Number(id) }),
    getSession(),
    getProjects({ entityType: "company", entityId: Number(id), scope: "all" }),
  ]);
  if (!data) notFound();
  const { company, employees } = data;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/companies" style={{ color: "var(--crm-muted2)", textDecoration: "none" }}>Companies</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "var(--crm-text)", fontWeight: 700 }}>{company.name}</span>
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
            <h1 style={{ color: "var(--crm-surface)", fontSize: 20, fontWeight: 900, margin: "0 0 2px",
              letterSpacing: "-0.02em" }}>{company.name}</h1>
            <p style={{ color: "var(--crm-muted)", fontSize: 13, margin: 0 }}>
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
              <p style={{ color: "var(--crm-muted)", fontSize: 11, margin: 0, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: tabs + projects sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        <CompanyTabView
          company={company as any}
          employees={employees}
          onboarding={onboarding}
          accountManagers={accountManagers}
          tasks={tasks}
          sessionId={session?.id ?? 0}
          isAdmin={session?.role === "admin"}
        />

        {/* Right sidebar: projects */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                Projects ({projects.length})
              </h2>
              <Link href="/crm/projects" style={{ fontSize: 11, color: "var(--crm-muted)",
                textDecoration: "none", fontWeight: 600 }}>View all →</Link>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--crm-muted2)", margin: "0 0 10px" }}>No projects yet</p>
                <Link href="/crm/projects" style={{ fontSize: 12, color: "#f5c700",
                  fontWeight: 700, textDecoration: "none" }}>+ Create project</Link>
              </div>
            ) : projects.map((p, i) => {
              const statusColors: Record<string,{color:string;dot:string}> = {
                active:    { color: "#15803d", dot: "#22c55e" },
                on_hold:   { color: "#92400e", dot: "#f59e0b" },
                completed: { color: "#1e40af", dot: "#3b82f6" },
                cancelled: { color: "var(--crm-muted)", dot: "#9ca3af" },
              };
              const sc = statusColors[p.status] ?? statusColors.active;
              return (
                <Link key={p.id} href={`/crm/projects/${p.id}`} style={{
                  display: "block", padding: "10px 14px", textDecoration: "none",
                  borderBottom: i < projects.length - 1 ? "1px solid var(--crm-border2)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%",
                      background: sc.dot, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)", margin: 0,
                      flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 4, paddingLeft: 15 }}>
                    <span style={{ fontSize: 10, color: sc.color, fontWeight: 700,
                      textTransform: "capitalize" }}>{p.status.replace("_"," ")}</span>
                    {p.open_task_count > 0 && (
                      <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>
                        {p.open_task_count} open task{p.open_task_count !== 1 ? "s" : ""}
                      </span>
                    )}
                    {p.value && (
                      <span style={{ fontSize: 10, color: "var(--crm-muted2)" }}>
                        ${Number(p.value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
