'use client';

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type {
  DailyRevenue, MonthlyRevenue, TopProduct, CategoryRevenue,
  OrderBucket, CustomerGrowth, KpiTrend,
} from "@/app/actions/analytics";
import Link from "next/link";

const fmt  = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

const ACCENT  = "#e8561c";
const NAVY    = "#002244";
const COLORS  = ["#e8561c","#3b82f6","#10b981","#8b5cf6","#f59e0b","#ec4899","#06b6d4"];
const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981", processing: "#3b82f6", shipped: "#8b5cf6",
  pending: "#f59e0b",   cancelled: "#ef4444",
};

// ── Shared tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", fontSize: 13 }}>
      {label && <p style={{ fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ margin: "3px 0", color: p.color }}>
          <span style={{ fontWeight: 600 }}>{p.name}: </span>
          {typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, trend, icon }: {
  label: string; value: string; sub: string;
  color: string; trend?: number; icon: string;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderTop: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", margin: 0 }}>{label}</p>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "#0f172a", lineHeight: 1 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {trend !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "1px 8px", borderRadius: 9999, background: up ? "#dcfce7" : "#fee2e2", color: up ? "#15803d" : "#dc2626" }}>
            {up ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Card({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "22px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#0f172a" }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: "#94a3b8", margin: "3px 0 0" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export function DashboardCharts({
  kpi, daily30, monthly12, topProducts, byCat,
  buckets, custGrowth, statusRows, viewedProducts, recentOrders, lowStock,
}: {
  kpi: KpiTrend;
  daily30: DailyRevenue[];
  monthly12: MonthlyRevenue[];
  topProducts: TopProduct[];
  byCat: CategoryRevenue[];
  buckets: OrderBucket[];
  custGrowth: CustomerGrowth[];
  statusRows: { status: string; count: number }[];
  viewedProducts: { name: string; views: number }[];
  recentOrders: { id: number; status: string; total: number; created_at: string; first_name: string; last_name: string }[];
  lowStock: { id: string; name: string; inventory: number; category: string }[];
}) {
  const [revenueRange, setRevenueRange] = useState<"30d" | "12m">("30d");
  const revenueData = revenueRange === "30d" ? daily30 : monthly12;
  const revenueKey  = revenueRange === "30d" ? "day" : "month";

  const revTrend  = kpi.rev_prev  > 0 ? ((kpi.rev_cur  - kpi.rev_prev)  / kpi.rev_prev  * 100) : 0;
  const ordTrend  = kpi.ord_prev  > 0 ? ((kpi.ord_cur  - kpi.ord_prev)  / kpi.ord_prev  * 100) : 0;
  const aovTrend  = kpi.ord_prev  > 0 ? (((kpi.rev_cur / (kpi.ord_cur || 1)) - (kpi.rev_prev / (kpi.ord_prev || 1))) / (kpi.rev_prev / (kpi.ord_prev || 1)) * 100) : 0;
  const totalOrders = statusRows.reduce((s, r) => s + r.count, 0);

  const STATUS_LABELS: Record<string, string> = { completed: "Completed", processing: "Processing", shipped: "Shipped", pending: "Pending", cancelled: "Cancelled" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <KpiCard label="Revenue (MTD)"    value={fmt(kpi.rev_cur)}  sub="vs last month"                    color="#10b981" trend={revTrend}  icon="💰" />
        <KpiCard label="Orders (MTD)"     value={String(kpi.ord_cur)} sub="vs last month"                  color="#3b82f6" trend={ordTrend}  icon="📦" />
        <KpiCard label="Avg Order Value"  value={fmt(kpi.rev_cur / (kpi.ord_cur || 1))} sub="vs last month" color="#8b5cf6" trend={aovTrend} icon="🎯" />
        <KpiCard label="Customers"        value={String(kpi.cust_total)} sub={`+${kpi.cust_new} last 30 days`} color={ACCENT} icon="👥" />
      </div>

      {/* ── Secondary KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Product Views",     value: kpi.views_30.toLocaleString(),   sub: "last 30 days",      color: "#06b6d4", icon: "👁️"  },
          { label: "Open Quotes",       value: String(kpi.open_quotes),          sub: "pending action",    color: "#f59e0b", icon: "📋"  },
          { label: "New Applications",  value: String(kpi.pending_apps),         sub: "awaiting review",   color: "#ec4899", icon: "💼"  },
          { label: "Promo Savings Given", value: fmt(kpi.promo_savings),          sub: "all time",          color: "#84cc16", icon: "🎟️" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14, borderLeft: `3px solid ${s.color}` }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0f172a" }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
              <p style={{ fontSize: 11, color: "#cbd5e1", margin: 0 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart ── */}
      <Card
        title="Revenue Over Time"
        subtitle={revenueRange === "30d" ? "Daily — last 30 days" : "Monthly — last 12 months"}
        action={
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
            {(["30d","12m"] as const).map(r => (
              <button key={r} onClick={() => setRevenueRange(r)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: revenueRange === r ? "white" : "transparent", color: revenueRange === r ? "#0f172a" : "#94a3b8", boxShadow: revenueRange === r ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {r === "30d" ? "30 Days" : "12 Months"}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ACCENT} stopOpacity={0.2} />
                <stop offset="95%" stopColor={ACCENT} stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey={revenueKey} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
            <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={ACCENT} strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5 }} />
            <Area yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke="#3b82f6" strokeWidth={2} fill="url(#ordGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Row: Order status donut + Top products bar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>

        <Card title="Order Status" subtitle="All time breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusRows} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {statusRows.map((row, i) => (
                  <Cell key={row.status} fill={STATUS_COLORS[row.status] ?? COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, STATUS_LABELS[String(n)] ?? n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {statusRows.map((row, i) => (
              <div key={row.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[row.status] ?? COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{row.status}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{row.count}</span>
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>{totalOrders > 0 ? ((row.count / totalOrders) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Products by Revenue" subtitle="All time, non-cancelled orders">
          {topProducts.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No product data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts.map(p => ({ ...p, name: p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={160} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill={ACCENT} radius={[0, 4, 4, 0]}>
                  {topProducts.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT : `${ACCENT}${Math.round(220 - i * 20).toString(16)}`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Row: Category revenue + Customer growth ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>

        <Card title="Revenue by Category" subtitle="All time breakdown">
          {byCat.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCat} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="New Customers" subtitle="Last 6 months">
          {custGrowth.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={custGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="New Customers" fill={NAVY} radius={[4, 4, 0, 0]}>
                  {custGrowth.map((_, i) => <Cell key={i} fill={i === custGrowth.length - 1 ? ACCENT : NAVY} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Row: Order size distribution + Most viewed ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <Card title="Order Size Distribution" subtitle="Number of orders by value range">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buckets} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                {buckets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Most Viewed Products" subtitle="Last 30 days">
          {viewedProducts.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No view data yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {viewedProducts.map((p, i) => {
                const maxViews = viewedProducts[0]?.views ?? 1;
                const pct = (p.views / maxViews) * 100;
                return (
                  <div key={p.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>{p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>{p.views} views</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Row: Recent orders + Low stock ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

        <Card title="Recent Orders" action={<Link href="/admin/orders" style={{ fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 700 }}>View all →</Link>}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Order", "Customer", "Date", "Total", "Status"].map(h => (
                  <th key={h} style={{ padding: "0 0 10px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => {
                const sc = STATUS_COLORS[o.status] ?? "#94a3b8";
                return (
                  <tr key={o.id} style={{ borderTop: "1px solid #f8fafc" }}>
                    <td style={{ padding: "10px 0", fontWeight: 700 }}>
                      <Link href={`/admin/orders/${o.id}`} style={{ color: ACCENT, textDecoration: "none" }}>#{o.id}</Link>
                    </td>
                    <td style={{ padding: "10px 8px 10px 0", color: "#475569" }}>{o.first_name ? `${o.first_name} ${o.last_name}` : "Guest"}</td>
                    <td style={{ padding: "10px 8px 10px 0", color: "#94a3b8", fontSize: 11 }}>
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "10px 8px 10px 0", fontWeight: 700 }}>{fmt(Number(o.total))}</td>
                    <td style={{ padding: "10px 0" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${sc}22`, color: sc }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card title="⚠️ Low Stock" action={<Link href="/admin/products" style={{ fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 700 }}>View all →</Link>}>
          {lowStock.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "32px 0" }}>All products well stocked ✓</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lowStock.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 0" }}>{p.category}</p>
                  </div>
                  <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, flexShrink: 0, background: p.inventory <= 5 ? "#fee2e2" : "#fef9c3", color: p.inventory <= 5 ? "#991b1b" : "#854d0e" }}>
                    {p.inventory} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
