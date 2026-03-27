"use client";

import { useState } from "react";
import Link from "next/link";
import { CompanyDetailClient } from "./company-detail-client";
import { OnboardingTracker } from "@/components/onboarding-tracker";
import { CustomerTasksPanel } from "@/app/crm/customers/[id]/customer-tasks-panel";
import type { OnboardingStatus, CRMTask } from "@/app/actions/crm";

type Employee = { id: number; first_name: string; last_name: string; email: string; role: string; order_count: number; total_spent: number };
type AM = { id: number; first_name: string; last_name: string; email: string };
type Company = { id: number; name: string; industry: string | null; phone: string | null; city: string | null; state: string | null; domain: string | null; account_manager_id: number | null; account_manager_name: string | null; employee_count: number; total_spent: number; order_count: number; open_quotes: number; };

type Tab = "onboarding" | "tasks" | "team" | "overview";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  company_admin: { label: "Admin",  bg: "#fef3c7", color: "#92400e" },
  customer:      { label: "Member", bg: "#f1f5f9", color: "#475569" },
  admin:         { label: "Admin",  bg: "#fce7f3", color: "#9d174d" },
};

export function CompanyTabView({ company, employees, onboarding, accountManagers, tasks, sessionId, isAdmin }: {
  company: Company;
  employees: Employee[];
  onboarding: OnboardingStatus;
  accountManagers: AM[];
  tasks: CRMTask[];
  sessionId: number;
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("onboarding");
  const pendingTasks = tasks.filter(t => t.status !== "complete").length;

  const tabs: { key: Tab; label: string; badge?: number | string }[] = [
    { key: "onboarding", label: "Onboarding", badge: `${onboarding.complete}/${onboarding.total}` },
    { key: "tasks",      label: "Tasks",       badge: pendingTasks || undefined },
    { key: "team",       label: "Team",        badge: employees.length },
    { key: "overview",   label: "Details" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #f1f1f1" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "13px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            background: "none", border: "none", whiteSpace: "nowrap",
            borderBottom: tab === t.key ? "2px solid #f5c700" : "2px solid transparent",
            marginBottom: -2,
            color: tab === t.key ? "#0d0d0d" : "#9ca3af",
            display: "flex", alignItems: "center", gap: 7,
            transition: "color 0.15s",
          }}>
            {t.label}
            {t.badge !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "1px 7px", borderRadius: 999,
                background: tab === t.key ? "#0d0d0d" : "#f1f1f1",
                color: tab === t.key ? "#f5c700" : "#9ca3af",
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 20 }}>

        {tab === "onboarding" && (
          <OnboardingTracker entityType="company" entityId={company.id} initialData={onboarding} />
        )}

        {tab === "tasks" && (
          <CustomerTasksPanel
            tasks={tasks}
            entityType="company"
            entityId={company.id}
            entityName={company.name}
            accountManagers={accountManagers}
            sessionId={sessionId}
            isAdmin={isAdmin}
          />
        )}

        {tab === "team" && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 14px" }}>
              {employees.length} Employee{employees.length !== 1 ? "s" : ""}
            </p>
            {employees.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No employees yet</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f1f1" }}>
                    {["Name", "Email", "Role", "Orders", "Spent"].map(h => (
                      <th key={h} style={{ padding: "7px 0", textAlign: "left", fontSize: 10,
                        fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const meta = ROLE_META[emp.role] ?? ROLE_META.customer;
                    return (
                      <tr key={emp.id} style={{ borderBottom: i < employees.length - 1 ? "1px solid #f9f9f9" : "none" }}>
                        <td style={{ padding: "10px 0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#f5c700",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, fontWeight: 800, color: "#000", flexShrink: 0 }}>
                              {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                            <Link href={`/crm/customers/${emp.id}`}
                              style={{ fontWeight: 700, color: "#0d0d0d", textDecoration: "none", fontSize: 13 }}>
                              {emp.first_name} {emp.last_name}
                            </Link>
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px", color: "#6b7280", fontSize: 12 }}>{emp.email}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                            background: meta.bg, color: meta.color }}>{meta.label}</span>
                        </td>
                        <td style={{ padding: "10px 8px", fontWeight: 700 }}>{emp.order_count}</td>
                        <td style={{ padding: "10px 8px", fontWeight: 700, color: "#22c55e" }}>
                          {fmt(Number(emp.total_spent))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "overview" && (
          <CompanyDetailClient company={company as any} accountManagers={accountManagers} />
        )}
      </div>
    </div>
  );
}
