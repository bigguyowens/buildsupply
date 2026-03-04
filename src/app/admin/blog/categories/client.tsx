'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogCategory } from "@/app/actions/blog";
import { adminSaveBlogCategory, adminDeleteBlogCategory } from "@/app/actions/blog";

const inp: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--ad-muted)", display: "block", marginBottom: 4 };

const PRESET_COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f97316","#ef4444","#0ea5e9","#f59e0b","#ec4899","#14b8a6","#6366f1"];

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoryForm({ cat, onDone }: { cat?: BlogCategory; onDone: () => void }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [slugEdited, setSlugEdited] = useState(!!cat?.slug);
  const [form, setForm] = useState({
    name:        cat?.name        ?? "",
    slug:        cat?.slug        ?? "",
    description: cat?.description ?? "",
    color:       cat?.color       ?? "#f97316",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function handleName(v: string) {
    set("name", v);
    if (!slugEdited) set("slug", toSlug(v));
  }

  async function submit() {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    setBusy(true); setErr("");
    const r = await adminSaveBlogCategory({ id: cat?.id, ...form });
    setBusy(false);
    if (r.ok) { startTransition(() => router.refresh()); onDone(); }
    else setErr(r.error ?? "Error saving category.");
  }

  return (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      {err && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "8px 12px", color: "#dc2626", fontSize: 12 }}>{err}</div>}
      <div>
        <label style={lbl}>Name *</label>
        <input value={form.name} onChange={e => handleName(e.target.value)} placeholder="e.g. Press Releases" style={inp} />
      </div>
      <div>
        <label style={lbl}>Slug</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={form.slug} onChange={e => { setSlugEdited(true); set("slug", e.target.value); }} placeholder="auto-generated" style={{ ...inp, fontFamily: "monospace", fontSize: 12, flex: 1 }} />
          <button onClick={() => { set("slug", toSlug(form.name)); setSlugEdited(true); }} style={{ padding: "7px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--ad-muted)", whiteSpace: "nowrap" }}>Reset</button>
        </div>
      </div>
      <div>
        <label style={lbl}>Description</label>
        <input value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description" style={inp} />
      </div>
      <div>
        <label style={lbl}>Color</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => set("color", c)} style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #0f172a" : "2px solid transparent", cursor: "pointer", outline: "none" }} />
          ))}
          <input type="color" value={form.color} onChange={e => set("color", e.target.value)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0 }} />
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ad-muted)" }}>{form.color}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ padding: "3px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700, background: form.color, color: "white" }}>{form.name || "Preview"}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button onClick={onDone} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--ad-muted)" }}>Cancel</button>
        <button onClick={submit} disabled={busy} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "var(--color-accent)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {busy ? "Saving…" : cat ? "Save Changes" : "Create Category"}
        </button>
      </div>
    </div>
  );
}

export function AdminBlogCategoriesClient({ categories: initial }: { categories: BlogCategory[] }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [cats, setCats]     = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [delErr, setDelErr] = useState<Record<number, string>>({});

  function refresh() { startTransition(() => router.refresh()); }

  async function handleDelete(cat: BlogCategory) {
    if (!confirm(`Delete category "${cat.name}"? Posts in this category cannot be deleted while posts remain.`)) return;
    const r = await adminDeleteBlogCategory(cat.id);
    if (r.ok) { setCats(c => c.filter(x => x.id !== cat.id)); refresh(); }
    else setDelErr(e => ({ ...e, [cat.id]: r.error ?? "Cannot delete." }));
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/blog" style={{ color: "var(--ad-muted2)", textDecoration: "none", fontSize: 13 }}>← Blog Posts</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>Blog Categories</h1>
        </div>
        <button onClick={() => { setAdding(true); setEditing(null); }} style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + New Category
        </button>
      </div>

      {/* Add new form */}
      {adding && (
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, border: "2px solid var(--color-accent)", marginBottom: 16 }}>
          <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--ad-border)" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "var(--ad-text)" }}>New Category</p>
          </div>
          <CategoryForm onDone={() => { setAdding(false); refresh(); }} />
        </div>
      )}

      {/* Category list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cats.map(cat => (
          <div key={cat.id} style={{ background: "var(--ad-surface)", borderRadius: 10, border: "1px solid var(--ad-border)", overflow: "hidden" }}>
            {editing === cat.id ? (
              <>
                <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--ad-border)", background: "var(--ad-surface2)" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Editing: {cat.name}</p>
                </div>
                <CategoryForm cat={cat} onDone={() => { setEditing(null); refresh(); }} />
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ad-text)" }}>{cat.name}</span>
                    <span style={{ padding: "1px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700, background: cat.color, color: "white" }}>{cat.post_count ?? 0} posts</span>
                    <code style={{ fontSize: 11, background: "var(--ad-surface2)", padding: "1px 6px", borderRadius: 4, color: "var(--ad-muted)" }}>{cat.slug}</code>
                  </div>
                  {cat.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ad-muted2)" }}>{cat.description}</p>}
                  {delErr[cat.id] && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>{delErr[cat.id]}</p>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditing(cat.id); setAdding(false); }} style={{ padding: "5px 12px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--ad-text2)" }}>Edit</button>
                  <button onClick={() => handleDelete(cat)} style={{ padding: "5px 8px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
