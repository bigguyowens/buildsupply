import Link from "next/link";
import Image from "next/image";
import { getBlogCategories, getPublishedPosts } from "@/app/actions/blog";
import type { BlogPost, BlogCategory } from "@/app/actions/blog";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "white", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.15s" }}>
      {/* Cover image */}
      <div style={{ position: "relative", height: 180, background: "#f1f5f9", flexShrink: 0 }}>
        {post.cover_image ? (
          <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover" }} sizes="400px" />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" />
            </svg>
          </div>
        )}
        {/* Category badge */}
        <span style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: post.category_color ?? "#f97316", color: "white" }}>
          {post.category_name}
        </span>
      </div>
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.35 }}>{post.title}</h3>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{post.author_name} · {fmt(post.published_at ?? post.created_at)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent)" }}>Read →</span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "grid", gridTemplateColumns: "1fr 1fr", background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }} className="featured-card">
      <div style={{ position: "relative", minHeight: 260, background: "#f1f5f9" }}>
        {post.cover_image ? (
          <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: "cover" }} sizes="600px" />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 64 }}>📰</span>
          </div>
        )}
        <span style={{ position: "absolute", top: 14, left: 14, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontWeight: 700, background: post.category_color ?? "#f97316", color: "white" }}>
          {post.category_name}
        </span>
      </div>
      <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", margin: "0 0 10px" }}>Featured</p>
        <h2 style={{ fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 900, color: "#0f172a", margin: "0 0 12px", lineHeight: 1.25 }}>{post.title}</h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: "0 0 20px" }}>{post.excerpt}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{post.author_name} · {fmt(post.published_at ?? post.created_at)}</span>
        </div>
        <span style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--color-accent)" }}>Read full story →</span>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: catFilter } = await searchParams;
  const [categories, posts] = await Promise.all([
    getBlogCategories(),
    getPublishedPosts(catFilter),
  ]);

  const featured = !catFilter ? posts[0] : null;
  const rest     = !catFilter ? posts.slice(1) : posts;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>

      {/* Hero */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-accent)", margin: "0 0 8px" }}>BuildSupply</p>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", margin: "0 0 10px", lineHeight: 1.1 }}>News & Updates</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: 0 }}>Press releases, industry news, team wins, and more.</p>
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 24px" }}>

        {/* Category filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <Link href="/blog" style={{ padding: "6px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", background: !catFilter ? "var(--color-accent)" : "white", color: !catFilter ? "white" : "#64748b", border: "1px solid", borderColor: !catFilter ? "var(--color-accent)" : "#e2e8f0" }}>
            All Posts
          </Link>
          {(categories as BlogCategory[]).map(cat => (
            <Link key={cat.slug} href={`/blog?category=${cat.slug}`} style={{ padding: "6px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 700, textDecoration: "none", background: catFilter === cat.slug ? cat.color : "white", color: catFilter === cat.slug ? "white" : "#64748b", border: "1px solid", borderColor: catFilter === cat.slug ? cat.color : "#e2e8f0" }}>
              {cat.name}
              {(cat.post_count ?? 0) > 0 && <span style={{ marginLeft: 5, opacity: 0.7 }}>({cat.post_count})</span>}
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No posts yet</p>
            <p style={{ fontSize: 14, margin: 0 }}>Check back soon.</p>
          </div>
        )}

        {/* Featured post */}
        {featured && (
          <div style={{ marginBottom: 36 }}>
            <FeaturedCard post={featured} />
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {rest.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}

      </main>
    </div>
  );
}
