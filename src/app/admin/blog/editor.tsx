'use client';

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BlogPost, BlogCategory } from "@/app/actions/blog";
import { adminSavePost } from "@/app/actions/blog";

const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ad-muted)", display: "block", marginBottom: 5 };

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
    .replace(/`(.+?)`/g,     '<code style="font-family:monospace;background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:0.9em">$1</code>')
    .replace(/^> (.+)$/gm,   '<blockquote style="border-left:3px solid #e2e8f0;margin:12px 0;padding:8px 16px;color:#64748b;font-style:italic">$1</blockquote>')
    .replace(/^---$/gm,      '<hr style="border:none;border-top:2px solid #e2e8f0;margin:24px 0"/>')
    .replace(/^- (.+)$/gm,   '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$2</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:24px;margin:12px 0">${s}</ul>`)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#f97316;text-decoration:underline">$1</a>')
    .replace(/^(?!<[h|u|b|h|a]).+$/gm, p => p.trim() ? `<p style="margin:0 0 16px;line-height:1.8;color:#374151;font-size:15px">${p}</p>` : '')
    .replace(/\n{2,}/g, '');
}

// ── Toolbar ───────────────────────────────────────────────────────────────

type FormatAction =
  | { type: "wrap";   syntax: string; placeholder: string }
  | { type: "prefix"; syntax: string }
  | { type: "insert"; text: string }
  | { type: "link" }
  | { type: "image" };

const TOOLBAR_GROUPS: { label?: string; items: { icon: string; title: string; action: FormatAction; active?: string }[] }[] = [
  {
    items: [
      { icon: "H1", title: "Heading 1", action: { type: "prefix", syntax: "# " },   active: "^# " },
      { icon: "H2", title: "Heading 2", action: { type: "prefix", syntax: "## " },  active: "^## " },
      { icon: "H3", title: "Heading 3", action: { type: "prefix", syntax: "### " }, active: "^### " },
    ],
  },
  {
    items: [
      { icon: "B",  title: "Bold",          action: { type: "wrap",   syntax: "**", placeholder: "bold text" } },
      { icon: "I",  title: "Italic",        action: { type: "wrap",   syntax: "*",  placeholder: "italic text" } },
      { icon: "<>", title: "Inline Code",   action: { type: "wrap",   syntax: "`",  placeholder: "code" } },
    ],
  },
  {
    items: [
      { icon: "≡", title: "Bullet List",   action: { type: "prefix", syntax: "- " } },
      { icon: "1.", title: "Numbered List", action: { type: "prefix", syntax: "1. " } },
      { icon: "❝",  title: "Blockquote",   action: { type: "prefix", syntax: "> " } },
    ],
  },
  {
    items: [
      { icon: "🔗", title: "Link",          action: { type: "link" } },
      { icon: "—",  title: "Divider",       action: { type: "insert", text: "\n\n---\n\n" } },
    ],
  },
];

function ToolbarButton({ icon, title, onClick, isActive }: { icon: string; title: string; onClick: () => void; isActive?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: "4px 7px",
        minWidth: 28,
        borderRadius: 4,
        border: isActive ? "1px solid #cbd5e1" : "1px solid transparent",
        background: isActive ? "#f1f5f9" : "transparent",
        fontSize: icon.length > 1 ? 10 : 13,
        fontWeight: 800,
        fontFamily: ["B","I"].includes(icon) ? "Georgia, serif" : "inherit",
        fontStyle: icon === "I" ? "italic" : "normal",
        color: "var(--ad-text2)",
        cursor: "pointer",
        lineHeight: 1,
        transition: "all 0.1s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {icon}
    </button>
  );
}

function RichToolbar({ onFormat, value }: {
  onFormat: (action: FormatAction) => void;
  value: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px 10px", background: "var(--ad-surface2)", borderBottom: "1px solid var(--ad-border)", flexWrap: "wrap" }}>
      {TOOLBAR_GROUPS.map((group, gi) => (
        <div key={gi} style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {gi > 0 && <div style={{ width: 1, height: 18, background: "#e2e8f0", margin: "0 4px" }} />}
          {group.items.map(item => (
            <ToolbarButton
              key={item.title}
              icon={item.icon}
              title={item.title}
              onClick={() => onFormat(item.action)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Editor component ──────────────────────────────────────────────────────

function BodyEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkText,   setLinkText]   = useState("");
  const [linkHref,   setLinkHref]   = useState("");
  // Save selection before prompt steals focus
  const savedSel = useRef<{ start: number; end: number } | null>(null);

  const applyFormat = useCallback((action: FormatAction) => {
    const ta = ref.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = value.slice(start, end);
    const before = value.slice(0, start);
    const after  = value.slice(end);

    if (action.type === "link") {
      savedSel.current = { start, end };
      setLinkText(sel || "");
      setLinkHref("https://");
      setLinkPrompt(true);
      return;
    }

    if (action.type === "image") {
      savedSel.current = { start, end };
      setLinkText(sel || "image description");
      setLinkHref("https://");
      setLinkPrompt(true);
      return;
    }

    let newVal = value;
    let cursor = start;

    if (action.type === "wrap") {
      const { syntax, placeholder } = action;
      const inner = sel || placeholder;
      // Toggle: if already wrapped, unwrap
      const already = sel.startsWith(syntax) && sel.endsWith(syntax) && sel.length > syntax.length * 2;
      if (already) {
        const unwrapped = sel.slice(syntax.length, -syntax.length);
        newVal = before + unwrapped + after;
        cursor = start + unwrapped.length;
      } else {
        newVal = before + syntax + inner + syntax + after;
        cursor = start + syntax.length + inner.length + syntax.length;
      }
    }

    if (action.type === "prefix") {
      // Find start of line
      const lineStart = before.lastIndexOf("\n") + 1;
      const lineBefore = value.slice(0, lineStart);
      const lineContent = value.slice(lineStart);
      const lineEnd = lineContent.indexOf("\n");
      const currentLine = lineEnd === -1 ? lineContent : lineContent.slice(0, lineEnd);
      const rest = lineEnd === -1 ? "" : lineContent.slice(lineEnd);
      const { syntax } = action;
      // Toggle: if line already has this prefix, remove it
      if (currentLine.startsWith(syntax)) {
        const stripped = currentLine.slice(syntax.length);
        newVal = lineBefore + stripped + rest;
        cursor = lineStart + stripped.length;
      } else {
        // Replace any other prefix (h1/h2/h3/ul/ol/blockquote) if present
        const cleaned = currentLine.replace(/^(#{1,3} |[>] |- |\d+\. )/, "");
        newVal = lineBefore + syntax + cleaned + rest;
        cursor = lineStart + syntax.length + cleaned.length;
      }
    }

    if (action.type === "insert") {
      newVal = before + action.text + after;
      cursor = start + action.text.length;
    }

    onChange(newVal);
    // Restore focus and cursor after React re-render
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  }, [value, onChange]);

  function insertLink() {
    const ta = ref.current;
    const md = `[${linkText || linkHref}](${linkHref})`;
    if (savedSel.current && ta) {
      const { start, end } = savedSel.current;
      const newVal = value.slice(0, start) + md + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + md.length, start + md.length);
      });
    }
    setLinkPrompt(false);
    setLinkText(""); setLinkHref("");
    savedSel.current = null;
  }

  // Tab key → insert 2 spaces instead of leaving field
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart, end = ta.selectionEnd;
      const newVal = value.slice(0, s) + "  " + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
  }

  return (
    <div>
      <RichToolbar onFormat={applyFormat} value={value} />

      {/* Link prompt */}
      {linkPrompt && (
        <div style={{ padding: "10px 14px", background: "#fffbeb", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap" }}>Insert Link</span>
          <input
            autoFocus
            value={linkText}
            onChange={e => setLinkText(e.target.value)}
            placeholder="Link text"
            style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #fcd34d", fontSize: 12, width: 140, outline: "none" }}
          />
          <input
            value={linkHref}
            onChange={e => setLinkHref(e.target.value)}
            placeholder="https://…"
            onKeyDown={e => e.key === "Enter" && insertLink()}
            style={{ padding: "5px 9px", borderRadius: 5, border: "1px solid #fcd34d", fontSize: 12, flex: 1, minWidth: 160, outline: "none" }}
          />
          <button onClick={insertLink} style={{ padding: "5px 12px", borderRadius: 5, border: "none", background: "#f59e0b", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Insert</button>
          <button onClick={() => { setLinkPrompt(false); ref.current?.focus(); }} style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 12, cursor: "pointer", color: "var(--ad-muted)" }}>Cancel</button>
        </div>
      )}

      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={22}
        placeholder={"Start writing your post...\n\nTip: use the toolbar above or type Markdown directly.\n\n## Add a heading\n\nWrite paragraphs normally.\n\n**Bold**, *italic*, and `code` all work inline."}
        style={{
          width: "100%", display: "block", padding: "16px 18px",
          border: "none", borderRadius: 0, resize: "vertical",
          lineHeight: 1.8, fontFamily: "monospace", fontSize: 13,
          minHeight: 420, outline: "none", boxSizing: "border-box",
          background: "var(--ad-surface)", color: "var(--ad-text)",
        }}
      />
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────

export function BlogPostEditor({ categories, post }: { categories: BlogCategory[]; post?: BlogPost }) {
  const router = useRouter();
  const [tab, setTab]               = useState<"write" | "preview">("write");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState("");
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
    if (!form.title.trim())   { setError("Title is required."); return; }
    if (!form.category_id)    { setError("Please select a category."); return; }
    if (!form.excerpt.trim()) { setError("Excerpt is required."); return; }
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
  const readMins  = Math.max(1, Math.round(wordCount / 200));

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1060 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/blog" style={{ color: "var(--ad-muted2)", textDecoration: "none", fontSize: 13 }}>← Posts</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>{post ? "Edit Post" : "New Post"}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!form.published && (
            <button onClick={() => save(false)} disabled={busy} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "var(--ad-text2)" }}>
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

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div>
            <label style={lbl}>Title *</label>
            <input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Enter post title…" style={{ ...inp, fontSize: 16, fontWeight: 700, padding: "10px 14px" }} />
          </div>

          <div>
            <label style={lbl}>Slug</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={form.slug} onChange={e => { setSlugEdited(true); set("slug", e.target.value); }} placeholder="auto-generated-from-title" style={{ ...inp, fontFamily: "monospace", fontSize: 12, flex: 1 }} />
              <button onClick={() => { set("slug", toSlug(form.title)); setSlugEdited(true); }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--ad-border)", background: "var(--ad-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", color: "var(--ad-muted)" }}>Reset</button>
            </div>
          </div>

          <div>
            <label style={lbl}>Excerpt *</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={3} placeholder="Short summary shown on listing page and social shares…" style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {/* Body editor */}
          <div style={{ border: "1px solid var(--ad-border)", borderRadius: 8, overflow: "hidden" }}>
            {/* Tab bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--ad-surface2)", borderBottom: "1px solid var(--ad-border)", padding: "0 12px" }}>
              <div style={{ display: "flex" }}>
                {(["write", "preview"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 16px", border: "none", background: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", color: tab === t ? "var(--color-accent)" : "#94a3b8", borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent" }}>
                    {t === "write" ? "✏️ Write" : "👁 Preview"}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--ad-muted2)" }}>{wordCount} words · ~{readMins} min read</span>
            </div>

            {tab === "write" ? (
              <BodyEditor value={form.body} onChange={v => set("body", v)} />
            ) : (
              <div style={{ padding: "24px 28px", minHeight: 420, background: "var(--ad-surface)" }}>
                {form.body.trim()
                  ? <div dangerouslySetInnerHTML={{ __html: renderPreview(form.body) }} />
                  : <p style={{ color: "var(--ad-muted2)", fontStyle: "italic" }}>Nothing to preview yet — start writing!</p>
                }
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ background: "var(--ad-surface)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: 16 }}>
            <label style={lbl}>Status</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "var(--ad-surface2)", borderRadius: 6, border: "1px solid var(--ad-border)" }}>
              <input type="checkbox" id="published" checked={form.published} onChange={e => set("published", e.target.checked)} style={{ width: 16, height: 16, accentColor: "var(--color-accent)", cursor: "pointer" }} />
              <label htmlFor="published" style={{ fontSize: 13, fontWeight: 700, cursor: "pointer", color: form.published ? "#15803d" : "#374151" }}>
                {form.published ? "✓ Published" : "Draft"}
              </label>
            </div>
            {post?.published_at && <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "8px 0 0" }}>Published {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
          </div>

          <div style={{ background: "var(--ad-surface)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: 16 }}>
            <label style={lbl}>Category *</label>
            <select value={form.category_id} onChange={e => set("category_id", Number(e.target.value))} style={{ ...inp, cursor: "pointer" }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ background: "var(--ad-surface)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: 16 }}>
            <label style={lbl}>Author</label>
            <input value={form.author_name} onChange={e => set("author_name", e.target.value)} placeholder="BuildSupply Team" style={inp} />
          </div>

          <div style={{ background: "var(--ad-surface)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: 16 }}>
            <label style={lbl}>Cover Image URL</label>
            <input value={form.cover_image} onChange={e => set("cover_image", e.target.value)} placeholder="https://…" style={inp} />
            {form.cover_image && (
              <div style={{ marginTop: 8, borderRadius: 6, overflow: "hidden", height: 100, background: "var(--ad-surface2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover_image} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => (e.currentTarget.style.display = "none")} />
              </div>
            )}
          </div>

          {/* Keyboard shortcuts reference */}
          <div style={{ background: "var(--ad-surface2)", borderRadius: 8, border: "1px solid var(--ad-border)", padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ad-muted2)", margin: "0 0 10px" }}>Toolbar Reference</p>
            {[
              ["H1 / H2 / H3", "Headings"],
              ["B",            "Bold"],
              ["I",            "Italic"],
              ["<>",           "Inline code"],
              ["≡ / 1.",       "Lists"],
              ["❝",            "Blockquote"],
              ["🔗",           "Link"],
              ["—",            "Divider"],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3, color: "var(--ad-text2)", fontWeight: 700 }}>{key}</code>
                <span style={{ color: "var(--ad-muted)" }}>{desc}</span>
              </div>
            ))}
            <p style={{ fontSize: 10, color: "var(--ad-muted2)", margin: "8px 0 0" }}>Tip: select text first, then click a button to wrap it. Click again to unwrap.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
