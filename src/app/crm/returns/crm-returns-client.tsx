"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { CRMReturn } from "@/app/actions/crm-returns";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  requested: { label: "Requested", color: "#1e40af", bg: "#dbeafe" },
  approved:  { label: "Approved",  color: "#5b21b6", bg: "#ede9fe" },
  received:  { label: "Received",  color: "#92400e", bg: "#fef3c7" },
  refunded:  { label: "Refunded",  color: "#15803d", bg: "#dcfce7" },
  rejected:  { label: "Rejected",  color: "#991b1b", bg: "#fee2e2" },
};

const STATUSES = ["all", "requested", "approved", "received", "refunded", "rejected"];

export function CRMReturnsClient({ returns, statusCounts, totalRefunded, sessionRole, scope, scopeToggle }: {
  returns: CRMReturn[];
  statusCounts: Record<string, number>;
  totalRefunded: number;
  sessionRole: string;
  scope: "mine" | "all";
  scopeToggle?: React.ReactNode;
}) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [sortField, setSortField] = useState<"created_at" | "refund_amount">("created_at");
  const [sortDir, setSortDir]     = useState<"desc" | "asc">("desc");

  const isAdmin   = sessionRole === "admin";
  const isManager = sessionRole === "manager";

  function toggleSort(field: "created_at" | "refund_amount") {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return returns
      .filter(r => statusFilter === "all" || r.status === statusFilter)
      .filter(r => !q || [
        r.first_name, r.last_name, r.email,
        String(r.id), String(r.order_id),
        r.reason, r.account_manager_name ?? "",
      ].some(v => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = sortField === "refund_amount"
          ? Number(a.refund_amount ?? 0)
          : new Date(a.created_at).getTime();
        const bv = sortField === "refund_amount"
          ? Number(b.refund_amount ?? 0)
          : new Date(b.created_at).getTime();
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [returns, search, statusFilter, sortField, sortDir]);

  const pendingCount = (statusCounts.requested ?? 0) + (statusCounts.approved ?? 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
            Returns
          </h1>
          <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
            {sessionRole === "admin" ? "All platform returns" :
             sessionRole === "manager" ? "Returns from your team's customers" :
             "Returns from your customers"}
          </p>
        </div>
        {scopeToggle}
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Returns",   value: returns.length.toString(),              color: "#f5c700" },
          { label: "Pending Action",  value: pendingCount.toString(),                color: pendingCount > 0 ? "#ef4444" : "#9ca3af" },
          { label: "Refunded",        value: (statusCounts.refunded ?? 0).toString(), color: "#22c55e" },
          { label: "Rejected",        value: (statusCounts.rejected ?? 0).toString(), color: "var(--crm-muted)" },
          { label: "Total Refunded",  value: fmt(totalRefunded),                    color: "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--crm-surface)", borderRadius: 10,
            padding: "14px 16px", border: "1px solid var(--crm-border)",
            borderTop: `3px solid ${k.color}` }}>
            <p style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", color: "var(--crm-text)" }}>{k.value}</p>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "var(--crm-muted2)", fontSize: 13 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, email, return #, or order #…"
            style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 6,
              border: "1px solid var(--crm-border)", fontSize: 13, outline: "none",
              background: "var(--crm-surface2)", boxSizing: "border-box" as const }} />
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATUSES.map(s => {
            const active = statusFilter === s;
            const meta   = STATUS_META[s];
            const count  = s === "all" ? returns.length : (statusCounts[s] ?? 0);
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
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
        <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--crm-border2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--crm-surface2)" }}>
          <span style={{ fontSize: 12, color: "var(--crm-muted)", fontWeight: 600 }}>
            {filtered.length} return{filtered.length !== 1 ? "s" : ""}
            {(search || statusFilter !== "all") ? ` (filtered from ${returns.length})` : ""}
          </span>
          {pendingCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4444",
              background: "#fee2e2", padding: "2px 10px", borderRadius: 10 }}>
              ⚠ {pendingCount} need{pendingCount === 1 ? "s" : ""} action
            </span>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#0d0d0d" }}>
                {[
                  { label: "Return #",  field: null },
                  { label: "Order #",   field: null },
                  { label: "Customer",  field: null },
                  ...(isAdmin || isManager ? [{ label: "Account Manager", field: null }] : []),
                  { label: "Reason",    field: null },
                  { label: "Items",     field: null },
                  { label: "Status",    field: null },
                  { label: "Date",      field: "created_at" as const },
                  { label: "Refund",    field: "refund_amount" as const },
                  { label: "",          field: null },
                ].map(h => (
                  <th key={h.label}
                    onClick={h.field ? () => toggleSort(h.field!) : undefined}
                    style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                      fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                      color: h.field ? "#f5c700" : "#6b6b6b",
                      cursor: h.field ? "pointer" : "default",
                      userSelect: "none" as const, whiteSpace: "nowrap" as const }}>
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
                <tr><td colSpan={10} style={{ padding: "48px 24px",
                  textAlign: "center", color: "var(--crm-muted2)" }}>No returns found</td></tr>
              ) : filtered.map((r, i) => {
                const meta = STATUS_META[r.status] ?? { label: r.status, color: "var(--crm-muted)", bg: "#f1f1f1" };
                const needsAction = ["requested", "approved"].includes(r.status);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--crm-border2)",
                    background: needsAction
                      ? "#fffbeb"
                      : i % 2 === 0 ? "var(--crm-surface)" : "var(--crm-surface2)" }}>

                    {/* Return # */}
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--crm-text)" }}>
                      #{r.id}
                    </td>

                    {/* Order # */}
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={isAdmin ? `/admin/orders/${r.order_id}` : `/account/orders/${r.order_id}`}
                        style={{ fontWeight: 700, color: "#3b82f6", textDecoration: "none" }}>
                        #{r.order_id}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: "12px 16px" }}>
                      {r.customer_id ? (
                        <Link href={`/crm/customers/${r.customer_id}`}
                          style={{ fontWeight: 700, color: "var(--crm-text)", textDecoration: "none",
                            display: "block" }}>
                          {r.first_name} {r.last_name}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 700, color: "var(--crm-text)" }}>
                          {r.first_name} {r.last_name}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: "var(--crm-muted2)" }}>{r.email}</span>
                    </td>

                    {/* AM column */}
                    {(isAdmin || isManager) && (
                      <td style={{ padding: "12px 16px" }}>
                        {r.account_manager_name ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text)",
                            background: "#fef9c3", padding: "2px 8px", borderRadius: 4 }}>
                            {r.account_manager_name}
                          </span>
                        ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>}
                      </td>
                    )}

                    {/* Reason */}
                    <td style={{ padding: "12px 16px", color: "var(--crm-muted)", maxWidth: 200 }}>
                      <span style={{ display: "block", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                        {r.reason}
                      </span>
                    </td>

                    {/* Items */}
                    <td style={{ padding: "12px 16px", color: "var(--crm-muted)", fontWeight: 600 }}>
                      {r.item_count}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11,
                        fontWeight: 800, background: meta.bg, color: meta.color,
                        display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {needsAction && <span style={{ width: 6, height: 6, borderRadius: "50%",
                          background: meta.color, display: "inline-block" }} />}
                        {meta.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 16px", color: "var(--crm-muted)",
                      whiteSpace: "nowrap" as const }}>
                      {new Date(r.created_at).toLocaleDateString("en-US",
                        { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Refund amount */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" as const }}>
                      {r.refund_amount
                        ? <span style={{ fontWeight: 800, color: "#22c55e" }}>{fmt(Number(r.refund_amount))}</span>
                        : <span style={{ color: "#d1d5db" }}>—</span>}
                    </td>

                    {/* Link — all roles use CRM return detail */}
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/crm/returns/${r.id}`}
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
