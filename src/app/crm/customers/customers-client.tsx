"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { CRMCustomer } from "@/app/actions/crm";

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

export function CustomersClient({ customers }: { customers: CRMCustomer[] }) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(c =>
    !search || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>Customers</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>{customers.length} registered customers</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
        padding: "14px 18px", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "#9ca3af", fontSize: 14 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 6, fontSize: 14,
              border: "1px solid #e5e5e5", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, whiteSpace: "nowrap" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0d0d0d" }}>
              {["Customer", "Email", "Account Manager", "Orders", "Total Spent", "Open Quotes", "Last Activity", ""].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10,
                  fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f5c700" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
                No customers found
              </td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f5f5f5",
                background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f5c700",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <Link href={`/crm/customers/${c.id}`} style={{ fontWeight: 700, color: "#0d0d0d",
                      textDecoration: "none", fontSize: 13 }}>
                      {c.first_name} {c.last_name}
                      {c.note_count > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 10, color: "#9ca3af" }}>📝 {c.note_count}</span>
                      )}
                    </Link>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#6b7280" }}>{c.email}</td>
                <td style={{ padding: "12px 16px" }}>
                  {c.account_manager_name ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0d0d0d",
                      background: "#fef9c3", padding: "2px 8px", borderRadius: 4 }}>
                      {c.account_manager_name}
                    </span>
                  ) : <span style={{ color: "#d1d5db", fontSize: 12 }}>Unassigned</span>}
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d0d0d" }}>{c.order_count}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#22c55e" }}>{fmt(Number(c.total_spent))}</td>
                <td style={{ padding: "12px 16px" }}>
                  {c.open_quotes > 0 ? (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11,
                      fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      {c.open_quotes} open
                    </span>
                  ) : <span style={{ color: "#d1d5db" }}>—</span>}
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 12 }}>
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
    </div>
  );
}
