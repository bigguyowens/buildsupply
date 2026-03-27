"use client";

import { useState } from "react";
import Link from "next/link";
import { NotesPanel, ActivityFeed, EmailSender } from "./crm-customer-client";
import { OnboardingTracker } from "@/components/onboarding-tracker";
import { CustomerTasksPanel } from "./customer-tasks-panel";
import type { CRMNote, CRMActivity, OnboardingStatus, CRMTask } from "@/app/actions/crm";

type Order   = { id: number; status: string; total: number; created_at: string; items: unknown };
type Quote   = { id: number; status: string; created_at: string; expires_at: string | null; total_quoted: number };
type Contact = { id: number; name: string; email: string; reason: string | null; message: string; status: string; created_at: string };

type Tab = "onboarding" | "tasks" | "orders" | "quotes" | "activity" | "notes" | "contacts";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "#fef9c3", color: "#854d0e" },
  processing: { bg: "#dbeafe", color: "#1e40af" },
  shipped:    { bg: "#ede9fe", color: "#5b21b6" },
  completed:  { bg: "#dcfce7", color: "#15803d" },
  cancelled:  { bg: "#fee2e2", color: "#991b1b" },
  sent:       { bg: "#dbeafe", color: "#1e40af" },
  accepted:   { bg: "#dcfce7", color: "#15803d" },
  declined:   { bg: "#fee2e2", color: "#991b1b" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function CustomerTabView({
  customerId, customerEmail, customerName,
  orders, quotes, notes, activities, contacts, onboarding, tasks, taskAMs, sessionId, isAdmin,
}: {
  customerId: number;
  customerEmail: string;
  customerName: string;
  orders: Order[];
  quotes: Quote[];
  notes: CRMNote[];
  activities: CRMActivity[];
  contacts: Contact[];
  onboarding: OnboardingStatus;
  tasks: CRMTask[];
  taskAMs: { id: number; first_name: string; last_name: string; email: string }[];
  sessionId: number;
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("onboarding");
  const pendingTasks = tasks.filter(t => t.status !== "complete").length;

  const tabs: { key: Tab; label: string; badge?: number | string }[] = [
    { key: "onboarding", label: "Onboarding",  badge: `${onboarding.complete}/${onboarding.total}` },
    { key: "tasks",      label: "Tasks",        badge: pendingTasks || undefined },
    { key: "orders",     label: "Orders",       badge: orders.length || undefined },
    { key: "quotes",     label: "Quotes",       badge: quotes.length || undefined },
    { key: "activity",   label: "Activity",     badge: activities.length || undefined },
    { key: "notes",      label: "Notes",        badge: notes.length || undefined },
    ...(contacts.length > 0 ? [{ key: "contacts" as Tab, label: "Contacts", badge: contacts.length }] : []),
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5", overflow: "hidden" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #f1f1f1", overflowX: "auto" }}>
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
          <OnboardingTracker entityType="customer" entityId={customerId} initialData={onboarding} />
        )}

        {tab === "tasks" && (
          <CustomerTasksPanel
            tasks={tasks} entityType="customer" entityId={customerId}
            entityName={customerName} accountManagers={taskAMs}
            sessionId={sessionId} isAdmin={isAdmin}
          />
        )}

        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>
                {orders.length} Order{orders.length !== 1 ? "s" : ""}
              </p>
              <Link href={`/admin/orders`} style={{ fontSize: 11, color: "#f5c700", textDecoration: "none", fontWeight: 700 }}>
                Admin View →
              </Link>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No orders yet</p>
            ) : orders.map((o, i) => {
              const s = STATUS_COLORS[o.status] ?? STATUS_COLORS.pending;
              const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items as unknown as string ?? "[]");
              return (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 0", borderBottom: i < orders.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div>
                    <Link href={`/admin/orders/${o.id}`} style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", textDecoration: "none" }}>
                      Order #{o.id}
                    </Link>
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: s.bg, color: s.color }}>
                      {o.status}
                    </span>
                    <p style={{ color: "#9ca3af", fontSize: 11, margin: "2px 0 0" }}>
                      {(items as any[]).length} item{(items as any[]).length !== 1 ? "s" : ""} ·{" "}
                      {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{ fontWeight: 800, color: "#22c55e", fontSize: 14 }}>{fmt(Number(o.total))}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "quotes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>
                {quotes.length} Quote{quotes.length !== 1 ? "s" : ""}
              </p>
              <Link href={`/admin/quotes`} style={{ fontSize: 11, color: "#f5c700", textDecoration: "none", fontWeight: 700 }}>
                Create Quote →
              </Link>
            </div>
            {quotes.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No quotes yet</p>
            ) : quotes.map((q, i) => {
              const s = STATUS_COLORS[q.status] ?? STATUS_COLORS.pending;
              return (
                <div key={q.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 0", borderBottom: i < quotes.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                  <div>
                    <Link href={`/admin/quotes/${q.id}`} style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d", textDecoration: "none" }}>
                      Quote #{q.id}
                    </Link>
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 4,
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: s.bg, color: s.color }}>
                      {q.status}
                    </span>
                    <p style={{ color: "#9ca3af", fontSize: 11, margin: "2px 0 0" }}>
                      {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {q.expires_at ? ` · Expires ${new Date(q.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                    </p>
                  </div>
                  <span style={{ fontWeight: 800, color: "#f5c700", fontSize: 14 }}>{fmt(Number(q.total_quoted))}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "activity" && <ActivityFeed activities={activities} />}

        {tab === "notes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <EmailSender customerId={customerId} customerEmail={customerEmail} customerName={customerName} />
            <div style={{ borderTop: "1px solid #f1f1f1", paddingTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 12px" }}>Notes & Call Logs</p>
              <NotesPanel customerId={customerId} initialNotes={notes} />
            </div>
          </div>
        )}

        {tab === "contacts" && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 14px" }}>
              {contacts.length} Contact Form{contacts.length !== 1 ? "s" : ""}
            </p>
            {contacts.map((c, i) => (
              <div key={c.id} style={{ padding: "12px 0", borderBottom: i < contacts.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#0d0d0d" }}>{c.reason ?? "General Inquiry"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: c.status === "new" ? "#fee2e2" : "#dcfce7",
                    color: c.status === "new" ? "#991b1b" : "#15803d" }}>
                    {c.status}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>
                  {c.message.slice(0, 140)}{c.message.length > 140 ? "…" : ""}
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                  {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
