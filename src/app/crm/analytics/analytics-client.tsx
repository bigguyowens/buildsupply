"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

const fmt    = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtFull= (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const COLORS  = ["#f5c700", "#0d0d0d", "#22c55e", "#3b82f6", "#f97316", "#8b5cf6"];
const PIPE_COLORS: Record<string, string> = {
  sent:     "#3b82f6",
  accepted: "#22c55e",
  declined: "#ef4444",
  expired:  "#f59e0b",
};

type AnalyticsData = {
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  revenueByAM:    { am_name: string; revenue: number; orders: number; customers: number }[];
  quotePipeline:  { status: string; count: number; value: number }[];
  topCustomers:   { name: string; email: string; revenue: number; orders: number }[];
  winRate:        { total: number; accepted: number; declined: number; pending: number };
};

export function AnalyticsClient({ data, sessionRole }: { data: AnalyticsData; sessionRole: string }) {
  const { monthlyRevenue, revenueByAM, quotePipeline, topCustomers, winRate } = data;

  const totalRevenue  = monthlyRevenue.reduce((s, m) => s + Number(m.revenue), 0);
  const totalOrders   = monthlyRevenue.reduce((s, m) => s + m.orders, 0);
  const acceptedValue = quotePipeline.find(p => p.status === "accepted");
  const sentValue     = quotePipeline.find(p => p.status === "sent");
  const winRatePct    = winRate.total > 0
    ? Math.round((winRate.accepted / (winRate.accepted + winRate.declined)) * 100) : 0;

  const showAMs = ["admin", "manager"].includes(sessionRole);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          Revenue Analytics
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Last 12 months · {totalOrders} orders · {fmt(totalRevenue)} total revenue
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "12-Month Revenue", value: fmt(totalRevenue),                      color: "#f5c700", border: "#f5c700" },
          { label: "Total Orders",     value: totalOrders.toLocaleString(),            color: "#0d0d0d", border: "#0d0d0d" },
          { label: "Pipeline (Open)",  value: fmt(Number(sentValue?.value ?? 0)),      color: "#3b82f6", border: "#3b82f6" },
          { label: "Quote Win Rate",   value: `${winRatePct}%`,                        color: "#22c55e", border: "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px",
            border: "1px solid #e5e5e5", borderTop: `3px solid ${k.border}` }}>
            <p style={{ fontSize: 24, fontWeight: 900, color: k.color, margin: "0 0 4px" }}>{k.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
        padding: "20px 24px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 20px" }}>Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyRevenue.map(m => ({ ...m, revenue: Number(m.revenue) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip formatter={(v: any) => fmt(Number(v))}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#f5c700" strokeWidth={3}
              dot={{ fill: "#f5c700", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two-col: AM Revenue + Quote Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: showAMs ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 20 }}>

        {showAMs && (
          <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", padding: "20px 24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 20px" }}>Revenue by Account Manager</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByAM.map(r => ({ ...r, revenue: Number(r.revenue) }))}
                layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis type="category" dataKey="am_name" width={90}
                  tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                <Tooltip formatter={(v: any) => fmt(Number(v))}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {revenueByAM.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#f5c700" : i === 1 ? "#0d0d0d" : "#e5e5e5"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quote pipeline */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", padding: "20px 24px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#0d0d0d", margin: "0 0 20px" }}>Quote Pipeline</h2>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={quotePipeline.map(p => ({ name: p.status, value: Number(p.value) }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                  {quotePipeline.map((p, i) => (
                    <Cell key={i} fill={PIPE_COLORS[p.status] ?? "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(Number(v))}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {quotePipeline.map(p => (
                <div key={p.status} style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "8px 0",
                  borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2,
                      background: PIPE_COLORS[p.status] ?? "#9ca3af" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151",
                      textTransform: "capitalize" }}>{p.status}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#0d0d0d", margin: 0 }}>
                      {fmt(Number(p.value))}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{p.count} quotes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fffbeb",
            border: "1px solid #fde68a", borderRadius: 8,
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
              Win Rate ({winRate.accepted}W / {winRate.declined}L)
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#f5c700" }}>{winRatePct}%</span>
          </div>
        </div>
      </div>

      {/* Top customers */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "#0d0d0d" }}>
          <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#f5c700", margin: 0 }}>Top Customers by Revenue</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              {["#", "Customer", "Orders", "Revenue", "Avg. Order"].map(h => (
                <th key={h} style={{ padding: "9px 16px", textAlign: "left", fontSize: 10,
                  fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "#9ca3af" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.email} style={{ borderTop: "1px solid #f5f5f5" }}>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ fontSize: 12, fontWeight: 800,
                    color: i === 0 ? "#f5c700" : i === 1 ? "#9ca3af" : "#d1d5db" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                  </span>
                </td>
                <td style={{ padding: "10px 16px" }}>
                  <p style={{ fontWeight: 700, margin: 0, color: "#0d0d0d" }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{c.email}</p>
                </td>
                <td style={{ padding: "10px 16px", color: "#6b7280", fontWeight: 600 }}>{c.orders}</td>
                <td style={{ padding: "10px 16px", fontWeight: 800, color: "#22c55e" }}>
                  {fmt(Number(c.revenue))}
                </td>
                <td style={{ padding: "10px 16px", color: "#6b7280" }}>
                  {c.orders > 0 ? fmt(Number(c.revenue) / c.orders) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
