import { getCRMCustomer, getAccountManagers, getOnboarding, getCRMTasks, getCustomerHealth } from "@/app/actions/crm";
import { getProjects } from "@/app/actions/projects";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RoleManager, AMAssigner } from "./crm-customer-client";
import { CustomerTabView } from "./customer-tab-view";
import { TempPasswordButton } from "@/components/temp-password-button";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default async function CRMCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, session, accountManagers, onboarding, tasks, health, projects] = await Promise.all([
    getCRMCustomer(Number(id)),
    getSession(),
    getAccountManagers(),
    getOnboarding("customer", Number(id)),
    getCRMTasks({ entityType: "customer", entityId: Number(id) }),
    getCustomerHealth(Number(id)),
    getProjects({ entityType: "customer", entityId: Number(id), scope: "all" }),
  ]);
  if (!data) notFound();

  const { customer, orders, quotes, notes, activities, contacts } = data;
  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/customers" style={{ color: "var(--crm-muted2)", textDecoration: "none" }}>Customers</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "var(--crm-text)", fontWeight: 700 }}>{fullName}</span>
      </div>

      {/* Customer header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "20px 24px",
        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f5c700",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#000", flexShrink: 0 }}>
            {customer.first_name[0]}{customer.last_name[0]}
          </div>
          <div>
            <h1 style={{ color: "var(--crm-surface)", fontSize: 20, fontWeight: 900, margin: "0 0 2px",
              letterSpacing: "-0.02em" }}>{fullName}</h1>
            <p style={{ color: "var(--crm-muted)", fontSize: 13, margin: "0 0 6px" }}>{customer.email}</p>
            {health && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                background: health.bg, color: health.color,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%",
                  background: health.color, flexShrink: 0 }} />
                {health.label} · {health.score}/100
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Orders",       value: orders.length },
            { label: "Total Spent",  value: fmt(totalSpent) },
            { label: "Quotes",       value: quotes.length },
            { label: "Member Since", value: new Date(customer.created_at).getFullYear() },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ color: "#f5c700", fontSize: 20, fontWeight: 900, margin: 0 }}>{s.value}</p>
              <p style={{ color: "var(--crm-muted)", fontSize: 11, margin: 0, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: tabs + management sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* Left: tabbed content */}
        <CustomerTabView
          customerId={customer.id}
          customerEmail={customer.email}
          customerName={fullName}
          orders={orders}
          quotes={quotes}
          notes={notes}
          activities={activities}
          contacts={contacts}
          onboarding={onboarding}
          tasks={tasks}
          taskAMs={accountManagers}
          sessionId={session?.id ?? 0}
          isAdmin={session?.role === "admin"}
        />

        {/* Right: persistent management panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Health score breakdown */}
          {health && (
            <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#0d0d0d",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                  Health Score
                </h2>
                <span style={{ fontSize: 18, fontWeight: 900, color: health.color,
                  background: health.bg, padding: "2px 10px", borderRadius: 20 }}>
                  {health.score}
                </span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                {[
                  { label: "Order Recency",  pts: health.breakdown.recency,     max: 25, icon: "📅" },
                  { label: "Order Frequency",pts: health.breakdown.frequency,   max: 20, icon: "🔄" },
                  { label: "Spend vs Avg",   pts: health.breakdown.spend,       max: 20, icon: "💰" },
                  { label: "Onboarding",     pts: health.breakdown.onboarding,  max: 15, icon: "🚀" },
                  { label: "Engagement",     pts: health.breakdown.engagement,  max: 10, icon: "💬" },
                  { label: "Quotes",         pts: health.breakdown.quotes,      max: 10, icon: "📋" },
                ].map(f => {
                  const pct = f.max > 0 ? (f.pts / f.max) * 100 : 0;
                  const barColor = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={f.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--crm-text2)", fontWeight: 600,
                          display: "flex", alignItems: "center", gap: 5 }}>
                          <span>{f.icon}</span>{f.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--crm-muted)" }}>
                          {f.pts}/{f.max}
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#f1f1f1", borderRadius: 3 }}>
                        <div style={{ height: "100%", borderRadius: 3,
                          width: `${pct}%`, background: barColor,
                          transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--crm-border2)",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--crm-muted2)" }}>Total score</span>
                  <span style={{ fontSize: 14, fontWeight: 900, padding: "2px 10px",
                    borderRadius: 20, background: health.bg, color: health.color }}>
                    {health.label} · {health.score}/100
                  </span>
                </div>
              </div>
            </div>
          )}
          {/* Projects panel */}
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#0d0d0d",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                Projects ({projects.length})
              </h2>
              <Link href={`/crm/projects?entity=customer&id=${customer.id}`}
                style={{ fontSize: 11, color: "var(--crm-muted)", textDecoration: "none", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {projects.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--crm-muted2)", margin: "0 0 10px" }}>No projects yet</p>
                <Link href="/crm/projects" style={{ fontSize: 12, color: "#f5c700",
                  fontWeight: 700, textDecoration: "none" }}>
                  + Create project
                </Link>
              </div>
            ) : (
              <div>
                {projects.map((p, i) => {
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
                      borderBottom: i < projects.length - 1 ? "1px solid var(--crm-border2)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%",
                          background: sc.dot, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)",
                          margin: 0, flex: 1, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, paddingLeft: 15 }}>
                        <span style={{ fontSize: 10, color: sc.color, fontWeight: 700,
                          textTransform: "capitalize" }}>
                          {p.status.replace("_"," ")}
                        </span>
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
            )}
          </div>

          <RoleManager
            customerId={customer.id}
            currentRole={customer.role}
            sessionRole={session?.role ?? "account_manager"}
          />
          <AMAssigner
            customerId={customer.id}
            currentAMId={(customer as any).account_manager_id ?? null}
            accountManagers={accountManagers}
          />

          {/* Temp password */}
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", padding: "16px 18px" }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: "0 0 6px" }}>
              Account Access
            </h2>
            <p style={{ fontSize: 12, color: "var(--crm-muted2)", margin: "0 0 12px", lineHeight: 1.5 }}>
              Issue a temporary password that expires in 24 hours.
            </p>
            <TempPasswordButton
              userId={customer.id}
              userName={`${customer.first_name} ${customer.last_name}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
