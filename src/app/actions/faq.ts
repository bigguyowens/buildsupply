"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type FaqCategory = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

export type FaqItem = {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type FaqCategoryWithItems = FaqCategory & { items: FaqItem[] };

// ── Public ─────────────────────────────────────────────────────────────────
export async function getFaqPublic(): Promise<FaqCategoryWithItems[]> {
  const cats = await query<FaqCategory>(
    `SELECT id, name, slug, sort_order FROM faq_categories ORDER BY sort_order ASC`
  );
  const items = await query<FaqItem>(
    `SELECT * FROM faq_items WHERE published = TRUE ORDER BY category_id, sort_order ASC`
  );
  return cats.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));
}

// ── Admin: get all (including unpublished) ─────────────────────────────────
export async function getFaqAdmin(): Promise<FaqCategoryWithItems[]> {
  const cats = await query<FaqCategory>(
    `SELECT id, name, slug, sort_order FROM faq_categories ORDER BY sort_order ASC`
  );
  const items = await query<FaqItem>(
    `SELECT * FROM faq_items ORDER BY category_id, sort_order ASC`
  );
  return cats.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  }));
}

// ── Admin: create category ─────────────────────────────────────────────────
export async function createFaqCategory(name: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const [{ max }] = await query<{ max: number }>("SELECT COALESCE(MAX(sort_order)+1,0) AS max FROM faq_categories");
  await query(
    `INSERT INTO faq_categories (name, slug, sort_order) VALUES ($1, $2, $3)`,
    [name, slug, max]
  );
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: update category name ────────────────────────────────────────────
export async function updateFaqCategory(id: number, name: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  await query(`UPDATE faq_categories SET name = $1 WHERE id = $2`, [name, id]);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: delete category (cascades items) ────────────────────────────────
export async function deleteFaqCategory(id: number) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  await query(`DELETE FROM faq_categories WHERE id = $1`, [id]);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: create FAQ item ─────────────────────────────────────────────────
export async function createFaqItem(categoryId: number, question: string, answer: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  const [{ max }] = await query<{ max: number }>(
    "SELECT COALESCE(MAX(sort_order)+1,0) AS max FROM faq_items WHERE category_id = $1",
    [categoryId]
  );
  await query(
    `INSERT INTO faq_items (category_id, question, answer, sort_order) VALUES ($1,$2,$3,$4)`,
    [categoryId, question, answer, max]
  );
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: update FAQ item ─────────────────────────────────────────────────
export async function updateFaqItem(
  id: number,
  data: Partial<{ question: string; answer: string; published: boolean; category_id: number }>
) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  const fields: string[] = [];
  const vals: unknown[] = [];
  let n = 1;
  if (data.question   !== undefined) { fields.push(`question=$${n++}`);    vals.push(data.question); }
  if (data.answer     !== undefined) { fields.push(`answer=$${n++}`);      vals.push(data.answer); }
  if (data.published  !== undefined) { fields.push(`published=$${n++}`);   vals.push(data.published); }
  if (data.category_id !== undefined) { fields.push(`category_id=$${n++}`); vals.push(data.category_id); }
  if (!fields.length) return { ok: true };
  fields.push(`updated_at=NOW()`);
  vals.push(id);
  await query(`UPDATE faq_items SET ${fields.join(",")} WHERE id=$${n}`, vals);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: delete FAQ item ─────────────────────────────────────────────────
export async function deleteFaqItem(id: number) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  await query(`DELETE FROM faq_items WHERE id = $1`, [id]);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}

// ── Admin: reorder items within a category ─────────────────────────────────
export async function reorderFaqItems(orderedIds: number[]) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };
  for (let i = 0; i < orderedIds.length; i++) {
    await query(`UPDATE faq_items SET sort_order=$1 WHERE id=$2`, [i, orderedIds[i]]);
  }
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
  return { ok: true };
}
