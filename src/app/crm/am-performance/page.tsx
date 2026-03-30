import { getAMPerformance } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 8px" }}>
      <p style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", color: color ?? "#0d0d0d" }}>{value}</p>
      <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em",
        color: "var(--crm-muted2)", margin: 0 }}>{label}</p>
      {sub && <p style={{ fontSize: 10, color: "#d1d5db", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

export default async function AMPerformancePage() {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) redirect("/crm");

  const ams = await getAMPerformance();

  const totalRevenue = ams.reduce((s, a) => s + Number(a.revenue), 0);
  const totalCustomers = ams.reduce((s, a) => s + a.customer_count, 0);
  const avgWinRate = ams.length > 0 ? Math.round(ams.reduce((s, a) => s + a.win_rate, 0) / ams.length) : 0;
  const overdueCount = ams.reduce((s, a) => s + a.tasks_overdue, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
          AM Performance
        </h1>
        <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {ams.length} account manager{ams.length !== 1 ? "s" : ""} ·{" "}
          {session.role === "admin" ? "All teams" : "Your team"}
        </p>
      </div>

      {/* Team KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Team Revenue",     value: fmt(totalRevenue),       color: "#f5c700", border: "#f5c700" },
          { label: "Total Customers",  value: totalCustomers,          color: "var(--crm-text)", border: "#0d0d0d" },
          { label: "Avg Win Rate",     value: `${avgWinRate}%`,        color: "#22c55e", border: "#22c55e" },
          { label: "Overdue Tasks",    value: overdueCount,            color: overdueCount > 0 ? "#ef4444" : "#22c55e", border: overdueCount > 0 ? "#ef4444" : "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--crm-surface)", borderRadius: 10, padding: "16px 20px",
            border: "1px solid var(--crm-border)", borderTop: `3px solid ${k.border}` }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: k.color, margin: "0 0 4px" }}>{k.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* AM scorecards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ams.map((am, rank) => {
          const winColor = am.win_rate >= 60 ? "#22c55e" : am.win_rate >= 40 ? "#f97316" : "#ef4444";
          const onbColor = am.onboarding_avg >= 70 ? "#22c55e" : am.onboarding_avg >= 40 ? "#f97316" : "#ef4444";

          return (
            <div key={am.id} style={{ background: "var(--crm-surface)", borderRadius: 10,
              border: "1px solid var(--crm-border)", overflow: "hidden" }}>
              {/* AM header */}
              <div style={{ background: "#0d0d0d", padding: "14px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f5c700",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, color: "#000" }}>
                      {am.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18,
                      background: rank === 0 ? "#f5c700" : rank === 1 ? "#9ca3af" : "#cd7f32",
                      borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 9, fontWeight: 900,
                      color: "#000", border: "1.5px solid #0d0d0d" }}>
                      #{rank + 1}
                    </span>
                  </div>
                  <div>
                    <Link href={`/crm/customers/${am.id}`}
                      style={{ fontWeight: 800, fontSize: 15, color: "#fff", textDecoration: "none" }}>
                      {am.name}
                    </Link>
                    <p style={{ color: "var(--crm-muted)", fontSize: 12, margin: 0 }}>
                      {am.email}
                      {am.manager_name && ` · Manager: ${am.manager_name}`}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {am.tasks_overdue > 0 && (
                    <span style={{ background: "#ef4444", color: "#fff", fontSize: 11,
                      fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>
                      ⚠ {am.tasks_overdue} overdue
                    </span>
                  )}
                  <Link href={`/crm/customers?am=${am.id}`}
                    style={{ background: "#f5c700", color: "#000", fontSize: 12,
                      fontWeight: 800, padding: "5px 14px", borderRadius: 6, textDecoration: "none" }}>
                    View Customers →
                  </Link>
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
                borderBottom: "1px solid var(--crm-border2)", gap: 0 }}>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Customers" value={am.customer_count} />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Companies" value={am.company_count} />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Revenue" value={fmt(Number(am.revenue))} color="#22c55e" />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Orders" value={am.order_count} />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Open Quotes" value={am.open_quotes} color="#3b82f6" />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Pipeline" value={fmt(Number(am.quote_value))} color="#f5c700" />
                </div>
                <div style={{ borderRight: "1px solid var(--crm-border2)" }}>
                  <StatBox label="Win Rate" value={`${am.win_rate}%`} color={winColor} />
                </div>
                <div>
                  <StatBox label="Onboarding" value={`${am.onboarding_avg}%`} color={onbColor} />
                </div>
              </div>

              {/* Progress bars */}
              <div style={{ padding: "12px 20px", display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Revenue vs team avg", value: totalRevenue > 0 ? Math.min(100, Math.round(Number(am.revenue) / (totalRevenue / ams.length) * 50)) : 0, color: "#f5c700" },
                  { label: "Quote win rate",       value: am.win_rate,         color: winColor },
                  { label: "Onboarding completion",value: am.onboarding_avg,   color: onbColor },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--crm-muted2)", fontWeight: 600 }}>{bar.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: bar.color }}>{bar.value}%</span>
                    </div>
                    <div style={{ height: 5, background: "#f1f1f1", borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${bar.value}%`, background: bar.color,
                        borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
