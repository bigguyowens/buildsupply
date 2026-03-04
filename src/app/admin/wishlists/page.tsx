import { query } from "@/lib/db";

export default async function AdminWishlistsPage() {
  const [topProducts, topLists, stats] = await Promise.all([
    query<{ product_id: string; name: string; brand: string; category: string; save_count: number; list_count: number }>(
      `SELECT wi.product_id, p.name, p.brand, p.category,
              COUNT(wi.id)::int AS save_count,
              COUNT(DISTINCT wi.wishlist_id)::int AS list_count
       FROM wishlist_items wi
       LEFT JOIN products p ON p.id::text = wi.product_id
       GROUP BY wi.product_id, p.name, p.brand, p.category
       ORDER BY save_count DESC LIMIT 20`
    ),
    query<{ name: string; item_count: number; owner: string }>(
      `SELECT w.name, COUNT(wi.id)::int AS item_count, u.first_name || ' ' || u.last_name AS owner
       FROM wishlists w
       LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
       JOIN users u ON u.id = w.user_id
       GROUP BY w.id, u.first_name, u.last_name
       ORDER BY item_count DESC LIMIT 10`
    ),
    query<{ total_lists: number; total_items: number; avg_items: number }>(
      `SELECT COUNT(DISTINCT w.id)::int AS total_lists,
              COUNT(wi.id)::int AS total_items,
              ROUND(COUNT(wi.id)::numeric / NULLIF(COUNT(DISTINCT w.id), 0), 1) AS avg_items
       FROM wishlists w LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id`
    ),
  ]);

  const s = stats[0] ?? { total_lists: 0, total_items: 0, avg_items: 0 };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Wishlist Insights</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>See what customers are saving</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Lists",    value: s.total_lists,  color: "#8b5cf6" },
          { label: "Total Saves",    value: s.total_items,  color: "#3b82f6" },
          { label: "Avg Items/List", value: Number(s.avg_items).toFixed(1), color: "#10b981" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "var(--ad-surface)", borderRadius: 10, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderLeft: `4px solid ${stat.color}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ad-muted2)", margin: "0 0 8px" }}>{stat.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

        {/* Most wishlisted products */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Most Wishlisted Products</h2>
          </div>
          {topProducts.length === 0 ? (
            <p style={{ padding: "32px", textAlign: "center", color: "var(--ad-muted2)" }}>No wishlist data yet</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--ad-surface2)" }}>
                  {["#", "Product", "Category", "Saves", "Lists"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ad-muted2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_id} style={{ borderTop: "1px solid var(--ad-border2)", background: i < 3 ? "#fffbf7" : "white" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 800, color: i === 0 ? "#f97316" : i === 1 ? "#64748b" : "#94a3b8", fontSize: i < 3 ? 15 : 13 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontWeight: 600, margin: 0, color: "var(--ad-text)" }}>{p.name ?? `Product ${p.product_id}`}</p>
                      <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "2px 0 0" }}>{p.brand}</p>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ad-muted)" }}>{p.category}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--ad-surface2)", width: 80, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 3, background: "#f97316", width: `${Math.min(100, (p.save_count / (topProducts[0]?.save_count || 1)) * 100)}%` }} />
                        </div>
                        <span style={{ fontWeight: 700 }}>{p.save_count}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--ad-muted)", fontWeight: 600 }}>{p.list_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Biggest lists */}
        <div style={{ background: "var(--ad-surface)", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", alignSelf: "start" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--ad-border2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Largest Lists</h2>
          </div>
          {topLists.length === 0 ? (
            <p style={{ padding: "32px 20px", textAlign: "center", color: "var(--ad-muted2)" }}>No lists yet</p>
          ) : topLists.map((list, i) => (
            <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{list.name}</p>
                <p style={{ fontSize: 11, color: "var(--ad-muted2)", margin: "2px 0 0" }}>{list.owner}</p>
              </div>
              <span style={{ padding: "2px 10px", borderRadius: 9999, background: "var(--ad-surface2)", fontSize: 12, fontWeight: 700, color: "var(--ad-text2)", flexShrink: 0 }}>
                {list.item_count} items
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
