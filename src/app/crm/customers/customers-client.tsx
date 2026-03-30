"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import type { CustomerWithHealth, CRMStaff } from "@/app/actions/crm";
import { updateUserRole } from "@/app/actions/crm";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  admin:           { label: "Admin",   bg: "#fff7ed", color: "#f97316" },
  manager:         { label: "Manager", bg: "#f0fdf4", color: "#15803d" },
  account_manager: { label: "Account Manager", bg: "#fef3c7", color: "#92400e" },
};

type Tab = "customers" | "staff";

export function CustomersClient({ customers, staff, sessionRole, scope, scopeToggle }: {
  customers: CustomerWithHealth[];
  staff: CRMStaff[];
  sessionRole?: string;
  scope?: "mine" | "all";
  scopeToggle?: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("customers");
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter(c =>
    !search || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredStaff = staff.filter(s =>
    !search || `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
            {tab === "customers" ? "Customers" : "Staff"}
          </h1>
          <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
            {tab === "customers"
              ? `${customers.length} registered customers`
              : `${staff.length} staff members`}
          </p>
        </div>
        {tab === "customers" && scopeToggle}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--crm-border)", marginBottom: 16 }}>
        {([
          { key: "customers" as Tab, label: "Customers", count: customers.length },
          { key: "staff"     as Tab, label: "Staff",     count: staff.length },
        ]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); }} style={{
            padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            background: "none", border: "none",
            borderBottom: tab === t.key ? "2px solid #f5c700" : "2px solid transparent",
            color: tab === t.key ? "#0d0d0d" : "#9ca3af",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {t.label}
            <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
              background: tab === t.key ? "#f5c700" : "#f1f1f1",
              color: tab === t.key ? "#000" : "#9ca3af" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--crm-muted2)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "customers" ? "Search by name or email..." : "Search staff..."}
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 6, fontSize: 14,
              border: "1px solid var(--crm-border)", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--crm-muted2)", fontWeight: 600, whiteSpace: "nowrap" }}>
          {tab === "customers" ? filteredCustomers.length : filteredStaff.length} result{(tab === "customers" ? filteredCustomers.length : filteredStaff.length) !== 1 ? "s" : ""}
        </span>
      </div>

      {tab === "customers" ? (
        <CustomersTable customers={filteredCustomers} />
      ) : (
        <StaffTable staff={filteredStaff} />
      )}
    </div>
  );
}

function CustomersTable({ customers }: { customers: CustomerWithHealth[] }) {
  return (
    <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0d0d0d" }}>
            {["Customer", "Health", "Account Manager", "Orders", "Total Spent", "Open Quotes", "Last Activity", ""].map(h => (
              <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f5c700" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr><td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "var(--crm-muted2)" }}>
              No customers found
            </td></tr>
          ) : customers.map((c, i) => (
            <tr key={c.id} style={{ borderBottom: "1px solid var(--crm-border2)",
              background: i % 2 === 0 ? "var(--crm-surface)" : "var(--crm-surface2)" }}>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5c700",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <Link href={`/crm/customers/${c.id}`} style={{ fontWeight: 700, color: "var(--crm-text)",
                    textDecoration: "none", fontSize: 13 }}>
                    {c.first_name} {c.last_name}
                    {c.note_count > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--crm-muted2)" }}>📝 {c.note_count}</span>}
                  </Link>
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                  background: c.bg, color: c.color,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: c.color, flexShrink: 0 }} />
                  {c.label} · {c.score}
                </span>
              </td>
              <td style={{ padding: "12px 16px" }}>
                {c.account_manager_name ? (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text)",
                    background: "#fef9c3", padding: "2px 8px", borderRadius: 4 }}>
                    {c.account_manager_name}
                  </span>
                ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>Unassigned</span>}
              </td>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--crm-text)" }}>{c.order_count}</td>
              <td style={{ padding: "12px 16px", fontWeight: 700, color: "#22c55e" }}>{fmt(Number(c.total_spent))}</td>
              <td style={{ padding: "12px 16px" }}>
                {c.open_quotes > 0 ? (
                  <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11,
                    fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{c.open_quotes} open</span>
                ) : <span style={{ color: "#d1d5db" }}>—</span>}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--crm-muted2)", fontSize: 12 }}>
                {timeAgo(c.last_activity_at ?? c.last_order_at)}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Link href={`/crm/customers/${c.id}`} style={{ fontSize: 12, color: "#f5c700",
                  fontWeight: 700, textDecoration: "none" }}>View →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StaffRow({ member }: { member: CRMStaff }) {
  const [role, setRole] = useState(member.role);
  const [changing, setChanging] = useState(false);
  const [, startT] = useTransition();
  const meta = ROLE_META[role] ?? ROLE_META.account_manager;

  function changeRole(newRole: string) {
    startT(async () => {
      await updateUserRole(member.id, newRole);
      setRole(newRole);
      setChanging(false);
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--crm-border2)" }}>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            background: role === "admin" ? "#f97316" : "#f5c700",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0 }}>
            {member.first_name[0]}{member.last_name[0]}
          </div>
          <Link href={`/crm/customers/${member.id}`} style={{ fontWeight: 700, color: "var(--crm-text)",
            textDecoration: "none", fontSize: 13 }}>
            {member.first_name} {member.last_name}
          </Link>
        </div>
      </td>
      <td style={{ padding: "12px 16px", color: "var(--crm-muted)" }}>{member.email}</td>
      <td style={{ padding: "12px 16px" }}>
        {changing ? (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["admin", "manager", "account_manager", "customer"].map(r => (
              <button key={r} onClick={() => changeRole(r)} style={{
                padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${r === role ? "#f5c700" : "#e5e5e5"}`,
                background: r === role ? "#fffbeb" : "#fff",
                color: r === role ? "#92400e" : "#6b7280",
              }}>{r.replace("_", " ")}</button>
            ))}
            <button onClick={() => setChanging(false)} style={{ fontSize: 11, color: "var(--crm-muted2)",
              background: "none", border: "none", cursor: "pointer" }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setChanging(true)} title="Click to change role"
            style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
              background: meta.bg, color: meta.color, border: "none", cursor: "pointer",
              textTransform: "capitalize" as const }}>
            {meta.label}
          </button>
        )}
      </td>
      <td style={{ padding: "12px 16px" }}>
        {member.assigned_customers > 0 ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text2)" }}>
            👥 {member.assigned_customers} customers
          </span>
        ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>None</span>}
      </td>
      <td style={{ padding: "12px 16px" }}>
        {member.assigned_companies > 0 ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--crm-text2)" }}>
            🏢 {member.assigned_companies} companies
          </span>
        ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>None</span>}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: 12, color: "var(--crm-muted2)" }}>
          {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </td>
    </tr>
  );
}

function StaffTable({ staff }: { staff: CRMStaff[] }) {
  return (
    <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0d0d0d" }}>
            {["Name", "Email", "Role", "Customers", "Companies", "Joined"].map(h => (
              <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f5c700" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "var(--crm-muted2)" }}>
              No staff found
            </td></tr>
          ) : staff.map(s => <StaffRow key={s.id} member={s} />)}
        </tbody>
      </table>
    </div>
  );
}
