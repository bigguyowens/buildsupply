'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/app/actions/blog";
import { adminTogglePublished, adminDeletePost } from "@/app/actions/blog";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function AdminBlogClient({ posts: initial, categories }: { posts: BlogPost[]; categories: BlogCategory[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [posts, setPosts]   = useState(initial);
  const [filter, setFilter] = useState<string>("all");

  function refresh() { startTransition(() => router.refresh()); }

  async function handleToggle(id: number, published: boolean) {
    setPosts(p => p.map(x => x.id === id ? { ...x, published } : x));
    await adminTogglePublished(id, published);
    refresh();
  }

  async function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    await adminDeletePost(post.id);
    setPosts(p => p.filter(x => x.id !== post.id));
    refresh();
  }

  const visible = filter === "all" ? posts : posts.filter(p =>
    filter === "published" ? p.published : filter === "draft" ? !p.published : p.category_slug === filter
  );

  const published = posts.filter(p => p.published).length;
  const drafts    = posts.filter(p => !p.published).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ad-muted2)", margin: "0 0 4px" }}>Admin</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>Blog Posts</h1>
          <p style={{ color: "var(--ad-muted)", fontSize: 13, margin: 0 }}>Manage news, press releases, and team updates</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link href="/admin/blog/categories" style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", color: "var(--ad-text2)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Manage Categories
          </Link>
          <Link href="/admin/blog/new" style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 7, border: "none", background: "var(--color-accent)", color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Posts",  value: posts.length },
          { label: "Published",    value: published    },
          { label: "Drafts",       value: drafts       },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--ad-surface)", borderRadius: 8, padding: "16px 20px", border: "1px solid var(--ad-border)" }}>
            <p style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "var(--ad-text)" }}>{s.value}</p>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ad-muted2)", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { key: "all", label: "All" },
          { key: "published", label: "Published" },
          { key: "draft", label: "Drafts" },
          ...categories.map(c => ({ key: c.slug, label: c.name })),
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, border: "1px solid", borderColor: filter === f.key ? "var(--color-accent)" : "#e2e8f0", background: filter === f.key ? "var(--color-accent)" : "white", color: filter === f.key ? "white" : "#64748b", cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--ad-surface)", borderRadius: 10, border: "1px solid var(--ad-border)", overflow: "hidden" }}>
        {visible.length === 0 ? (
          <p style={{ padding: "48px", textAlign: "center", color: "var(--ad-muted2)", fontSize: 14 }}>No posts found. Create your first one!</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--ad-surface2)" }}>
                {["Title", "Category", "Author", "Date", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-muted2)", borderBottom: "1px solid var(--ad-border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(post => (
                <tr key={post.id} style={{ borderTop: "1px solid var(--ad-border2)" }}>
                  <td style={{ padding: "13px 16px", maxWidth: 280 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "var(--ad-text)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                    {post.excerpt && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ad-muted2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.excerpt}</p>}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: post.category_color ?? "#f97316", color: "white" }}>{post.category_name}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "var(--ad-muted)" }}>{post.author_name}</td>
                  <td style={{ padding: "13px 16px", color: "var(--ad-muted)", whiteSpace: "nowrap" }}>{fmt(post.published_at ?? post.created_at)}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: post.published ? "#dcfce7" : "#f1f5f9", color: post.published ? "#15803d" : "#94a3b8" }}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/admin/blog/${post.id}`} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, color: "var(--ad-text2)", textDecoration: "none" }}>Edit</Link>
                      <button onClick={() => handleToggle(post.id, !post.published)} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: post.published ? "#64748b" : "#15803d" }}>
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      {post.published && (
                        <Link href={`/blog/${post.slug}`} target="_blank" style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, color: "var(--color-accent)", textDecoration: "none" }}>View ↗</Link>
                      )}
                      <button onClick={() => handleDelete(post)} style={{ padding: "5px 8px", borderRadius: 5, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
