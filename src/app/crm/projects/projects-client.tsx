"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CRMProject, ProjectStatus } from "@/app/actions/projects";
import { createProject, deleteProject } from "@/app/actions/projects";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:    { label: "Active",    color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  on_hold:   { label: "On Hold",   color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  completed: { label: "Completed", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  cancelled: { label: "Cancelled", color: "var(--crm-muted)", bg: "#f1f5f9", dot: "#9ca3af" },
};

const STATUSES: (ProjectStatus | "all")[] = ["all","active","on_hold","completed","cancelled"];

type Props = {
  projects: CRMProject[];
  statusCounts: Record<string, number>;
  sessionRole: string;
  sessionId: number;
  scope: "mine" | "all";
  scopeToggle?: React.ReactNode;
};

export function ProjectsClient({ projects, statusCounts, sessionRole, sessionId, scope, scopeToggle }: Props) {
  const router = useRouter();
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<ProjectStatus | "all">("active");
  const [typeFilter, setType]     = useState<"all" | "customer" | "company">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects
      .filter(p => statusFilter === "all" || p.status === statusFilter)
      .filter(p => typeFilter === "all" || p.entity_type === typeFilter)
      .filter(p => !q || [p.name, p.entity_name, p.assigned_name ?? ""]
        .some(v => v.toLowerCase().includes(q)));
  }, [projects, search, statusFilter, typeFilter]);

  const totalValue = filtered.reduce((s, p) => s + Number(p.value ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "var(--crm-text)", letterSpacing: "-0.03em" }}>
            Projects
          </h1>
          <p style={{ color: "var(--crm-muted)", fontSize: 14, margin: "4px 0 0" }}>
            Organize quotes, orders, tasks and notes across customers and companies
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {scopeToggle}
          <button onClick={() => setShowCreate(true)} style={{
            background: "#0d0d0d", color: "#f5c700", border: "none",
            borderRadius: 8, padding: "10px 18px", fontWeight: 800,
            fontSize: 13, cursor: "pointer" }}>
            + New Project
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",     value: projects.length,               color: "#f5c700" },
          { label: "Active",    value: statusCounts.active ?? 0,      color: "#22c55e" },
          { label: "On Hold",   value: statusCounts.on_hold ?? 0,     color: "#f59e0b" },
          { label: "Completed", value: statusCounts.completed ?? 0,   color: "#3b82f6" },
          { label: "Value",     value: fmt(projects.reduce((s,p)=>s+Number(p.value??0),0)), color: "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--crm-surface)", borderRadius: 10,
            padding: "14px 16px", border: "1px solid var(--crm-border)",
            borderTop: `3px solid ${k.color}` }}>
            <p style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", color: "var(--crm-text)" }}>
              {typeof k.value === "number" ? k.value : k.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "var(--crm-muted2)", margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        padding: "12px 16px", marginBottom: 16,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "var(--crm-muted2)", fontSize: 13 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, customers, companies…"
            style={{ width: "100%", padding: "7px 10px 7px 30px", borderRadius: 6,
              border: "1px solid var(--crm-border)", fontSize: 13, outline: "none",
              background: "var(--crm-surface2)", boxSizing: "border-box" as const }} />
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {([["all","All"],["customer","👤 Customers"],["company","🏢 Companies"]] as const).map(([v,l]) => (
            <button key={v} onClick={() => setType(v)} style={{
              padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: "pointer", border: "2px solid",
              borderColor: typeFilter === v ? "#0d0d0d" : "#e5e5e5",
              background: typeFilter === v ? "#0d0d0d" : "#fff",
              color: typeFilter === v ? "#f5c700" : "#6b7280" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATUSES.map(s => {
            const meta = s !== "all" ? STATUS_META[s] : null;
            const count = s === "all" ? projects.length : (statusCounts[s] ?? 0);
            return (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                cursor: "pointer", border: "2px solid",
                borderColor: statusFilter === s ? (meta?.color ?? "#0d0d0d") : "#e5e5e5",
                background: statusFilter === s ? (meta?.bg ?? "#0d0d0d") : "#fff",
                color: statusFilter === s ? (meta?.color ?? "#f5c700") : "#6b7280" }}>
                {s === "all" ? "All" : meta!.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results info */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
        <span style={{ fontSize: 12, color: "var(--crm-muted)", fontWeight: 600 }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
        {totalValue > 0 && (
          <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>
            {fmt(totalValue)} total value
          </span>
        )}
      </div>

      {/* Project cards grid */}
      {filtered.length === 0 ? (
        <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
          padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>📁</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--crm-text)", margin: "0 0 6px" }}>
            No projects yet
          </p>
          <p style={{ fontSize: 13, color: "var(--crm-muted2)", margin: "0 0 20px" }}>
            Create a project to start organizing quotes, orders, and tasks together
          </p>
          <button onClick={() => setShowCreate(true)} style={{
            background: "#0d0d0d", color: "#f5c700", border: "none",
            borderRadius: 8, padding: "10px 20px", fontWeight: 800,
            fontSize: 13, cursor: "pointer" }}>
            + New Project
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          sessionId={sessionId}
          onClose={() => setShowCreate(false)}
          onCreated={id => { setShowCreate(false); router.push(`/crm/projects/${id}`); }}
        />
      )}
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({ project: p }: { project: CRMProject }) {
  const meta = STATUS_META[p.status];
  const daysOld = Math.floor((Date.now() - new Date(p.updated_at).getTime()) / 86400000);

  return (
    <Link href={`/crm/projects/${p.id}`} style={{ textDecoration: "none" }}>
      <div style={{ background: "var(--crm-surface)", borderRadius: 10, border: "1px solid var(--crm-border)",
        overflow: "hidden", transition: "box-shadow 0.15s", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>

        {/* Card header */}
        <div style={{ padding: "16px 18px 12px",
          borderBottom: "1px solid var(--crm-border2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--crm-text)",
              margin: 0, lineHeight: 1.3, flex: 1 }}>
              {p.name}
            </h3>
            <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10,
              fontWeight: 800, background: meta.bg, color: meta.color,
              textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%",
                background: meta.dot, display: "inline-block" }} />
              {meta.label}
            </span>
          </div>

          {/* Entity */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11 }}>{p.entity_type === "customer" ? "👤" : "🏢"}</span>
            <span style={{ fontSize: 12, color: "var(--crm-text2)", fontWeight: 600 }}>{p.entity_name}</span>
            {p.value && (
              <>
                <span style={{ color: "#e5e5e5" }}>·</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>
                  {fmt(Number(p.value))}
                </span>
              </>
            )}
          </div>

          {p.description && (
            <p style={{ fontSize: 12, color: "var(--crm-muted)", margin: "8px 0 0", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              overflow: "hidden" }}>
              {p.description}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div style={{ padding: "10px 18px", display: "flex", gap: 16,
          background: "var(--crm-surface2)" }}>
          {[
            { icon: "📋", count: p.quote_count,  label: "Quote" },
            { icon: "🛒", count: p.order_count,  label: "Order" },
            { icon: "✅", count: p.task_count,   label: "Task",
              badge: p.open_task_count > 0 ? p.open_task_count : null },
            { icon: "📝", count: p.note_count,   label: "Note" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>{s.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--crm-text2)" }}>
                {s.count}
              </span>
              {s.badge && (
                <span style={{ fontSize: 9, fontWeight: 800, background: "#ef4444",
                  color: "#fff", borderRadius: 10, padding: "1px 5px" }}>
                  {s.badge} open
                </span>
              )}
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {p.assigned_name && (
              <span style={{ fontSize: 11, color: "var(--crm-muted2)" }}>{p.assigned_name}</span>
            )}
            <span style={{ fontSize: 10, color: "#d1d5db" }}>
              {daysOld === 0 ? "today" : `${daysOld}d ago`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Create Project Modal ──────────────────────────────────────────────────
function CreateProjectModal({ sessionId, onClose, onCreated }: {
  sessionId: number;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [form, setForm] = useState({
    name: "", description: "", entityType: "customer" as "customer"|"company",
    entitySearch: "", entityId: 0, entityName: "",
    value: "", status: "active" as ProjectStatus,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.name.trim()) { setError("Project name is required"); return; }
    if (!form.entityId)    { setError("Select a customer or company"); return; }
    startTransition(async () => {
      const res = await createProject({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        entity_type: form.entityType,
        entity_id: form.entityId,
        value: form.value ? Number(form.value) : undefined,
        status: form.status,
      });
      if (res.ok && res.id) onCreated(res.id);
      else setError(res.error ?? "Failed to create project");
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20 }}>
      <div style={{ background: "var(--crm-surface)", borderRadius: 12, width: "100%", maxWidth: 520,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Modal header */}
        <div style={{ padding: "18px 24px", background: "#0d0d0d",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#f5c700", fontSize: 16, fontWeight: 800, margin: 0 }}>
            New Project
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none",
            color: "var(--crm-muted)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <p style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px",
              borderRadius: 6, fontSize: 12, fontWeight: 700, margin: 0 }}>⚠ {error}</p>
          )}

          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--crm-muted)",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Project Name *
            </label>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder="e.g. Q2 Safety Equipment Refresh"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                border: "1.5px solid #e5e5e5", outline: "none", boxSizing: "border-box" as const }} />
          </div>

          {/* Entity type + ID */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--crm-muted)",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Link To *
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {(["customer","company"] as const).map(t => (
                <button key={t} onClick={() => setForm(f=>({...f,entityType:t,entityId:0,entityName:""}))}
                  style={{ flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", border: "2px solid",
                    borderColor: form.entityType === t ? "#0d0d0d" : "#e5e5e5",
                    background: form.entityType === t ? "#0d0d0d" : "#fff",
                    color: form.entityType === t ? "#f5c700" : "#6b7280" }}>
                  {t === "customer" ? "👤 Customer" : "🏢 Company"}
                </button>
              ))}
            </div>
            <EntityPicker
              type={form.entityType}
              selectedId={form.entityId}
              selectedName={form.entityName}
              onSelect={(id, name) => setForm(f=>({...f,entityId:id,entityName:name}))}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--crm-muted)",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Description
            </label>
            <textarea value={form.description}
              onChange={e => setForm(f=>({...f,description:e.target.value}))}
              placeholder="Optional project description…"
              rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                border: "1.5px solid #e5e5e5", outline: "none", resize: "vertical",
                boxSizing: "border-box" as const }} />
          </div>

          {/* Value + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--crm-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Est. Value ($)
              </label>
              <input type="number" value={form.value}
                onChange={e => setForm(f=>({...f,value:e.target.value}))}
                placeholder="0"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                  border: "1.5px solid #e5e5e5", outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--crm-muted)",
                textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Status
              </label>
              <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as ProjectStatus}))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                  border: "1.5px solid #e5e5e5", outline: "none",
                  background: "var(--crm-surface)", boxSizing: "border-box" as const }}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 7,
              border: "1px solid var(--crm-border)", background: "var(--crm-surface)", color: "var(--crm-muted)",
              fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} style={{
              padding: "9px 22px", borderRadius: 7, border: "none",
              background: isPending ? "#9ca3af" : "#0d0d0d", color: "#f5c700",
              fontSize: 13, fontWeight: 800, cursor: isPending ? "not-allowed" : "pointer" }}>
              {isPending ? "Creating…" : "Create Project"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Entity picker (search customers/companies) ────────────────────────────
function EntityPicker({ type, selectedId, selectedName, onSelect }: {
  type: "customer" | "company";
  selectedId: number;
  selectedName: string;
  onSelect: (id: number, name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{id:number;name:string}[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(val: string) {
    setSearch(val);
    if (val.trim().length < 2) { setResults([]); return; }
    startTransition(async () => {
      const { globalCRMSearch } = await import("@/app/actions/crm-search");
      const res = await globalCRMSearch(val);
      setResults(
        res
          .filter(r => r.type === type)
          .map(r => ({ id: r.id, name: r.title }))
      );
      setOpen(true);
    });
  }

  if (selectedId) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", background: "#dcfce7", borderRadius: 7,
        border: "1.5px solid #22c55e" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d", flex: 1 }}>
          {type === "customer" ? "👤" : "🏢"} {selectedName}
        </span>
        <button onClick={() => onSelect(0, "")} style={{ background: "none",
          border: "none", color: "var(--crm-muted2)", cursor: "pointer", fontSize: 14 }}>✕</button>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={search} onChange={e => handleSearch(e.target.value)}
        placeholder={`Search ${type}s…`}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
          border: "1.5px solid #e5e5e5", outline: "none", boxSizing: "border-box" as const }} />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--crm-surface)", borderRadius: 8, border: "1px solid var(--crm-border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          {results.map(r => (
            <div key={r.id} onClick={() => { onSelect(r.id, r.name); setOpen(false); setSearch(""); }}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: "var(--crm-text)", borderBottom: "1px solid var(--crm-border2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9f9f9"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
              {type === "customer" ? "👤" : "🏢"} {r.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
