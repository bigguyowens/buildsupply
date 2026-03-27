import { getCRMDashboard, getOnboardingPipeline } from "@/app/actions/crm";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ACTIVITY_ICONS: Record<string, string> = {
  order_placed:      "🛒",
  order:             "📦",
  quote:             "📋",
  quote_created:     "📋",
  email_sent:        "✉️",
  contact_form:      "📨",
  note:              "📝",
  call:              "📞",
  return:            "↩️",
  return_requested:  "↩️",
  review:            "⭐",
};

const ACTIVITY_COLORS: Record<string, string> = {
  order_placed:  "#22c55e",
  order:         "#22c55e",
  quote:         "#f5c700",
  quote_created: "#f5c700",
  email_sent:    "#3b82f6",
  contact_form:  "#8b5cf6",
  note:          "#94a3b8",
  call:          "#f97316",
  return:        "#ef4444",
};

export default async function CRMDashboard() {
  const [data, pipeline] = await Promise.all([
    getCRMDashboard(),
    getOnboardingPipeline(),
  ]);

  const kpis = [
    { label: "Total Customers",  value: data.customerCount.toLocaleString(), icon: "👥", delta: null,        color: "#f5c700" },
    { label: "Total Revenue",    value: fmt(data.totalRevenue),               icon: "💰", delta: null,        color: "#22c55e" },
    { label: "Total Orders",     value: data.orderCount.toLocaleString(),     icon: "🛒", delta: `+${data.ordersToday} today`, color: "#3b82f6" },
    { label: "Open Quotes",      value: data.openQuotes.toLocaleString(),     icon: "📋", delta: "Awaiting response", color: "#f97316" },
    { label: "Pending Contacts", value: data.pendingContacts.toLocaleString(),icon: "✉️", delta: "Need reply",    color: "#ef4444" },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          CRM Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Overview of customers, orders, quotes, and activity
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 10, padding: "20px 20px 16px",
            border: "1px solid #e5e5e5", borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 8px" }}>{k.label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#0d0d0d",
                  letterSpacing: "-0.03em" }}>{k.value}</p>
                {k.delta && <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0", fontWeight: 600 }}>{k.delta}</p>}
              </div>
              <span style={{ fontSize: 24, opacity: 0.6 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>

        {/* Recent activity feed */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f1f1",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "#0d0d0d" }}>Recent Activity</h2>
            <Link href="/crm/customers" style={{ fontSize: 12, color: "#f5c700", textDecoration: "none", fontWeight: 700 }}>
              View All →
            </Link>
          </div>
          <div style={{ padding: "8px 0" }}>
            {data.recentActivity.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 14, padding: "24px 20px", textAlign: "center" }}>No activity yet</p>
            ) : data.recentActivity.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: 14, padding: "12px 20px",
                borderBottom: i < data.recentActivity.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: `${ACTIVITY_COLORS[a.type] ?? "#94a3b8"}18`,
                  border: `2px solid ${ACTIVITY_COLORS[a.type] ?? "#94a3b8"}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {ACTIVITY_ICONS[a.type] ?? "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0d0d0d", margin: "0 0 2px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Link href={`/crm/customers/${a.customer_id}`}
                      style={{ color: "#0d0d0d", textDecoration: "none" }}>
                      {(a as any).customer_name ?? "Customer"}
                    </Link>
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{a.description}</p>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: quick actions + pending contacts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Quick actions */}
          <div style={{ background: "#0d0d0d", borderRadius: 10, padding: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", color: "#6b6b6b", margin: "0 0 14px" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "View All Customers",   href: "/crm/customers",  icon: "👥" },
                { label: "Contact Queue",         href: "/crm/contacts",   icon: "✉️" },
                { label: "Open Quotes",           href: "/crm/quotes",     icon: "📋" },
                { label: "Check Inventory",       href: "/crm/inventory",  icon: "📦" },
              ].map(a => (
                <Link key={a.href} href={a.href} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 6, textDecoration: "none",
                  background: "#1a1a1a", color: "#e0e0e0", fontSize: 13, fontWeight: 600,
                  transition: "background 0.15s",
                }}>
                  <span>{a.icon}</span>{a.label}
                  <span style={{ marginLeft: "auto", color: "#f5c700", fontSize: 12 }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending contact forms */}
          {data.pendingContacts > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f1f1",
                background: "#fffbeb", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#92400e", margin: 0 }}>
                    {data.pendingContacts} Pending {data.pendingContacts === 1 ? "Contact" : "Contacts"}
                  </p>
                  <p style={{ fontSize: 11, color: "#b45309", margin: 0 }}>Awaiting response</p>
                </div>
                <Link href="/crm/contacts" style={{ marginLeft: "auto", fontSize: 12,
                  color: "#f97316", fontWeight: 700, textDecoration: "none" }}>
                  Handle →
                </Link>
              </div>
            </div>
          )}

          {/* Open quotes alert */}
          {data.openQuotes > 0 && (
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", background: "#fefce8",
                display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#713f12", margin: 0 }}>
                    {data.openQuotes} Open {data.openQuotes === 1 ? "Quote" : "Quotes"}
                  </p>
                  <p style={{ fontSize: 11, color: "#854d0e", margin: 0 }}>Awaiting customer response</p>
                </div>
                <Link href="/crm/quotes" style={{ marginLeft: "auto", fontSize: 12,
                  color: "#f5c700", fontWeight: 700, textDecoration: "none" }}>
                  View →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Pipeline */}
      {(pipeline.customers.length > 0 || pipeline.companies.length > 0) && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 14px" }}>
            Onboarding In Progress
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Customer onboarding */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f1f1", background: "#0d0d0d" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                  Customers ({pipeline.customers.length})
                </h3>
              </div>
              <div>
                {pipeline.customers.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", borderBottom: i < pipeline.customers.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5c700",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/crm/customers/${c.id}`}
                        style={{ fontSize: 13, fontWeight: 700, color: "#0d0d0d", textDecoration: "none",
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.first_name} {c.last_name}
                      </Link>
                      {c.account_manager_name && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{c.account_manager_name}</p>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 900, margin: 0,
                        color: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }}>
                        {c.percent}%
                      </p>
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{c.complete}/{c.total}</p>
                    </div>
                    <div style={{ width: 50, height: 4, background: "#f1f1f1", borderRadius: 2, flexShrink: 0 }}>
                      <div style={{ height: "100%", borderRadius: 2,
                        width: `${c.percent}%`,
                        background: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company onboarding */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f1f1", background: "#0d0d0d" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                  Companies ({pipeline.companies.length})
                </h3>
              </div>
              <div>
                {pipeline.companies.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", borderBottom: i < pipeline.companies.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: "#0d0d0d",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: "#f5c700", flexShrink: 0 }}>
                      {c.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/crm/companies/${c.id}`}
                        style={{ fontSize: 13, fontWeight: 700, color: "#0d0d0d", textDecoration: "none",
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name}
                      </Link>
                      {c.account_manager_name && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{c.account_manager_name}</p>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 900, margin: 0,
                        color: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }}>
                        {c.percent}%
                      </p>
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{c.complete}/{c.total}</p>
                    </div>
                    <div style={{ width: 50, height: 4, background: "#f1f1f1", borderRadius: 2, flexShrink: 0 }}>
                      <div style={{ height: "100%", borderRadius: 2,
                        width: `${c.percent}%`,
                        background: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
