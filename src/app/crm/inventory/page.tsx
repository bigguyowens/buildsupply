import { query } from "@/lib/db";
import { InventoryClient } from "./inventory-client";

export default async function CRMInventoryPage() {
  const hubs = await query<{
    id: number; name: string; city: string; state: string; active: boolean;
    sku_count: number; total_units: number; out_of_stock: number; low_stock: number;
  }>(`
    SELECT dc.id, dc.name, dc.city, dc.state, dc.active,
           COUNT(hi.id)::int AS sku_count,
           COALESCE(SUM(hi.quantity),0)::int AS total_units,
           COUNT(hi.id) FILTER (WHERE hi.quantity = 0)::int AS out_of_stock,
           COUNT(hi.id) FILTER (WHERE hi.quantity > 0 AND hi.quantity <= 10)::int AS low_stock
    FROM distribution_centers dc
    LEFT JOIN hub_inventory hi ON hi.location_id = dc.id
    GROUP BY dc.id
    ORDER BY dc.sort_order ASC
  `);

  // Load inventory for all hubs with product details
  const rows = await query<{
    location_id: number; product_id: string; name: string;
    sku: string; category: string; quantity: number; price: number;
  }>(`
    SELECT hi.location_id, hi.product_id, p.name, p.sku, p.category,
           hi.quantity, p.price
    FROM hub_inventory hi
    JOIN products p ON p.id::text = hi.product_id
    ORDER BY hi.location_id, hi.quantity ASC, p.name ASC
  `);

  // Group by location
  const hubProducts: Record<number, typeof rows> = {};
  for (const row of rows) {
    if (!hubProducts[row.location_id]) hubProducts[row.location_id] = [];
    hubProducts[row.location_id].push(row);
  }

  const totalRevenue = hubs.reduce((s, h) => s + h.total_units, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          Inventory by Hub
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          {hubs.length} distribution centers · {totalRevenue.toLocaleString()} total units across all locations
        </p>
      </div>
      <InventoryClient hubs={hubs} hubProducts={hubProducts} />
    </div>
  );
}
