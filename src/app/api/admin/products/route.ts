import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      name, description = "", price, currency = "USD",
      category, subcategory = "", tags = [], image = "",
      gallery = [], rating = 4.0, ratingCount = 0,
      inventory, featured = false, brand = "", sku, unit = "each",
    } = body;

    if (!name || !price || !category || !sku) {
      return NextResponse.json({ error: "name, price, category, and sku are required" }, { status: 400 });
    }

    // Check for duplicate SKU
    const existing = await query<{ id: string }>("SELECT id FROM products WHERE sku = $1", [sku]);
    if (existing.length > 0) {
      return NextResponse.json({ error: `SKU "${sku}" already exists` }, { status: 409 });
    }

    const slug = slugify(name);

    const rows = await query<{ id: string }>(
      `INSERT INTO products
         (name, slug, description, price, currency, category, subcategory,
          tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        name, slug, description, Number(price), currency,
        category, subcategory,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        image,
        JSON.stringify(Array.isArray(gallery) ? gallery : []),
        Number(rating), Number(ratingCount),
        Number(inventory), featured, brand, sku, unit,
      ]
    );

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
