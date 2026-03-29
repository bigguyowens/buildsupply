import { getCRMDashboardEnhanced, getOnboardingPipeline, getTaskCounts } from "@/app/actions/crm";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ACTIVITY_ICONS: Record<string, string> = {
  order_placed: "🛒", order: "📦", quote: "📋", quote_created: "📋",
  email_sent: "✉️", contact_form: "📨", note: "📝", call: "📞",
  return: "↩️", return_requested: "↩️", review: "⭐",
};
const ACTIVITY_COLORS: Record<string, string> = {
  order_placed: "#22c55e", order: "#22c55e", quote: "#f5c700", quote_created: "#f5c700",
  email_sent: "#3b82f6", contact_form: "#8b5cf6", note: "#94a3b8",
  call: "#f97316", return: "#ef4444",
};

const HEALTH_META = {
  "Healthy":         { color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  "At Risk":         { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  "Needs Attention": { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  "New":             { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
};

export default async function CRMDashboard() {
  const [data, pipeline, taskCounts] = await Promise.all([
    getCRMDashboardEnhanced(),
    getOnboardingPipeline(),
    getTaskCounts(),
  ]);

  const { healthSummary: hs, revenueSparkline, topCustomers, winRate, recentTasks } = data;
  const maxSparkline = Math.max(...revenueSparkline.map(r => Number(r.revenue)), 1);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          CRM Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Overview of customers, orders, quotes, and team activity
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Customers",  value: data.customerCount.toLocaleString(), icon: "👥", color: "#f5c700", delta: null },
          { label: "Total Revenue",    value: fmt(data.totalRevenue),               icon: "💰", color: "#22c55e", delta: null },
          { label: "Total Orders",     value: data.orderCount.toLocaleString(),     icon: "🛒", color: "#3b82f6", delta: `+${data.ordersToday} today` },
          { label: "Open Quotes",      value: data.openQuotes.toLocaleString(),     icon: "📋", color: "#f97316", delta: `${winRate}% win rate` },
          { label: "Pending Contacts", value: data.pendingContacts.toLocaleString(),icon: "✉️", color: "#ef4444", delta: "Need reply" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 10, padding: "18px 18px 14px",
            border: "1px solid #e5e5e5", borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 6px" }}>{k.label}</p>
                <p style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#0d0d0d",
                  letterSpacing: "-0.03em" }}>{k.value}</p>
                {k.delta && <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0", fontWeight: 600 }}>{k.delta}</p>}
              </div>
              <span style={{ fontSize: 22, opacity: 0.5 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Task alert strip */}
      {(taskCounts.overdue > 0 || taskCounts.due_today > 0) && (
        <Link href="/crm/tasks" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
          <div style={{ background: taskCounts.overdue > 0 ? "#0d0d0d" : "#fffbeb",
            borderRadius: 10, padding: "12px 20px",
            border: `1px solid ${taskCounts.overdue > 0 ? "#0d0d0d" : "#fde68a"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16 }}>{taskCounts.overdue > 0 ? "⚠️" : "📅"}</span>
              {taskCounts.overdue > 0 && (
                <span style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>
                  {taskCounts.overdue} overdue task{taskCounts.overdue !== 1 ? "s" : ""}
                </span>
              )}
              {taskCounts.due_today > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700,
                  color: taskCounts.overdue > 0 ? "#fde68a" : "#92400e" }}>
                  {taskCounts.due_today} due today
                </span>
              )}
              {taskCounts.upcoming > 0 && (
                <span style={{ fontSize: 12, color: taskCounts.overdue > 0 ? "#6b7280" : "#9ca3af" }}>
                  · {taskCounts.upcoming} upcoming
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#f5c700" }}>View tasks →</span>
          </div>
        </Link>
      )}

      {/* Main grid: health + sparkline | activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginBottom: 20 }}>

        {/* Left: Health score + revenue sparkline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer Health Breakdown */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f1f1",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Customer Health</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Avg score:</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#0d0d0d" }}>{hs.avgScore}</span>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>/ 100</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
              {([
                { label: "Healthy",         count: hs.healthy,        key: "Healthy" },
                { label: "At Risk",         count: hs.atRisk,         key: "At Risk" },
                { label: "Needs Attention", count: hs.needsAttention, key: "Needs Attention" },
                { label: "New",             count: hs.new,            key: "New" },
              ] as const).map((h, i) => {
                const m = HEALTH_META[h.key];
                const pct = hs.total > 0 ? Math.round((h.count / hs.total) * 100) : 0;
                return (
                  <div key={h.key} style={{
                    padding: "18px 16px", textAlign: "center",
                    borderRight: i < 3 ? "1px solid #f1f1f1" : "none",
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%",
                      background: m.dot, margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 28, fontWeight: 900, margin: "0 0 2px",
                      color: m.color }}>{h.count}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                      margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {h.label}
                    </p>
                    <p style={{ fontSize: 11, color: "#d1d5db", margin: 0 }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
            {/* Bar chart */}
            <div style={{ padding: "0 20px 16px", display: "flex", gap: 3, alignItems: "flex-end", height: 36 }}>
              {(["Healthy", "At Risk", "Needs Attention", "New"] as const).map(key => {
                const counts = { Healthy: hs.healthy, "At Risk": hs.atRisk, "Needs Attention": hs.needsAttention, New: hs.new };
                const pct = hs.total > 0 ? (counts[key] / hs.total) * 100 : 0;
                return (
                  <div key={key} title={key} style={{
                    flex: pct, height: "100%", borderRadius: 3,
                    background: HEALTH_META[key].dot, minWidth: pct > 0 ? 4 : 0,
                    transition: "flex 0.3s",
                  }} />
                );
              })}
            </div>
            <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #f9f9f9" }}>
              <Link href="/crm/customers" style={{ fontSize: 12, color: "#f5c700",
                fontWeight: 700, textDecoration: "none" }}>View all customers →</Link>
            </div>
          </div>

          {/* Revenue Sparkline */}
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", padding: "16px 20px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 16px" }}>Revenue — Last 6 Months</h2>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
              {revenueSparkline.map(r => {
                const pct = (Number(r.revenue) / maxSparkline) * 100;
                return (
                  <div key={r.month} style={{ flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", borderRadius: "3px 3px 0 0",
                      background: "#f5c700", height: `${Math.max(pct, 4)}%`,
                      transition: "height 0.3s" }} title={fmt(Number(r.revenue))} />
                    <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{r.month}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Peak: {fmt(Math.max(...revenueSparkline.map(r => Number(r.revenue))))}
              </span>
              <Link href="/crm/analytics" style={{ fontSize: 12, color: "#f5c700",
                fontWeight: 700, textDecoration: "none" }}>Full analytics →</Link>
            </div>
          </div>
        </div>

        {/* Right: Activity feed */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden",
          display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f1f1",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Recent Activity</h2>
            <Link href="/crm/customers" style={{ fontSize: 12, color: "#f5c700",
              textDecoration: "none", fontWeight: 700 }}>View All →</Link>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {data.recentActivity.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, padding: "24px 20px", textAlign: "center" }}>
                No activity yet
              </p>
            ) : data.recentActivity.map((a, i) => (
              <div key={a.id} style={{ display: "flex", gap: 12, padding: "11px 16px",
                borderBottom: i < data.recentActivity.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: `${ACTIVITY_COLORS[a.type] ?? "#94a3b8"}18`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {ACTIVITY_ICONS[a.type] ?? "📌"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0d0d0d", margin: "0 0 1px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <Link href={`/crm/customers/${a.customer_id}`}
                      style={{ color: "#0d0d0d", textDecoration: "none" }}>
                      {(a as any).customer_name ?? "Customer"}
                    </Link>
                  </p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.description}
                  </p>
                </div>
                <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>
                  {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row: Top customers + upcoming tasks + quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 260px", gap: 20, marginBottom: 20 }}>

        {/* Top 5 customers */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", background: "#0d0d0d" }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Top Customers</h2>
          </div>
          <div>
            {topCustomers.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderBottom: i < topCustomers.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 900, width: 20, textAlign: "center",
                  color: i === 0 ? "#f5c700" : i === 1 ? "#9ca3af" : "#d1d5db" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/crm/customers/${c.id}`} style={{ fontSize: 13, fontWeight: 700,
                    color: "#0d0d0d", textDecoration: "none",
                    display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.first_name} {c.last_name}
                  </Link>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                    {c.order_count} order{c.order_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e" }}>
                  {fmt(Number(c.revenue))}
                </span>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 16px", textAlign: "center" }}>
                No orders yet
              </p>
            )}
          </div>
        </div>

        {/* Upcoming tasks */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f1f1",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#0d0d0d", margin: 0 }}>Next Tasks</h2>
            <Link href="/crm/tasks" style={{ fontSize: 12, color: "#f5c700",
              fontWeight: 700, textDecoration: "none" }}>All tasks →</Link>
          </div>
          <div>
            {recentTasks.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, padding: "20px 16px", textAlign: "center" }}>
                No upcoming tasks
              </p>
            ) : recentTasks.map((t, i) => {
              const isOverdue = t.due_date && new Date(t.due_date) < new Date();
              return (
                <div key={t.id} style={{ padding: "11px 16px",
                  borderBottom: i < recentTasks.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 14, marginTop: 1 }}>
                      {t.type === "call" ? "📞" : t.type === "email" ? "📧" : "✅"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0d0d0d", margin: "0 0 2px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.title.length > 44 ? t.title.slice(0, 44) + "…" : t.title}
                      </p>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {t.entity_name && (
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>{t.entity_name}</span>
                        )}
                        {t.due_date && (
                          <span style={{ fontSize: 10, fontWeight: 700,
                            color: isOverdue ? "#ef4444" : "#6b7280" }}>
                            {isOverdue ? "⚠ " : ""}
                            {new Date(t.due_date).toLocaleDateString("en-US",
                              { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ background: "#0d0d0d", borderRadius: 10, padding: 18 }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#6b6b6b", margin: "0 0 12px" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "All Customers",   href: "/crm/customers",  icon: "👥" },
              { label: "Contact Queue",   href: "/crm/contacts",   icon: "✉️" },
              { label: "Open Quotes",     href: "/crm/quotes",     icon: "📋" },
              { label: "Tasks",           href: "/crm/tasks",      icon: "✅" },
              { label: "Analytics",       href: "/crm/analytics",  icon: "📈" },
              { label: "Inventory",       href: "/crm/inventory",  icon: "📦" },
            ].map(a => (
              <Link key={a.href} href={a.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 6, textDecoration: "none",
                background: "#1a1a1a", color: "#e0e0e0", fontSize: 12, fontWeight: 600,
              }}>
                <span>{a.icon}</span>{a.label}
                <span style={{ marginLeft: "auto", color: "#f5c700", fontSize: 11 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Onboarding pipeline */}
      {(pipeline.customers.length > 0 || pipeline.companies.length > 0) && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 12px" }}>
            Onboarding In Progress
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Customer onboarding */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#0d0d0d" }}>
                <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                  Customers ({pipeline.customers.length})
                </h3>
              </div>
              {pipeline.customers.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderBottom: i < pipeline.customers.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f5c700",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/crm/customers/${c.id}`} style={{ fontSize: 12, fontWeight: 700,
                      color: "#0d0d0d", textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {c.first_name} {c.last_name}
                    </Link>
                    {c.account_manager_name && (
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{c.account_manager_name}</p>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 900, margin: 0,
                      color: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }}>
                      {c.percent}%
                    </p>
                  </div>
                  <div style={{ width: 44, height: 4, background: "#f1f1f1", borderRadius: 2 }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${c.percent}%`,
                      background: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Company onboarding */}
            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: "#0d0d0d" }}>
                <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>
                  Companies ({pipeline.companies.length})
                </h3>
              </div>
              {pipeline.companies.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderBottom: i < pipeline.companies.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 5, background: "#0d0d0d",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, color: "#f5c700", flexShrink: 0 }}>
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/crm/companies/${c.id}`} style={{ fontSize: 12, fontWeight: 700,
                      color: "#0d0d0d", textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {c.name}
                    </Link>
                    {c.account_manager_name && (
                      <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{c.account_manager_name}</p>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 900, margin: 0, flexShrink: 0,
                    color: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }}>
                    {c.percent}%
                  </p>
                  <div style={{ width: 44, height: 4, background: "#f1f1f1", borderRadius: 2 }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${c.percent}%`,
                      background: c.percent >= 80 ? "#22c55e" : c.percent >= 40 ? "#f97316" : "#ef4444" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
