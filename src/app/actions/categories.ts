'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  subCount: number;
};

export type AdminSubcategory = {
  id: string;
  category_id: number;
  name: string;
  slug: string;
  sort_order: number;
};

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

// ── Categories ──────────────────────────────────────────

export async function getAdminCategories(): Promise<AdminCategory[]> {
  await assertAdmin();
  const rows = await query<AdminCategory>(`
    SELECT c.id, c.name, c.slug, c.description, c.image,
           COUNT(DISTINCT p.id)::int  AS "productCount",
           COUNT(DISTINCT s.id)::int  AS "subCount"
    FROM categories c
    LEFT JOIN products     p ON LOWER(p.category) = LOWER(c.name)
    LEFT JOIN subcategories s ON s.category_id = c.id
    GROUP BY c.id ORDER BY c.name ASC
  `);
  return rows;
}

export async function updateCategory(
  id: number,
  data: { name: string; slug: string; description: string; image: string }
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await query(
      `UPDATE categories SET name=$1, slug=$2, description=$3, image=$4 WHERE id=$5`,
      [data.name.trim(), data.slug.trim(), data.description.trim(), data.image.trim(), id]
    );
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addCategory(
  data: { name: string; slug: string; description: string; image: string }
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await query(
      `INSERT INTO categories (name, slug, description, image) VALUES ($1,$2,$3,$4)`,
      [data.name.trim(), data.slug.trim(), data.description.trim(), data.image.trim()]
    );
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteCategory(id: number): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await query(`DELETE FROM categories WHERE id=$1`, [id]);
    revalidatePath("/admin/categories");
    revalidatePath("/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Subcategories ────────────────────────────────────────

export async function getSubcategoriesForCategory(categoryId: number): Promise<AdminSubcategory[]> {
  await assertAdmin();
  const rows = await query<AdminSubcategory>(
    `SELECT id, category_id, name, slug, sort_order FROM subcategories WHERE category_id=$1 ORDER BY sort_order ASC, name ASC`,
    [categoryId]
  );
  return rows;
}

export async function addSubcategory(
  categoryId: number,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  try {
    await query(
      `INSERT INTO subcategories (category_id, name, slug, sort_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order),0)+1 FROM subcategories WHERE category_id=$1))`,
      [categoryId, name.trim(), slug]
    );
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateSubcategory(
  id: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  try {
    await query(`UPDATE subcategories SET name=$1, slug=$2 WHERE id=$3`, [name.trim(), slug, id]);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteSubcategory(id: string): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    await query(`DELETE FROM subcategories WHERE id=$1`, [id]);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
