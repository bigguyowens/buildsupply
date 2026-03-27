"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateUserRole } from "@/app/actions/crm";

type User = {
  id: number; first_name: string; last_name: string; email: string;
  role: string; created_at: string; order_count: number; total_spent: number;
  geo_city: string | null; geo_region_code: string | null;
  company_name: string | null; assigned_customers: number;
};

type Tab = "all" | "customer" | "account_manager" | "company_admin" | "admin";

const ROLE_META: Record<string, { label: string; bg: string; color: string; avatarBg: string }> = {
  admin:           { label: "Admin",           bg: "#fff7ed",  color: "#f97316",  avatarBg: "#f97316" },
  account_manager: { label: "Account Manager", bg: "#fef3c7",  color: "#92400e",  avatarBg: "#f5c700" },
  company_admin:   { label: "Company Admin",   bg: "#ede9fe",  color: "#5b21b6",  avatarBg: "#8b5cf6" },
  customer:        { label: "Customer",        bg: "#f1f5f9",  color: "#475569",  avatarBg: "#3b82f6" },
};

const ROLES_FOR_CHANGE: Record<string, string[]> = {
  admin:    ["admin", "account_manager", "customer"],
  account_manager: ["admin", "account_manager", "company_admin", "customer"],
  company_admin:   ["company_admin", "customer"],
  customer: ["account_manager", "company_admin", "customer"],
};

export function AdminCustomersClient({ users }: { users: User[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all",             label: "All",              count: users.length },
    { key: "customer",        label: "Customers",        count: users.filter(u => u.role === "customer").length },
    { key: "company_admin",   label: "Company Admins",   count: users.filter(u => u.role === "company_admin").length },
    { key: "account_manager", label: "Account Managers", count: users.filter(u => u.role === "account_manager").length },
    { key: "admin",           label: "Admins",           count: users.filter(u => u.role === "admin").length },
  ];

  const filtered = users.filter(u => {
    const matchTab = tab === "all" || u.role === tab;
    const matchSearch = !search ||
      `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--ad-border)",
        marginBottom: 16, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            background: "none", border: "none", whiteSpace: "nowrap",
            borderBottom: tab === t.key ? "2px solid #f97316" : "2px solid transparent",
            color: tab === t.key ? "#f97316" : "var(--ad-muted)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
              background: tab === t.key ? "#fff7ed" : "var(--ad-surface2)",
              color: tab === t.key ? "#f97316" : "var(--ad-muted2)" }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          color: "var(--ad-muted2)", fontSize: 14 }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 6, fontSize: 13,
            border: "1px solid var(--ad-border)", background: "var(--ad-surface)",
            color: "var(--ad-text)", outline: "none", boxSizing: "border-box" as const }} />
      </div>

      {/* Table */}
      <div style={{ background: "var(--ad-surface)", borderRadius: 10,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--ad-surface2)" }}>
              {["User", "Email", "Role", "Company / Customers", "Orders", "Spent", "Joined", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11,
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: "var(--ad-muted2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "40px 24px", textAlign: "center",
                color: "var(--ad-muted)" }}>No users found</td></tr>
            ) : filtered.map(u => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const [role, setRole] = useState(user.role);
  const [changing, setChanging] = useState(false);
  const [, startT] = useTransition();
  const meta = ROLE_META[role] ?? ROLE_META.customer;
  const roleOptions = ROLES_FOR_CHANGE[role] ?? ["customer"];

  function changeRole(newRole: string) {
    startT(async () => {
      await updateUserRole(user.id, newRole);
      setRole(newRole);
      setChanging(false);
    });
  }

  return (
    <tr style={{ borderTop: "1px solid var(--ad-border2)" }}>
      {/* User */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: meta.avatarBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <span style={{ fontWeight: 600, color: "var(--ad-text)" }}>
            {user.first_name} {user.last_name}
          </span>
        </div>
      </td>

      {/* Email */}
      <td style={{ padding: "12px 16px", color: "var(--ad-muted)" }}>{user.email}</td>

      {/* Role — click to change */}
      <td style={{ padding: "12px 16px" }}>
        {changing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {roleOptions.map(r => (
              <button key={r} onClick={() => changeRole(r)} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                cursor: "pointer", border: `1px solid ${r === role ? "#f97316" : "var(--ad-border)"}`,
                background: r === role ? "#fff7ed" : "var(--ad-surface)",
                color: r === role ? "#f97316" : "var(--ad-text2)", textTransform: "capitalize",
              }}>{r.replace("_", " ")}</button>
            ))}
            <button onClick={() => setChanging(false)} style={{ fontSize: 11, color: "var(--ad-muted)",
              background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setChanging(true)} title="Click to change role"
            style={{ padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", background: meta.bg, color: meta.color,
              border: "none", cursor: "pointer" }}>
            {meta.label}
          </button>
        )}
      </td>

      {/* Company / Assigned customers */}
      <td style={{ padding: "12px 16px" }}>
        {user.company_name ? (
          <span style={{ fontSize: 12, color: "var(--ad-text2)", fontWeight: 600 }}>
            🏢 {user.company_name}
          </span>
        ) : user.assigned_customers > 0 ? (
          <span style={{ fontSize: 12, color: "var(--ad-text2)", fontWeight: 600 }}>
            👥 {user.assigned_customers} customers
          </span>
        ) : (
          <span style={{ color: "var(--ad-muted2)", fontSize: 12 }}>—</span>
        )}
      </td>

      {/* Orders */}
      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{user.order_count}</td>

      {/* Spent */}
      <td style={{ padding: "12px 16px", fontWeight: 700,
        color: user.total_spent > 0 ? "var(--ad-text)" : "var(--ad-muted2)" }}>
        ${Number(user.total_spent).toFixed(2)}
      </td>

      {/* Joined */}
      <td style={{ padding: "12px 16px", color: "var(--ad-muted2)" }}>
        {new Date(user.created_at).toLocaleDateString("en-US",
          { month: "short", day: "numeric", year: "numeric" })}
      </td>

      {/* Actions */}
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/admin/customers/${user.id}`}
            style={{ color: "#f97316", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
            View →
          </Link>
          {["account_manager", "admin"].includes(user.role) && (
            <Link href={`/crm/customers/${user.id}`}
              style={{ color: "#6366f1", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
              CRM →
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}
