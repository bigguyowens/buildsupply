import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/app/actions/blog";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Simple markdown → HTML renderer (headings, bold, italic, paragraphs, lists)
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:800;margin:28px 0 10px;color:#0f172a">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:21px;font-weight:900;margin:36px 0 12px;color:#0f172a">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:900;margin:40px 0 14px;color:#0f172a">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/^- (.+)$/gm,   '<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, s => `<ul style="padding-left:24px;margin:12px 0">${s}</ul>`)
    .replace(/^(?!<[h|u|l]).+$/gm, p => p.trim() ? `<p style="margin:0 0 18px;line-height:1.8;color:#374151;font-size:15px">${p}</p>` : '')
    .replace(/\n{2,}/g, '');
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, related] = await Promise.all([
    getPostBySlug(slug),
    getPublishedPosts(undefined, 4),
  ]);
  if (!post) notFound();

  const relatedPosts = related.filter(p => p.slug !== slug).slice(0, 3);
  const html = renderMarkdown(post.body);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Hero */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Link href="/blog" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 13 }}>← News & Updates</Link>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <Link href={`/blog?category=${post.category_slug}`} style={{ padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: post.category_color ?? "#f97316", color: "white", textDecoration: "none" }}>
              {post.category_name}
            </Link>
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 900, color: "white", margin: "0 0 14px", lineHeight: 1.2 }}>{post.title}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            By {post.author_name} · {fmt(post.published_at ?? post.created_at)}
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px" }}>

        {/* Cover image */}
        {post.cover_image && (
          <div style={{ position: "relative", height: 360, borderRadius: 10, overflow: "hidden", marginBottom: 36, border: "1px solid #e2e8f0" }}>
            <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover" }} sizes="860px" priority />
          </div>
        )}

        {/* Excerpt */}
        <p style={{ fontSize: 17, fontWeight: 500, color: "#475569", lineHeight: 1.75, margin: "0 0 28px", borderLeft: "3px solid var(--color-accent)", paddingLeft: 16 }}>
          {post.excerpt}
        </p>

        {/* Body */}
        <article
          style={{ fontSize: 15, lineHeight: 1.8, color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Footer meta */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
              {post.author_name[0]}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{post.author_name}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{fmt(post.published_at ?? post.created_at)}</p>
            </div>
          </div>
          <Link href={`/blog?category=${post.category_slug}`} style={{ padding: "6px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textDecoration: "none", background: post.category_color ?? "#f97316", color: "white" }}>
            {post.category_name}
          </Link>
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 18px", color: "#0f172a" }}>More from BuildSupply</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {relatedPosts.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none", background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px", display: "block" }}>
                  <span style={{ display: "inline-block", marginBottom: 6, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700, background: p.category_color ?? "#f97316", color: "white" }}>{p.category_name}</span>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#0f172a", lineHeight: 1.35 }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{fmt(p.published_at ?? p.created_at)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
