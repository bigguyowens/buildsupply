"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCRMTask, updateCRMTask, deleteCRMTask } from "@/app/actions/crm";
import type { CRMTask } from "@/app/actions/crm";

type AM = { id: number; first_name: string; last_name: string; email: string };
type Customer = { id: number; first_name: string; last_name: string; email: string };
type Company  = { id: number; name: string };
type StaffMember = { id: number; first_name: string; last_name: string; role: string };

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  call:       { label: "Call",       icon: "📞", color: "#3b82f6" },
  email:      { label: "Email",      icon: "✉️",  color: "#8b5cf6" },
  follow_up:  { label: "Follow-up",  icon: "🔄", color: "#f59e0b" },
  demo:       { label: "Demo",       icon: "🖥️",  color: "#10b981" },
  check_in:   { label: "Check-in",   icon: "👋", color: "#06b6d4" },
  proposal:   { label: "Proposal",   icon: "📄", color: "#f97316" },
  other:      { label: "Other",      icon: "📌", color: "#6b7280" },
};

const PRIORITY_META: Record<string, { label: string; bg: string; color: string }> = {
  high:   { label: "High",   bg: "#fee2e2", color: "#991b1b" },
  medium: { label: "Medium", bg: "#fef3c7", color: "#92400e" },
  low:    { label: "Low",    bg: "#f1f5f9", color: "#475569" },
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return d < new Date().toISOString().split("T")[0];
}

export function TasksClient({ overdue, dueToday, upcoming, completed, accountManagers, customers, companies, staff, sessionId, sessionRole, isAdmin }: {
  overdue: CRMTask[];
  dueToday: CRMTask[];
  upcoming: CRMTask[];
  completed: CRMTask[];
  accountManagers: AM[];
  customers: Customer[];
  companies: Company[];
  staff: StaffMember[];
  sessionId: number;
  sessionRole: string;
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterStaffId, setFilterStaffId] = useState<number | "all" | "mine">("all");

  const canFilter = isAdmin || sessionRole === "manager";

  // Apply staff filter client-side
  function applyFilter(tasks: CRMTask[]) {
    if (!canFilter || filterStaffId === "all") return tasks;
    const targetId = filterStaffId === "mine" ? sessionId : filterStaffId;
    return tasks.filter(t => t.assigned_to === targetId);
  }

  const filteredOverdue   = applyFilter(overdue);
  const filteredDueToday  = applyFilter(dueToday);
  const filteredUpcoming  = applyFilter(upcoming);
  const filteredCompleted = applyFilter(completed);
  const total = filteredOverdue.length + filteredDueToday.length + filteredUpcoming.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
            Tasks & Follow-ups
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
            {filteredOverdue.length > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}>{filteredOverdue.length} overdue · </span>}
            {filteredDueToday.length} due today · {filteredUpcoming.length} upcoming
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "#0d0d0d", color: "#f5c700", border: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 800,
          fontSize: 13, cursor: "pointer",
        }}>+ New Task</button>
      </div>

      {/* Staff filter bar — admin and manager only */}
      {canFilter && staff.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
          padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#9ca3af", marginRight: 4 }}>View:</span>

          {/* All Tasks */}
          <button onClick={() => setFilterStaffId("all")} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: `2px solid ${filterStaffId === "all" ? "#0d0d0d" : "#e5e5e5"}`,
            background: filterStaffId === "all" ? "#0d0d0d" : "#fff",
            color: filterStaffId === "all" ? "#f5c700" : "#6b7280",
          }}>All Tasks</button>

          {/* My Tasks */}
          <button onClick={() => setFilterStaffId("mine")} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
            border: `2px solid ${filterStaffId === "mine" ? "#f5c700" : "#e5e5e5"}`,
            background: filterStaffId === "mine" ? "#fffbeb" : "#fff",
            color: filterStaffId === "mine" ? "#92400e" : "#6b7280",
          }}>⭐ My Tasks</button>

          {/* Separator */}
          <div style={{ width: 1, height: 20, background: "#e5e5e5", margin: "0 4px" }} />

          {/* Individual staff buttons */}
          {staff.filter(s => s.id !== sessionId).map(s => {
            const active = filterStaffId === s.id;
            return (
              <button key={s.id} onClick={() => setFilterStaffId(active ? "all" : s.id)} style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `2px solid ${active ? "#3b82f6" : "#e5e5e5"}`,
                background: active ? "#eff6ff" : "#fff",
                color: active ? "#1e40af" : "#6b7280",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#f5c700",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 900, color: "#000", flexShrink: 0 }}>
                  {s.first_name[0]}{s.last_name[0]}
                </span>
                {s.first_name} {s.last_name}
              </button>
            );
          })}
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Overdue",   value: filteredOverdue.length,   color: "#ef4444", border: "#ef4444" },
          { label: "Due Today", value: filteredDueToday.length,  color: "#f97316", border: "#f97316" },
          { label: "Upcoming",  value: filteredUpcoming.length,  color: "#3b82f6", border: "#3b82f6" },
          { label: "Completed", value: filteredCompleted.length, color: "#22c55e", border: "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px",
            border: "1px solid #e5e5e5", borderTop: `3px solid ${k.border}` }}>
            <p style={{ fontSize: 26, fontWeight: 900, color: k.color, margin: "0 0 2px" }}>{k.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "#9ca3af", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Task groups */}
      {filteredOverdue.length > 0 && (
        <TaskGroup title="⚠️ Overdue" tasks={filteredOverdue} headerBg="#fef2f2"
          headerColor="#991b1b" accountManagers={accountManagers} isAdmin={isAdmin} />
      )}
      {filteredDueToday.length > 0 && (
        <TaskGroup title="📅 Due Today" tasks={filteredDueToday} headerBg="#fff7ed"
          headerColor="#c2410c" accountManagers={accountManagers} isAdmin={isAdmin} />
      )}
      {filteredUpcoming.length > 0 && (
        <TaskGroup title="🔜 Upcoming" tasks={filteredUpcoming} headerBg="#f0f9ff"
          headerColor="#0369a1" accountManagers={accountManagers} isAdmin={isAdmin} />
      )}
      {total === 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e5e5",
          padding: "60px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>✅</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0d0d0d", margin: "0 0 4px" }}>All caught up!</p>
          <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>No pending tasks.</p>
        </div>
      )}

      {/* Completed toggle */}
      {filteredCompleted.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowCompleted(v => !v)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#9ca3af", padding: "8px 0",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {showCompleted ? "▼" : "▶"} Recently Completed ({filteredCompleted.length})
          </button>
          {showCompleted && (
            <TaskGroup title="" tasks={filteredCompleted} headerBg="#f9f9f9"
              headerColor="#9ca3af" accountManagers={accountManagers} isAdmin={isAdmin} hideHeader />
          )}
        </div>
      )}

      {/* New task modal */}
      {showForm && (
        <NewTaskModal
          accountManagers={accountManagers}
          customers={customers}
          companies={companies}
          sessionId={sessionId}
          isAdmin={isAdmin || sessionRole === "manager"}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────
function TaskCard({ task, accountManagers, isAdmin }: {
  task: CRMTask; accountManagers: AM[]; isAdmin: boolean;
}) {
  const [status, setStatus] = useState(task.status);
  const [expanded, setExpanded] = useState(false);
  const [, startT] = useTransition();
  const typeMeta = TYPE_META[task.type] ?? TYPE_META.other;
  const priMeta  = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
  const overdue  = isOverdue(task.due_date) && status !== "complete";

  function cycleStatus() {
    const next = status === "pending" ? "in_progress" : status === "in_progress" ? "complete" : "pending";
    setStatus(next as CRMTask["status"]);
    startT(async () => { await updateCRMTask(task.id, { status: next as CRMTask["status"] }); });
  }

  function del() {
    startT(async () => { await deleteCRMTask(task.id); });
  }

  const statusIcon = status === "complete" ? "✓" : status === "in_progress" ? "◑" : "○";
  const statusColor = status === "complete" ? "#22c55e" : status === "in_progress" ? "#f97316" : "#d1d5db";

  return (
    <div style={{ background: "#fff", borderRadius: 8, border: `1px solid ${overdue ? "#fecaca" : "#e5e5e5"}`,
      padding: "13px 16px", opacity: status === "complete" ? 0.65 : 1,
      borderLeft: `3px solid ${overdue ? "#ef4444" : typeMeta.color}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Status toggle */}
        <button onClick={cycleStatus} title="Click to change status" style={{
          width: 24, height: 24, borderRadius: "50%", border: `2px solid ${statusColor}`,
          background: status === "complete" ? "#22c55e" : "transparent",
          color: status === "complete" ? "#fff" : statusColor,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0, marginTop: 1,
        }}>{statusIcon}</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0d0d0d",
              textDecoration: status === "complete" ? "line-through" : "none" }}>
              {task.title}
            </span>
            <span style={{ fontSize: 11, color: typeMeta.color, fontWeight: 700 }}>
              {typeMeta.icon} {typeMeta.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4,
              background: priMeta.bg, color: priMeta.color }}>{priMeta.label}</span>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {task.due_date && (
              <span style={{ fontSize: 12, fontWeight: 600,
                color: overdue ? "#ef4444" : "#6b7280" }}>
                {overdue ? "⚠ " : "📅 "}{fmtDate(task.due_date)}
              </span>
            )}
            {task.entity_name && task.entity_type && (
              <Link href={`/crm/${task.entity_type === "customer" ? "customers" : "companies"}/${task.entity_id}`}
                style={{ fontSize: 12, color: "#f5c700", fontWeight: 600, textDecoration: "none" }}>
                {task.entity_type === "customer" ? "👤" : "🏢"} {task.entity_name}
              </Link>
            )}
            {task.assigned_name && (
              <span style={{ fontSize: 12, color: "#9ca3af" }}>→ {task.assigned_name}</span>
            )}
          </div>

          {task.description && expanded && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0", lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {task.description && (
            <button onClick={() => setExpanded(v => !v)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", fontSize: 12, padding: 4,
            }}>{expanded ? "▲" : "▼"}</button>
          )}
          <button onClick={del} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#d1d5db", fontSize: 14, padding: 4,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Group ────────────────────────────────────────────────────────────
function TaskGroup({ title, tasks, headerBg, headerColor, accountManagers, isAdmin, hideHeader }: {
  title: string; tasks: CRMTask[]; headerBg: string; headerColor: string;
  accountManagers: AM[]; isAdmin: boolean; hideHeader?: boolean;
}) {
  if (!tasks.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {!hideHeader && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
          padding: "8px 14px", background: headerBg, borderRadius: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: headerColor }}>{title}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: headerColor, opacity: 0.7 }}>
            ({tasks.length})
          </span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} accountManagers={accountManagers} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

// ── New Task Modal ────────────────────────────────────────────────────────
function NewTaskModal({ accountManagers, customers, companies, sessionId, isAdmin, onClose, entityType: initEntityType, entityId: initEntityId, entityName: initEntityName }: {
  accountManagers: AM[];
  customers: Customer[];
  companies: Company[];
  sessionId: number;
  isAdmin: boolean;
  onClose: () => void;
  entityType?: "customer" | "company";
  entityId?: number;
  entityName?: string;
}) {
  const [title, setTitle]           = useState("");
  const [desc, setDesc]             = useState("");
  const [type, setType]             = useState<CRMTask["type"]>("follow_up");
  const [priority, setPriority]     = useState<CRMTask["priority"]>("medium");
  const [dueDate, setDueDate]       = useState("");
  const [assignedTo, setAssignedTo] = useState(String(sessionId));
  const [entityType, setEntityType] = useState<"" | "customer" | "company">(initEntityType ?? "");
  const [entityId, setEntityId]     = useState<string>(initEntityId ? String(initEntityId) : "");
  const [entityName, setEntityName] = useState<string>(initEntityName ?? "");
  const [saving, setSaving]         = useState(false);
  const [, startT]                  = useTransition();

  // Locked if opened from a customer/company record
  const locked = !!initEntityType;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    border: "1px solid #e5e5e5", outline: "none", boxSizing: "border-box",
    background: "#fff",
  };

  function handleEntityTypeChange(newType: "" | "customer" | "company") {
    setEntityType(newType);
    setEntityId("");
    setEntityName("");
  }

  function handleEntityIdChange(id: string) {
    setEntityId(id);
    if (entityType === "customer") {
      const c = customers.find(c => String(c.id) === id);
      setEntityName(c ? `${c.first_name} ${c.last_name}` : "");
    } else if (entityType === "company") {
      const co = companies.find(co => String(co.id) === id);
      setEntityName(co?.name ?? "");
    }
  }

  function save() {
    if (!title.trim()) return;
    setSaving(true);
    startT(async () => {
      await createCRMTask({
        title: title.trim(),
        description: desc || undefined,
        type, priority,
        due_date: dueDate || undefined,
        entity_type: entityType || undefined,
        entity_id: entityId ? Number(entityId) : undefined,
        entity_name: entityName || undefined,
        assigned_to: Number(assignedTo),
      });
      onClose();
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 12, width: 500, maxWidth: "95vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "#0d0d0d", padding: "16px 20px", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#f5c700", fontSize: 15, fontWeight: 800, margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: "#6b6b6b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Title */}
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title *" style={inputStyle} autoFocus />

          {/* Type + Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                Type
              </label>
              <select value={type} onChange={e => setType(e.target.value as CRMTask["type"])} style={inputStyle}>
                {Object.entries(TYPE_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                Priority
              </label>
              <select value={priority} onChange={e => setPriority(e.target.value as CRMTask["priority"])} style={inputStyle}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>
          </div>

          {/* Due Date + Assign To */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                Due Date
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </div>
            {isAdmin && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                  Assign To
                </label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inputStyle}>
                  {accountManagers.map(am => (
                    <option key={am.id} value={am.id}>{am.first_name} {am.last_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Link to Customer / Company */}
          {!locked && (customers.length > 0 || companies.length > 0) && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                Link To <span style={{ color: "#d1d5db", fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                {/* Entity type selector */}
                <select value={entityType} onChange={e => handleEntityTypeChange(e.target.value as "" | "customer" | "company")}
                  style={inputStyle}>
                  <option value="">— None —</option>
                  {customers.length > 0 && <option value="customer">👤 Customer</option>}
                  {companies.length > 0 && <option value="company">🏢 Company</option>}
                </select>

                {/* Entity picker */}
                {entityType === "customer" && (
                  <select value={entityId} onChange={e => handleEntityIdChange(e.target.value)} style={inputStyle}>
                    <option value="">Select customer…</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} — {c.email}
                      </option>
                    ))}
                  </select>
                )}
                {entityType === "company" && (
                  <select value={entityId} onChange={e => handleEntityIdChange(e.target.value)} style={inputStyle}>
                    <option value="">Select company…</option>
                    {companies.map(co => (
                      <option key={co.id} value={co.id}>{co.name}</option>
                    ))}
                  </select>
                )}
                {!entityType && (
                  <div style={{ ...inputStyle, display: "flex", alignItems: "center",
                    color: "#d1d5db", fontSize: 13, background: "#fafafa" }}>
                    Select a type first
                  </div>
                )}
              </div>
              {entityName && (
                <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, margin: "4px 0 0" }}>
                  ✓ Linked to {entityName}
                </p>
              )}
            </div>
          )}

          {/* Locked entity display (opened from record) */}
          {locked && entityName && (
            <div style={{ background: "#fffbeb", border: "1px solid #f5c700",
              borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
              <span style={{ color: "#9ca3af", fontWeight: 600 }}>Linked to: </span>
              <strong style={{ color: "#0d0d0d" }}>
                {initEntityType === "customer" ? "👤" : "🏢"} {entityName}
              </strong>
            </div>
          )}

          {/* Notes */}
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Notes or description (optional)" rows={2}
            style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />

          {/* Submit */}
          <button onClick={save} disabled={!title.trim() || saving}
            style={{ background: saving || !title.trim() ? "#d1d5db" : "#0d0d0d", color: "#f5c700",
              border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 800,
              fontSize: 14, cursor: saving || !title.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s" }}>
            {saving ? "Saving…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { NewTaskModal, TaskCard, TaskGroup, TYPE_META, PRIORITY_META };
