'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory, AdminSubcategory } from "@/app/actions/categories";
import {
  updateCategory, addCategory, deleteCategory,
  getSubcategoriesForCategory, addSubcategory, updateSubcategory, deleteSubcategory,
} from "@/app/actions/categories";

// ── Reusable label style ──────────────────────────────────
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", display: "block", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" };

// ── Sub row ───────────────────────────────────────────────
function SubRow({ sub, onSaved, onDeleted }: { sub: AdminSubcategory; onSaved: () => void; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(sub.name);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState("");

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await updateSubcategory(sub.id, name);
    setBusy(false);
    if (r.ok) { setEditing(false); onSaved(); }
    else setErr(r.error ?? "Error");
  }

  async function remove() {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    setBusy(true);
    await deleteSubcategory(sub.id);
    onDeleted();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
      {editing ? (
        <>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && save()}
            style={{ ...inp, flex: 1, padding: "5px 10px" }} autoFocus />
          <button onClick={save} disabled={busy} style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: "var(--color-accent)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
          <button onClick={() => { setEditing(false); setName(sub.name); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #e2e8f0", background: "white", fontSize: 12, cursor: "pointer", color: "#64748b" }}>Cancel</button>
          {err && <span style={{ color: "#ef4444", fontSize: 12 }}>{err}</span>}
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: 13, color: "#374151" }}>{sub.name}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{sub.slug}</span>
          <button onClick={() => setEditing(true)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e2e8f0", background: "white", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#374151" }}>Edit</button>
          <button onClick={remove} disabled={busy} style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#ef4444" }}>✕</button>
        </>
      )}
    </div>
  );
}

// ── Add subcategory inline form ───────────────────────────
function AddSubForm({ categoryId, onAdded }: { categoryId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await addSubcategory(categoryId, name);
    setBusy(false);
    if (r.ok) { setName(""); setOpen(false); onAdded(); }
    else setErr(r.error ?? "Error");
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 6, border: "1px dashed #d1d5db", background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
      + Add Subcategory
    </button>
  );

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="Subcategory name" autoFocus
        style={{ ...inp, flex: 1, padding: "7px 12px" }} />
      <button onClick={submit} disabled={busy} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
      <button onClick={() => { setOpen(false); setName(""); }} style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
      {err && <span style={{ color: "#ef4444", fontSize: 12 }}>{err}</span>}
    </div>
  );
}

// ── Category row ──────────────────────────────────────────
function CategoryRow({ cat, onRefresh }: { cat: AdminCategory; onRefresh: () => void }) {
  const [open, setOpen]     = useState(false);
  const [subs, setSubs]     = useState<AdminSubcategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName]         = useState(cat.name);
  const [slug, setSlug]         = useState(cat.slug);
  const [desc, setDesc]         = useState(cat.description ?? "");
  const [image, setImage]       = useState(cat.image ?? "");
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");
  const [saveOk, setSaveOk]     = useState(false);

  async function expand() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoadingSubs(true);
    const data = await getSubcategoriesForCategory(cat.id);
    setSubs(data);
    setLoadingSubs(false);
  }

  async function reloadSubs() {
    const data = await getSubcategoriesForCategory(cat.id);
    setSubs(data);
    onRefresh();
  }

  async function save() {
    if (!name.trim() || !slug.trim()) return;
    setBusy(true); setErr(""); setSaveOk(false);
    const r = await updateCategory(cat.id, { name, slug, description: desc, image });
    setBusy(false);
    if (r.ok) { setSaveOk(true); setEditing(false); onRefresh(); setTimeout(() => setSaveOk(false), 2000); }
    else setErr(r.error ?? "Error");
  }

  async function remove() {
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    await deleteCategory(cat.id);
    onRefresh();
  }

  function autoSlug(val: string) {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"));
  }

  return (
    <div style={{ background: "white", borderRadius: 8, border: `1px solid ${open ? "#e2e8f0" : "#e2e8f0"}`, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

      {/* Row header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
        <button onClick={expand} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#94a3b8", display: "flex", flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth={2.5}
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 4 4-4" />
          </svg>
        </button>

        <button onClick={expand} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{cat.name}</span>
            <span style={{ fontSize: 11, color: "#94a3b8", background: "#f8fafc", padding: "2px 8px", borderRadius: 4, border: "1px solid #e2e8f0" }}>{cat.slug}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{cat.productCount} products</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{cat.subCount} subcategories</span>
            {cat.description && <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>{cat.description.slice(0, 60)}{cat.description.length > 60 ? "…" : ""}</span>}
          </div>
        </button>

        {saveOk && <span style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>✓ Saved</span>}

        <button onClick={() => { setEditing(e => !e); setOpen(true); if (!open) { setLoadingSubs(true); getSubcategoriesForCategory(cat.id).then(d => { setSubs(d); setLoadingSubs(false); }); } }}
          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0", background: editing ? "#fff7ed" : "white", color: editing ? "var(--color-accent)" : "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          {editing ? "Cancel Edit" : "Edit"}
        </button>
        <button onClick={remove} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Delete</button>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Edit form */}
          {editing && (
            <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>Edit Category</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Name</label>
                  <input value={name} onChange={e => autoSlug(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                  style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Image URL</label>
                <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." style={inp} />
              </div>
              {err && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 10px" }}>{err}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={save} disabled={busy} style={{ padding: "8px 22px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {busy ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Subcategories */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", margin: "0 0 10px" }}>Subcategories</p>
            {loadingSubs ? (
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Loading…</p>
            ) : subs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No subcategories yet.</p>
            ) : (
              <div>
                {subs.map(sub => (
                  <SubRow key={sub.id} sub={sub} onSaved={reloadSubs} onDeleted={reloadSubs} />
                ))}
              </div>
            )}
            <AddSubForm categoryId={cat.id} onAdded={reloadSubs} />
          </div>

        </div>
      )}
    </div>
  );
}

// ── Add category drawer ───────────────────────────────────
function AddCategoryDrawer({ onAdded, onClose }: { onAdded: () => void; onClose: () => void }) {
  const [name, setName]   = useState("");
  const [slug, setSlug]   = useState("");
  const [desc, setDesc]   = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  function autoSlug(val: string) {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-"));
  }

  async function submit() {
    if (!name.trim() || !slug.trim()) { setErr("Name and slug are required"); return; }
    setBusy(true); setErr("");
    const r = await addCategory({ name, slug, description: desc, image });
    setBusy(false);
    if (r.ok) { onAdded(); onClose(); }
    else setErr(r.error ?? "Error");
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, maxWidth: "95vw", background: "white", zIndex: 201, boxShadow: "-4px 0 32px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>New Category</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Name *</label>
            <input value={name} onChange={e => autoSlug(e.target.value)} placeholder="e.g. Power Tools" style={inp} />
          </div>
          <div>
            <label style={lbl}>Slug *</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. power-tools" style={inp} />
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Auto-generated from name. Used in URLs.</p>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Short description shown on category page…" style={{ ...inp, resize: "vertical" }} />
          </div>
          <div>
            <label style={lbl}>Image URL</label>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="https://…" style={inp} />
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{err}</p>}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
          <button onClick={submit} disabled={busy} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "var(--color-accent)", color: "white", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Creating…" : "Create Category"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main client ───────────────────────────────────────────
export function CategoriesAdminClient({ categories: initial }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [categories, setCategories] = useState(initial);
  const [addOpen, setAddOpen]       = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0 0 4px" }}>Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>Categories</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{categories.length} categories · click a row to expand subcategories</p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 7, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Category
        </button>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {categories.map(cat => (
          <CategoryRow key={cat.id} cat={cat} onRefresh={refresh} />
        ))}
      </div>

      {/* Add drawer */}
      {addOpen && <AddCategoryDrawer onAdded={refresh} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
