'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/app/actions/blog";
import { adminSavePost } from "@/app/actions/blog";

const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", display: "block", marginBottom: 5 };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderPreview(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:800;margin:24px 0 8px;color:#0f172a">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:21px;font-weight:900;margin:32px 0 10px;color:#0f172a">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:900;margin:36px 0 12px;color:#0f172a">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/^- (.+)$/gm,   '<li style="margin:4px 0">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:24px;margin:12px 0">${s}</ul>`)
    .replace(/^(?!<[h|u|l]).+$/gm, p => p.trim() ? `<p style="margin:0 0 16px;line-height:1.8;color:#374151;font-size:15px">${p}</p>` : '')
    .replace(/\n{2,}/g, '');
}

export function BlogPostEditor({ categories, post }: { categories: BlogCategory[]; post?: BlogPost }) {
  const router = useRouter();
  const [tab, setTab]         = useState<"write" | "preview">("write");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState("");
  const [slugEdited, setSlugEdited] = useState(!!post?.slug);

  const [form, setForm] = useState({
    title:       post?.title       ?? "",
    slug:        post?.slug        ?? "",
    category_id: post?.category_id ?? (categories[0]?.id ?? 0),
    excerpt:     post?.excerpt     ?? "",
    body:        post?.body        ?? "",
    cover_image: post?.cover_image ?? "",
    author_name: post?.author_name ?? "BuildSupply Team",
    published:   post?.published   ?? false,
  });

  const set = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v }));

  function handleTitleChange(v: string) {
    set("title", v);
    if (!slugEdited) set("slug", toSlug(v));
  }

  async function save(publishNow?: boolean) {
    if (!form.title.trim())       { setError("Title is required."); return; }
    if (!form.category_id)        { setError("Please select a category."); return; }
    if (!form.excerpt.trim())     { setError("Excerpt is required."); return; }
    setBusy(true); setError("");

    const r = await adminSavePost({
      id:          post?.id,
      category_id: Number(form.category_id),
      title:       form.title.trim(),
      slug:        form.slug.trim(),
      excerpt:     form.excerpt.trim(),
      body:        form.body,
      cover_image: form.cover_image.trim(),
      author_name: form.author_name.trim() || "BuildSupply Team",
      published:   publishNow !== undefined ? publishNow : form.published,
    });
    setBusy(false);
    if (r.ok) router.push("/admin/blog");
    else setError(r.error ?? "Error saving post.");
  }

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/blog" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Posts</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0f172a" }}>{post ? "Edit Post" : "New Post"}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!form.published && (
            <button onClick={() => save(false)} disabled={busy} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #e2e8f0", background: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
              Save Draft
            </button>
          )}
          <button onClick={() => save(true)} disabled={busy} style={{ padding: "9px 20px", borderRadius: 7, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
            {busy ? "Saving…" : form.published ? "Save & Publish" : "Publish"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>

        {/* Main editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Title */}
          <div>
            <label style={lbl}>Title *</label>
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Enter post title…" style={{ ...inp, fontSize: 16, fontWeight: 700, padding: "10px 14px" }} />
          </div>

          {/* Slug */}
          <div>
            <label style={lbl}>Slug</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={form.slug} onChange={e => { setSlugEdited(true); set("slug", e.target.value); }} placeholder="auto-generated-from-title" style={{ ...inp, fontFamily: "monospace", fontSize: 12, flex: 1 }} />
              <button onClick={() => { set("slug", toSlug(form.title)); setSlugEdited(true); }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", color: "#64748b" }}>
                Reset
              </button>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label style={lbl}>Excerpt *</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={3} placeholder="Short summary shown on listing page and social shares…" style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {/* Body editor with tabs */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "0 12px" }}>
              <div style={{ display: "flex" }}>
                {(["write", "preview"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 16px", border: "none", background: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", color: tab === t ? "var(--color-accent)" : "#94a3b8", borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent", textTransform: "capitalize" }}>
                    {t === "write" ? "✏️ Write" : "👁 Preview"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{wordCount} words · Markdown supported</span>
            </div>

            {tab === "write" ? (
              <textarea
                value={form.body}
                onChange={e => set("body", e.target.value)}
                rows={20}
                placeholder={`Write your post in Markdown...\n\n## Use headings\n\nWrite paragraphs normally.\n\n**Bold** and *italic* work.\n\n- Bullet lists too`}
                style={{ ...inp, border: "none", borderRadius: 0, resize: "vertical", lineHeight: 1.7, fontFamily: "monospace", fontSize: 13, minHeight: 400 }}
              />
            ) : (
              <div style={{ padding: "20px 24px", minHeight: 400, background: "white" }}>
                {form.body.trim()
                  ? <div dangerouslySetInnerHTML={{ __html: renderPreview(form.body) }} />
                  : <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Nothing to preview yet — start writing!</p>
                }
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Status */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <label style={lbl}>Status</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <input type="checkbox" id="published" checked={form.published} onChange={e => set("published", e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
              <label htmlFor="published" style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", color: form.published ? "#15803d" : "#374151" }}>
                {form.published ? "✓ Published" : "Draft"}
              </label>
            </div>
            {post?.published_at && <p style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 0" }}>Published {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
          </div>

          {/* Category */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <label style={lbl}>Category *</label>
            <select value={form.category_id} onChange={e => set("category_id", Number(e.target.value))} style={{ ...inp, cursor: "pointer" }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Author */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <label style={lbl}>Author</label>
            <input value={form.author_name} onChange={e => set("author_name", e.target.value)} placeholder="BuildSupply Team" style={inp} />
          </div>

          {/* Cover image */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <label style={lbl}>Cover Image URL</label>
            <input value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="https://…" style={inp} />
            {form.cover_image && (
              <div style={{ marginTop: 8, borderRadius: 6, overflow: "hidden", height: 100, background: "#f1f5f9", position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_image} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", margin: "0 0 8px" }}>Markdown Tips</p>
            {[["# Heading 1", "## Heading 2"], ["**bold**", "*italic*"], ["- List item", ""]].map(([a, b], i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 5px", borderRadius: 3, color: "#374151" }}>{a}</code>
                {b && <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 5px", borderRadius: 3, color: "#374151" }}>{b}</code>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
