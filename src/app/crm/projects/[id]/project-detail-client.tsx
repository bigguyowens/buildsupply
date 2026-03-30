"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectDetail, ProjectStatus } from "@/app/actions/projects";
import { updateProject, deleteProject, linkProjectItem, unlinkProjectItem, addProjectNote } from "@/app/actions/projects";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: "Active",    color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  on_hold:   { label: "On Hold",   color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  cancelled: { label: "Cancelled", color: "var(--crm-muted)", bg: "#f1f5f9", dot: "#9ca3af" },
};

const QUOTE_STATUS: Record<string,{color:string;bg:string}> = {
  sent: {color:"#1e40af",bg:"#dbeafe"}, accepted:{color:"#15803d",bg:"#dcfce7"},
  declined:{color:"#991b1b",bg:"#fee2e2"}, expired:{color:"#92400e",bg:"#fef3c7"},
};
const ORDER_STATUS: Record<string,{color:string;bg:string}> = {
  pending:{color:"#92400e",bg:"#fef3c7"}, processing:{color:"#1e40af",bg:"#dbeafe"},
  shipped:{color:"#5b21b6",bg:"#ede9fe"}, completed:{color:"#15803d",bg:"#dcfce7"},
  cancelled:{color:"#6b7280",bg:"#f1f5f9"},
};

type Props = {
  project: ProjectDetail;
  sessionId: number;
  sessionRole: string;
  availableQuotes: {id:number;status:string;total_quoted:number}[];
  availableOrders: {id:number;status:string;total:number}[];
  availableTasks:  {id:number;title:string;status:string}[];
};

type Tab = "overview" | "quotes" | "orders" | "tasks" | "notes";

export function ProjectDetailClient({ project: initialProject, sessionId, sessionRole,
  availableQuotes, availableOrders, availableTasks }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [project, setProject] = useState(initialProject);

  const meta = STATUS_META[project.status];
  const isAdmin = sessionRole === "admin";

  // ── Status quick-update ──────────────────────────────────────────────
  function handleStatusChange(status: ProjectStatus) {
    startTransition(async () => {
      await updateProject(project.id, { status });
      setProject(p => ({ ...p, status }));
    });
  }

  // ── Link item ────────────────────────────────────────────────────────
  function handleLink(type: "quote"|"order"|"task", id: number) {
    startTransition(async () => {
      await linkProjectItem(project.id, type, id);
      router.refresh();
    });
  }

  // ── Unlink item ──────────────────────────────────────────────────────
  function handleUnlink(type: "quote"|"order"|"task", id: number) {
    startTransition(async () => {
      await unlinkProjectItem(project.id, type, id);
      router.refresh();
    });
  }

  const TABS: {key:Tab;label:string;count?:number}[] = [
    { key: "overview", label: "Overview" },
    { key: "quotes",   label: "Quotes",  count: project.quotes.length },
    { key: "orders",   label: "Orders",  count: project.orders.length },
    { key: "tasks",    label: "Tasks",   count: project.tasks.length },
    { key: "notes",    label: "Notes",   count: project.notes.length },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13 }}>
        <Link href="/crm/projects" style={{ color: "var(--crm-muted2)", textDecoration: "none" }}>Projects</Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ color: "var(--crm-text)", fontWeight: 700 }}>{project.name}</span>
      </div>

      {/* Header */}
      <div style={{ background: "#0d0d0d", borderRadius: 10, padding: "20px 24px",
        marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: 0 }}>
                {project.name}
              </h1>
              {/* Status dropdown */}
              <select value={project.status}
                onChange={e => handleStatusChange(e.target.value as ProjectStatus)}
                style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                  background: meta.bg, color: meta.color, border: "none",
                  cursor: "pointer", outline: "none" }}>
                {(Object.keys(STATUS_META) as ProjectStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href={project.entity_type === "customer"
                ? `/crm/customers/${project.entity_id}`
                : `/crm/companies/${project.entity_id}`}
                style={{ fontSize: 13, color: "#f5c700", fontWeight: 700, textDecoration: "none" }}>
                {project.entity_type === "customer" ? "👤" : "🏢"} {project.entity_name}
              </Link>
              {project.assigned_name && (
                <span style={{ fontSize: 12, color: "var(--crm-muted)" }}>
                  Assigned to: <strong style={{ color: "var(--crm-muted2)" }}>{project.assigned_name}</strong>
                </span>
              )}
            </div>
            {project.description && (
              <p style={{ color: "var(--crm-muted)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
            {[
              { label: "Value",   value: project.value ? fmt(Number(project.value)) : "—" },
              { label: "Quotes",  value: project.quotes.length },
              { label: "Orders",  value: project.orders.length },
              { label: "Tasks",   value: `${project.tasks.filter(t=>t.status!=="complete").length} open` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ color: "#f5c700", fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
                <p style={{ color: "var(--crm-muted)", fontSize: 10, margin: 0,
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--crm-border)",
        marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 18px", border: "none", background: "none",
            fontSize: 13, fontWeight: tab === t.key ? 800 : 600, cursor: "pointer",
            color: tab === t.key ? "#0d0d0d" : "#9ca3af",
            borderBottom: `2px solid ${tab === t.key ? "#f5c700" : "transparent"}`,
            marginBottom: -2, display: "flex", alignItems: "center", gap: 6 }}>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, background: "#f5c700",
                color: "#000", borderRadius: 10, padding: "1px 6px" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab project={project} />}
      {tab === "quotes" && (
        <LinkedItemsTab
          title="Quotes" icon="📋"
          linkedItems={project.quotes.map(q => ({
            id: q.id, label: `Quote #${q.id}`,
            sub: q.customer_name,
            meta: q.status, metaColor: QUOTE_STATUS[q.status]?.color ?? "#6b7280",
            metaBg: QUOTE_STATUS[q.status]?.bg ?? "#f1f5f9",
            value: fmt(Number(q.total_quoted)),
            href: `/crm/quotes/${q.id}`,
          }))}
          available={availableQuotes.map(q => ({
            id: q.id, label: `Quote #${q.id}`,
            sub: `${q.status} · ${fmt(Number(q.total_quoted))}`,
          }))}
          onLink={id => handleLink("quote", id)}
          onUnlink={id => handleUnlink("quote", id)}
          isPending={isPending}
        />
      )}
      {tab === "orders" && (
        <LinkedItemsTab
          title="Orders" icon="🛒"
          linkedItems={project.orders.map(o => ({
            id: o.id, label: `Order #${o.id}`,
            sub: o.customer_name,
            meta: o.status, metaColor: ORDER_STATUS[o.status]?.color ?? "#6b7280",
            metaBg: ORDER_STATUS[o.status]?.bg ?? "#f1f5f9",
            value: fmt(Number(o.total)),
            href: `/crm/orders/${o.id}`,
          }))}
          available={availableOrders.map(o => ({
            id: o.id, label: `Order #${o.id}`,
            sub: `${o.status} · ${fmt(Number(o.total))}`,
          }))}
          onLink={id => handleLink("order", id)}
          onUnlink={id => handleUnlink("order", id)}
          isPending={isPending}
        />
      )}
      {tab === "tasks" && (
        <LinkedItemsTab
          title="Tasks" icon="✅"
          linkedItems={project.tasks.map(t => ({
            id: t.id, label: t.title,
            sub: `${t.type} · ${t.priority} priority`,
            meta: t.status,
            metaColor: t.status === "complete" ? "#15803d" : t.status === "in_progress" ? "#1e40af" : "#6b7280",
            metaBg: t.status === "complete" ? "#dcfce7" : t.status === "in_progress" ? "#dbeafe" : "#f1f5f9",
            href: `/crm/tasks`,
          }))}
          available={availableTasks.map(t => ({
            id: t.id, label: t.title, sub: t.status,
          }))}
          onLink={id => handleLink("task", id)}
          onUnlink={id => handleUnlink("task", id)}
          isPending={isPending}
        />
      )}
      {tab === "notes" && (
        <NotesTab projectId={project.id} notes={project.notes} onAdded={() => router.refresh()} />
      )}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ project }: { project: ProjectDetail }) {
  const totalQuoteValue = project.quotes.reduce((s,q)=>s+Number(q.total_quoted),0);
  const totalOrderValue = project.orders.reduce((s,o)=>s+Number(o.total),0);
  const openTasks       = project.tasks.filter(t=>t.status!=="complete").length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { icon: "📋", label: "Quotes",       count: project.quotes.length, value: fmt(totalQuoteValue), color: "#f97316" },
          { icon: "🛒", label: "Orders",       count: project.orders.length, value: fmt(totalOrderValue), color: "#22c55e" },
          { icon: "✅", label: "Open Tasks",   count: openTasks, value: `${project.tasks.length} total`,  color: openTasks > 0 ? "#ef4444" : "#22c55e" },
          { icon: "📝", label: "Notes",        count: project.notes.length, value: "",                    color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--crm-surface)", borderRadius: 10,
            border: "1px solid var(--crm-border)", padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 22, fontWeight: 900, margin: 0, color: s.color }}>{s.count}</p>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.07em", color: "var(--crm-muted2)", margin: 0 }}>{s.label}</p>
            </div>
            {s.value && <p style={{ fontSize: 13, fontWeight: 800, color: "var(--crm-muted)", margin: 0 }}>{s.value}</p>}
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--crm-border2)",
          background: "var(--crm-surface2)" }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "var(--crm-text)", margin: 0 }}>Recent Notes</h3>
        </div>
        {project.notes.slice(0,4).map((n,i) => (
          <div key={n.id} style={{ padding: "12px 16px",
            borderBottom: i<3 && i<project.notes.length-1 ? "1px solid var(--crm-border2)" : "none" }}>
            <p style={{ fontSize: 12, color: "var(--crm-text2)", margin: "0 0 4px", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              overflow: "hidden" }}>{n.body}</p>
            <p style={{ fontSize: 10, color: "var(--crm-muted2)", margin: 0 }}>
              {n.author_name} · {new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </p>
          </div>
        ))}
        {project.notes.length === 0 && (
          <p style={{ padding: "24px 16px", textAlign: "center", color: "var(--crm-muted2)", fontSize: 13, margin: 0 }}>
            No notes yet
          </p>
        )}
      </div>
    </div>
  );
}

// ── Linked Items Tab ──────────────────────────────────────────────────────
type LinkedItem = { id:number; label:string; sub?:string; meta?:string;
  metaColor?:string; metaBg?:string; value?:string; href?:string };

function LinkedItemsTab({ title, icon, linkedItems, available, onLink, onUnlink, isPending }: {
  title: string; icon: string;
  linkedItems: LinkedItem[];
  available: {id:number;label:string;sub?:string}[];
  onLink: (id:number) => void;
  onUnlink: (id:number) => void;
  isPending: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--crm-text)" }}>
          {icon} {title} ({linkedItems.length})
        </h2>
        {available.length > 0 && (
          <button onClick={() => setShowAdd(v=>!v)} style={{
            background: showAdd ? "#f1f5f9" : "#0d0d0d",
            color: showAdd ? "#6b7280" : "#f5c700",
            border: "none", borderRadius: 7, padding: "7px 14px",
            fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showAdd ? "Cancel" : `+ Link ${title.slice(0,-1)}`}
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ background: "var(--crm-surface2)", borderRadius: 10, border: "1px solid var(--crm-border)",
          padding: "14px 16px", marginBottom: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--crm-muted)",
            margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Available to link:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {available.map(a => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "8px 12px", background: "var(--crm-surface)",
                borderRadius: 6, border: "1px solid var(--crm-border)" }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--crm-text)", margin: 0 }}>{a.label}</p>
                  {a.sub && <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>{a.sub}</p>}
                </div>
                <button onClick={() => { onLink(a.id); setShowAdd(false); }} disabled={isPending}
                  style={{ background: "#f5c700", color: "#000", border: "none",
                    borderRadius: 5, padding: "4px 12px", fontSize: 11, fontWeight: 800,
                    cursor: "pointer" }}>Link</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {linkedItems.length === 0 ? (
        <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
          padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--crm-muted2)", margin: 0 }}>
            No {title.toLowerCase()} linked to this project yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {linkedItems.map(item => (
            <div key={item.id} style={{ background: "var(--crm-surface)", borderRadius: 10,
              border: "1px solid var(--crm-border)", padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {item.href ? (
                  <Link href={item.href} style={{ fontSize: 14, fontWeight: 700,
                    color: "var(--crm-text)", textDecoration: "none" }}>{item.label}</Link>
                ) : (
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--crm-text)",
                    margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </p>
                )}
                {item.sub && <p style={{ fontSize: 12, color: "var(--crm-muted2)", margin: "2px 0 0" }}>{item.sub}</p>}
              </div>
              {item.meta && (
                <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10,
                  fontWeight: 800, background: item.metaBg ?? "#f1f5f9",
                  color: item.metaColor ?? "#6b7280", textTransform: "capitalize", flexShrink: 0 }}>
                  {item.meta}
                </span>
              )}
              {item.value && (
                <span style={{ fontSize: 13, fontWeight: 800, color: "#22c55e", flexShrink: 0 }}>
                  {item.value}
                </span>
              )}
              <button onClick={() => onUnlink(item.id)} disabled={isPending}
                style={{ background: "none", border: "1px solid var(--crm-border)",
                  color: "var(--crm-muted2)", borderRadius: 5, padding: "3px 8px",
                  fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────
function NotesTab({ projectId, notes, onAdded }: {
  projectId: number;
  notes: ProjectDetail["notes"];
  onAdded: () => void;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!body.trim()) return;
    startTransition(async () => {
      await addProjectNote(projectId, body);
      setBody("");
      onAdded();
    });
  }

  return (
    <div>
      {/* Add note */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        padding: "16px 18px", marginBottom: 16 }}>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Add a note to this project…"
          rows={3}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 7, fontSize: 13,
            border: "1.5px solid #e5e5e5", outline: "none", resize: "vertical",
            boxSizing: "border-box" as const, marginBottom: 10 }} />
        <button onClick={handleAdd} disabled={isPending || !body.trim()} style={{
          background: body.trim() ? "#0d0d0d" : "#f1f5f9",
          color: body.trim() ? "#f5c700" : "#9ca3af",
          border: "none", borderRadius: 7, padding: "8px 18px",
          fontSize: 13, fontWeight: 800, cursor: body.trim() ? "pointer" : "not-allowed" }}>
          {isPending ? "Adding…" : "Add Note"}
        </button>
      </div>

      {/* Notes list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notes.length === 0 ? (
          <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
            padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--crm-muted2)", margin: 0 }}>No notes yet</p>
          </div>
        ) : notes.map(n => (
          <div key={n.id} style={{ background: n.pinned ? "#fffbeb" : "#fff",
            borderRadius: 10, border: `1px solid ${n.pinned ? "#fde68a" : "#e5e5e5"}`,
            padding: "14px 18px" }}>
            {n.pinned && <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e",
              marginBottom: 6, display: "block" }}>📌 Pinned</span>}
            <p style={{ fontSize: 13, color: "var(--crm-text2)", margin: "0 0 8px", lineHeight: 1.6 }}>
              {n.body}
            </p>
            <p style={{ fontSize: 11, color: "var(--crm-muted2)", margin: 0 }}>
              {n.author_name} · {new Date(n.created_at).toLocaleDateString("en-US",
                { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
