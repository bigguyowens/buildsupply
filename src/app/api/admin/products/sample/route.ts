import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("bs_token")?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const wb = XLSX.utils.book_new();

  // --- Products sheet ---
  const headers = [
    "name", "sku", "price", "currency", "category", "subcategory",
    "brand", "unit", "inventory", "featured", "description",
    "tags", "image", "gallery", "rating", "ratingCount",
  ];

  const sampleRows = [
    [
      "Sample Power Drill 18V", "DRILL-001", 149.99, "USD",
      "Power Tools", "Drills",
      "DeWalt", "each", 50, false,
      "Professional 18V cordless drill with two-speed transmission.",
      "drill, cordless, 18v",
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80",
      "",
      4.5, 120,
    ],
    [
      "Safety Hard Hat", "HAT-001", 24.99, "USD",
      "Safety & PPE", "Head Protection",
      "MSA", "each", 200, false,
      "ANSI-certified hard hat with 4-point suspension.",
      "hard hat, ppe, safety, head protection",
      "https://images.unsplash.com/photo-1618090584176-7132b9911657?w=400&q=80",
      "",
      4.3, 85,
    ],
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 45 },
    { wch: 30 }, { wch: 50 }, { wch: 50 },
    { wch: 8  }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // --- Instructions sheet ---
  const instructions = [
    ["BuildSupply — Bulk Product Import Template"],
    [""],
    ["REQUIRED COLUMNS (must not be empty):"],
    ["  name        — Product display name"],
    ["  sku         — Unique product code (duplicates will be skipped)"],
    ["  price       — Decimal number, e.g. 29.99"],
    ["  category    — Must match an existing category name exactly"],
    [""],
    ["OPTIONAL COLUMNS:"],
    ["  currency    — Default: USD"],
    ["  subcategory — Sub-type within the category"],
    ["  brand       — Manufacturer/brand name"],
    ["  unit        — Unit of sale, e.g. each, box, pack (default: each)"],
    ["  inventory   — Stock quantity (default: 0)"],
    ["  featured    — true or false (default: false)"],
    ["  description — Full product description"],
    ["  tags        — Comma-separated list, e.g. drill,cordless,18v"],
    ["  image       — URL to primary product image"],
    ["  gallery     — Comma-separated image URLs for gallery"],
    ["  rating      — Number 0-5 (default: 4.0)"],
    ["  ratingCount — Number of reviews (default: 0)"],
    [""],
    ["VALID CATEGORIES:"],
    ["  Abrasives, Concrete & Masonry, Cutting Tools, Electrical,"],
    ["  Fasteners, Hand Tools, Janitorial, Lifting & Rigging,"],
    ["  Plumbing, Power Tools, Safety & PPE, Welding"],
    [""],
    ["NOTES:"],
    ["  - Rows with duplicate SKUs will be skipped"],
    ["  - Rows missing required fields will be skipped"],
    ["  - Import results show inserted vs skipped counts"],
    ["  - Delete the two sample rows before importing real data"],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="buildsupply-product-import-template.xlsx"',
    },
  });
}
