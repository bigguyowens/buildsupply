import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";
import * as XLSX from "xlsx";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseList(val: unknown): string[] {
  if (!val) return [];
  if (typeof val === "string") return val.split(",").map(s => s.trim()).filter(Boolean);
  if (Array.isArray(val)) return val.map(String);
  return [];
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    if (rows.length === 0) return NextResponse.json({ error: "Spreadsheet is empty" }, { status: 400 });

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const [i, row] of rows.entries()) {
      const rowNum = i + 2; // 1-indexed + header
      const name      = String(row["name"] ?? row["Name"] ?? "").trim();
      const sku       = String(row["sku"]  ?? row["SKU"]  ?? "").trim();
      const price     = parseFloat(String(row["price"] ?? row["Price"] ?? ""));
      const category  = String(row["category"]  ?? row["Category"]  ?? "").trim();
      const inventory = parseInt(String(row["inventory"] ?? row["Inventory"] ?? "0"), 10);

      if (!name || !sku || isNaN(price) || !category) {
        results.errors.push(`Row ${rowNum}: missing required field (name, sku, price, or category)`);
        results.skipped++;
        continue;
      }

      const existing = await query<{ id: string }>("SELECT id FROM products WHERE sku = $1", [sku]);
      if (existing.length > 0) {
        results.errors.push(`Row ${rowNum}: SKU "${sku}" already exists — skipped`);
        results.skipped++;
        continue;
      }

      try {
        await query(
          `INSERT INTO products
             (name, slug, description, price, currency, category, subcategory,
              tags, image, gallery, rating, rating_count, inventory, featured, brand, sku, unit)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
          [
            name,
            slugify(name),
            String(row["description"] ?? row["Description"] ?? ""),
            price,
            String(row["currency"] ?? "USD"),
            category,
            String(row["subcategory"] ?? row["Subcategory"] ?? ""),
            JSON.stringify(parseList(row["tags"] ?? row["Tags"])),
            String(row["image"]   ?? row["Image"]   ?? ""),
            JSON.stringify(parseList(row["gallery"] ?? row["Gallery"])),
            parseFloat(String(row["rating"]      ?? "4.0")) || 4.0,
            parseInt(String(row["ratingCount"]   ?? row["rating_count"] ?? "0"), 10) || 0,
            inventory,
            String(row["featured"] ?? "").toLowerCase() === "true" || String(row["featured"]) === "1",
            String(row["brand"] ?? row["Brand"] ?? ""),
            sku,
            String(row["unit"] ?? row["Unit"] ?? "each"),
          ]
        );
        results.inserted++;
      } catch (err) {
        results.errors.push(`Row ${rowNum}: ${(err as Error).message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({ ok: true, ...results, total: rows.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
