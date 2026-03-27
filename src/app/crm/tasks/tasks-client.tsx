"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createCRMTask, updateCRMTask, deleteCRMTask } from "@/app/actions/crm";
import type { CRMTask } from "@/app/actions/crm";

type AM = { id: number; first_name: string; last_name: string; email: string };

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

export function TasksClient({ overdue, dueToday, upcoming, completed, accountManagers, sessionId, isAdmin }: {
  overdue: CRMTask[];
  dueToday: CRMTask[];
  upcoming: CRMTask[];
  completed: CRMTask[];
  accountManagers: AM[];
  sessionId: number;
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const total = overdue.length + dueToday.length + upcoming.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
            Tasks & Follow-ups
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
            {overdue.length > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}>{overdue.length} overdue · </span>}
            {dueToday.length} due today · {upcoming.length} upcoming
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: "#0d0d0d", color: "#f5c700", border: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 800,
          fontSize: 13, cursor: "pointer",
        }}>+ New Task</button>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Overdue",   value: overdue.length,   color: "#ef4444", border: "#ef4444" },
          { label: "Due Today", value: dueToday.length,  color: "#f97316", border: "#f97316" },
          { label: "Upcoming",  value: upcoming.length,  color: "#3b82f6", border: "#3b82f6" },
          { label: "Completed", value: completed.length, color: "#22c55e", border: "#22c55e" },
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
      {overdue.length > 0 && (
        <TaskGroup title="⚠️ Overdue" tasks={overdue} headerBg="#fef2f2"
          headerColor="#991b1b" accountManagers={accountManagers} isAdmin={isAdmin} />
      )}
      {dueToday.length > 0 && (
        <TaskGroup title="📅 Due Today" tasks={dueToday} headerBg="#fff7ed"
          headerColor="#c2410c" accountManagers={accountManagers} isAdmin={isAdmin} />
      )}
      {upcoming.length > 0 && (
        <TaskGroup title="🔜 Upcoming" tasks={upcoming} headerBg="#f0f9ff"
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
      {completed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setShowCompleted(v => !v)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: "#9ca3af", padding: "8px 0",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {showCompleted ? "▼" : "▶"} Recently Completed ({completed.length})
          </button>
          {showCompleted && (
            <TaskGroup title="" tasks={completed} headerBg="#f9f9f9"
              headerColor="#9ca3af" accountManagers={accountManagers} isAdmin={isAdmin} hideHeader />
          )}
        </div>
      )}

      {/* New task modal */}
      {showForm && (
        <NewTaskModal
          accountManagers={accountManagers}
          sessionId={sessionId}
          isAdmin={isAdmin}
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
function NewTaskModal({ accountManagers, sessionId, isAdmin, onClose, entityType, entityId, entityName }: {
  accountManagers: AM[]; sessionId: number; isAdmin: boolean; onClose: () => void;
  entityType?: "customer" | "company"; entityId?: number; entityName?: string;
}) {
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [type, setType]         = useState<CRMTask["type"]>("follow_up");
  const [priority, setPriority] = useState<CRMTask["priority"]>("medium");
  const [dueDate, setDueDate]   = useState("");
  const [assignedTo, setAssignedTo] = useState(String(sessionId));
  const [saving, setSaving]     = useState(false);
  const [, startT]              = useTransition();

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    border: "1px solid #e5e5e5", outline: "none", boxSizing: "border-box",
    background: "#fff",
  };

  function save() {
    if (!title.trim()) return;
    setSaving(true);
    startT(async () => {
      await createCRMTask({
        title: title.trim(), description: desc || undefined,
        type, priority, due_date: dueDate || undefined,
        entity_type: entityType, entity_id: entityId,
        entity_name: entityName, assigned_to: Number(assignedTo),
      });
      onClose();
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 12, width: 480, maxWidth: "95vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        {/* Modal header */}
        <div style={{ background: "#0d0d0d", padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#f5c700", fontSize: 15, fontWeight: 800, margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: "#6b6b6b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title *" style={inputStyle} autoFocus />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                Type
              </label>
              <select value={type} onChange={e => setType(e.target.value as CRMTask["type"])}
                style={inputStyle}>
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
              <select value={priority} onChange={e => setPriority(e.target.value as CRMTask["priority"])}
                style={inputStyle}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🔵 Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                Due Date
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={inputStyle} />
            </div>
            {isAdmin && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                  Assign To
                </label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                  style={inputStyle}>
                  {accountManagers.map(am => (
                    <option key={am.id} value={am.id}>
                      {am.first_name} {am.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Notes or description (optional)" rows={3}
            style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />

          {entityName && (
            <div style={{ background: "#f9f9f9", borderRadius: 6, padding: "8px 12px",
              fontSize: 12, color: "#6b7280" }}>
              Linked to: <strong style={{ color: "#0d0d0d" }}>{entityName}</strong>
            </div>
          )}

          <button onClick={save} disabled={!title.trim() || saving}
            style={{ background: saving ? "#d1d5db" : "#0d0d0d", color: "#f5c700",
              border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 800,
              fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { NewTaskModal, TaskCard, TaskGroup, TYPE_META, PRIORITY_META };
