"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CRMOrder } from "@/app/actions/crm-orders";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: "#92400e", bg: "#fef3c7" },
  processing: { label: "Processing", color: "#1e40af", bg: "#dbeafe" },
  shipped:    { label: "Shipped",    color: "#5b21b6", bg: "#ede9fe" },
  completed:  { label: "Completed",  color: "#15803d", bg: "#dcfce7" },
  cancelled:  { label: "Cancelled",  color: "#991b1b", bg: "#fee2e2" },
};

const STATUSES = ["all", "pending", "processing", "shipped", "completed", "cancelled"];

export function CRMOrdersClient({ orders, totalRevenue, statusCounts, sessionRole }: {
  orders: CRMOrder[];
  totalRevenue: number;
  statusCounts: Record<string, number>;
  sessionRole: string;
}) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [sortField, setSortField] = useState<"created_at" | "total">("created_at");
  const [sortDir, setSortDir]     = useState<"desc" | "asc">("desc");

  function toggleSort(field: "created_at" | "total") {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter(o => statusFilter === "all" || o.status === statusFilter)
      .filter(o => !q || [
        o.first_name, o.last_name, o.email,
        String(o.id), o.account_manager_name ?? "",
      ].some(v => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = sortField === "total" ? Number(a.total) : new Date(a.created_at).getTime();
        const bv = sortField === "total" ? Number(b.total) : new Date(b.created_at).getTime();
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [orders, search, statusFilter, sortField, sortDir]);

  const filteredRevenue = filtered.reduce((s, o) => s + Number(o.total), 0);
  const isAdmin = sessionRole === "admin";
  const isManager = sessionRole === "manager";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          Orders
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          {sessionRole === "admin" ? "All platform orders" :
           sessionRole === "manager" ? "Orders from your team's customers" :
           "Orders from your customers"}
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Orders",  value: orders.length.toLocaleString(),       color: "#f5c700" },
          { label: "Total Revenue", value: fmt(totalRevenue),                    color: "#22c55e" },
          { label: "Completed",     value: (statusCounts.completed ?? 0).toString(), color: "#22c55e" },
          { label: "In Progress",   value: ((statusCounts.processing ?? 0) + (statusCounts.shipped ?? 0)).toString(), color: "#3b82f6" },
          { label: "Pending",       value: (statusCounts.pending ?? 0).toString(), color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 10,
            padding: "14px 16px", border: "1px solid #e5e5e5",
            borderTop: `3px solid ${k.color}` }}>
            <p style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", color: "#0d0d0d" }}>{k.value}</p>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "#9ca3af", fontSize: 13 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, email, or order #…"
            style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 6,
              border: "1px solid #e5e5e5", fontSize: 13, outline: "none",
              background: "#fafafa", boxSizing: "border-box" as const }} />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATUSES.map(s => {
            const active = statusFilter === s;
            const meta = STATUS_META[s];
            const count = s === "all" ? orders.length : (statusCounts[s] ?? 0);
            return (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                cursor: "pointer", border: "2px solid",
                borderColor: active ? (meta?.color ?? "#0d0d0d") : "#e5e5e5",
                background: active ? (meta?.bg ?? "#0d0d0d") : "#fff",
                color: active ? (meta?.color ?? "#f5c700") : "#6b7280",
              }}>
                {s === "all" ? "All" : STATUS_META[s].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
        {/* Results bar */}
        <div style={{ padding: "10px 18px", borderBottom: "1px solid #f1f1f1",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fafafa" }}>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            {search || statusFilter !== "all" ? ` (filtered from ${orders.length})` : ""}
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>
            {fmt(filteredRevenue)} total
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d0d0d" }}>
                {[
                  { label: "Order",        field: null },
                  { label: "Customer",     field: null },
                  ...(isAdmin || isManager ? [{ label: "Account Manager", field: null }] : []),
                  { label: "Status",       field: null },
                  { label: "Items",        field: null },
                  { label: "Date",         field: "created_at" as const },
                  { label: "Total",        field: "total" as const },
                  { label: "",             field: null },
                ].map(h => (
                  <th key={h.label} onClick={h.field ? () => toggleSort(h.field!) : undefined}
                    style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                      fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                      color: h.field ? "#f5c700" : "#6b6b6b",
                      cursor: h.field ? "pointer" : "default",
                      userSelect: "none" as const,
                      whiteSpace: "nowrap" as const }}>
                    {h.label}
                    {h.field && sortField === h.field && (
                      <span style={{ marginLeft: 4 }}>{sortDir === "desc" ? "↓" : "↑"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
                  No orders found
                </td></tr>
              ) : filtered.map((o, i) => {
                const meta = STATUS_META[o.status] ?? { label: o.status, color: "#6b7280", bg: "#f1f1f1" };
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5",
                    background: i % 2 === 0 ? "#fff" : "#fafafa" }}>

                    {/* Order # */}
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d0d0d" }}>
                      #{o.id}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/crm/customers/${o.customer_id}`}
                        style={{ fontWeight: 700, color: "#0d0d0d", textDecoration: "none",
                          display: "block" }}>
                        {o.first_name} {o.last_name}
                      </Link>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{o.email}</span>
                    </td>

                    {/* AM column — admin/manager only */}
                    {(isAdmin || isManager) && (
                      <td style={{ padding: "12px 16px" }}>
                        {o.account_manager_name ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#0d0d0d",
                            background: "#fef9c3", padding: "2px 8px", borderRadius: 4 }}>
                            {o.account_manager_name}
                          </span>
                        ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>Unassigned</span>}
                      </td>
                    )}

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                        fontWeight: 800, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Items */}
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>
                      {o.item_count}
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap" as const }}>
                      {new Date(o.created_at).toLocaleDateString("en-US",
                        { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Total */}
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "#22c55e",
                      whiteSpace: "nowrap" as const }}>
                      {fmt(Number(o.total))}
                      {Number(o.discount_amount) > 0 && (
                        <span style={{ display: "block", fontSize: 10, color: "#f59e0b",
                          fontWeight: 600 }}>
                          -{fmt(Number(o.discount_amount))} promo
                        </span>
                      )}
                    </td>

                    {/* View link — admin sees admin detail, others see account detail */}
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={isAdmin ? `/admin/orders/${o.id}` : `/account/orders/${o.id}`}
                        style={{ fontSize: 12, color: "#f5c700", fontWeight: 700,
                          textDecoration: "none", whiteSpace: "nowrap" as const }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
