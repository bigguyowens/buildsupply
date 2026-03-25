import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { WishlistPageClient } from "@/components/wishlist-page-client";

type WishlistItem = {
  wishlist_item_id: number;
  product_id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  currency: string;
  brand: string;
  sku: string;
  unit: string;
  inventory: number;
};

type WishlistWithItems = {
  id: number;
  name: string;
  items: WishlistItem[];
};

export default async function WishlistPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch all wishlists with their product details joined
  const rows = await query<{
    wishlist_id: number;
    wishlist_name: string;
    wishlist_item_id: number | null;
    product_id: string | null;
    name: string | null;
    slug: string | null;
    image: string | null;
    price: number | null;
    currency: string | null;
    brand: string | null;
    sku: string | null;
    unit: string | null;
    inventory: number | null;
  }>(
    `SELECT
       w.id AS wishlist_id, w.name AS wishlist_name,
       wi.id AS wishlist_item_id, wi.product_id,
       p.name, p.slug, p.image, p.price, p.currency,
       p.brand, p.sku, p.unit, p.inventory
     FROM wishlists w
     LEFT JOIN wishlist_items wi ON wi.wishlist_id = w.id
     LEFT JOIN products p ON p.id::text = wi.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at ASC, wi.added_at ASC`,
    [session.id]
  );

  // Group rows into wishlists
  const listMap = new Map<number, WishlistWithItems>();
  for (const row of rows) {
    if (!listMap.has(row.wishlist_id)) {
      listMap.set(row.wishlist_id, { id: row.wishlist_id, name: row.wishlist_name, items: [] });
    }
    if (row.wishlist_item_id && row.product_id && row.name) {
      listMap.get(row.wishlist_id)!.items.push({
        wishlist_item_id: row.wishlist_item_id,
        product_id: row.product_id,
        name: row.name,
        slug: row.slug!,
        image: row.image!,
        price: Number(row.price),
        currency: row.currency!,
        brand: row.brand!,
        sku: row.sku!,
        unit: row.unit!,
        inventory: row.inventory!,
      });
    }
  }

  const lists = Array.from(listMap.values());

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>My Wishlists</h2>
        <p style={{ color: "var(--color-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {lists.length} list{lists.length !== 1 ? "s" : ""}
        </p>
      </div>
      <WishlistPageClient lists={lists} />
    </div>
  );
}
