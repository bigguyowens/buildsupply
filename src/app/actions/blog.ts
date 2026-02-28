'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type BlogCategory = {
  id: number; name: string; slug: string;
  description: string; color: string; sort_order: number;
  post_count?: number;
};

export type BlogPost = {
  id: number; category_id: number; title: string; slug: string;
  excerpt: string; body: string; cover_image: string;
  author_name: string; published: boolean;
  published_at: string | null; created_at: string; updated_at: string;
  category_name?: string; category_slug?: string; category_color?: string;
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

// ── Public ────────────────────────────────────────────────────────────────

export async function getBlogCategories(): Promise<BlogCategory[]> {
  return query<BlogCategory>(`
    SELECT bc.*, COUNT(bp.id)::int AS post_count
    FROM blog_categories bc
    LEFT JOIN blog_posts bp ON bp.category_id = bc.id AND bp.published = true
    GROUP BY bc.id ORDER BY bc.sort_order, bc.name
  `);
}

export async function getPublishedPosts(categorySlug?: string, limit = 20): Promise<BlogPost[]> {
  if (categorySlug) {
    return query<BlogPost>(`
      SELECT bp.*, bc.name AS category_name, bc.slug AS category_slug, bc.color AS category_color
      FROM blog_posts bp JOIN blog_categories bc ON bc.id = bp.category_id
      WHERE bp.published = true AND bc.slug = $1
      ORDER BY bp.published_at DESC LIMIT $2
    `, [categorySlug, limit]);
  }
  return query<BlogPost>(`
    SELECT bp.*, bc.name AS category_name, bc.slug AS category_slug, bc.color AS category_color
    FROM blog_posts bp JOIN blog_categories bc ON bc.id = bp.category_id
    WHERE bp.published = true
    ORDER BY bp.published_at DESC LIMIT $1
  `, [limit]);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const rows = await query<BlogPost>(`
    SELECT bp.*, bc.name AS category_name, bc.slug AS category_slug, bc.color AS category_color
    FROM blog_posts bp JOIN blog_categories bc ON bc.id = bp.category_id
    WHERE bp.slug = $1 AND bp.published = true LIMIT 1
  `, [slug]);
  return rows[0] ?? null;
}

export async function getRecentPosts(limit = 3): Promise<BlogPost[]> {
  return getPublishedPosts(undefined, limit);
}

// ── Admin ─────────────────────────────────────────────────────────────────

export async function adminGetAllPosts(): Promise<BlogPost[]> {
  await assertAdmin();
  return query<BlogPost>(`
    SELECT bp.*, bc.name AS category_name, bc.slug AS category_slug, bc.color AS category_color
    FROM blog_posts bp JOIN blog_categories bc ON bc.id = bp.category_id
    ORDER BY bp.created_at DESC
  `);
}

export async function adminGetPostById(id: number): Promise<BlogPost | null> {
  await assertAdmin();
  const rows = await query<BlogPost>(`
    SELECT bp.*, bc.name AS category_name, bc.slug AS category_slug, bc.color AS category_color
    FROM blog_posts bp JOIN blog_categories bc ON bc.id = bp.category_id
    WHERE bp.id = $1 LIMIT 1
  `, [id]);
  return rows[0] ?? null;
}

export async function adminSavePost(data: {
  id?: number; category_id: number; title: string; slug?: string;
  excerpt: string; body: string; cover_image: string;
  author_name: string; published: boolean;
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  await assertAdmin();
  try {
    const slug = data.slug?.trim() || toSlug(data.title);
    if (data.id) {
      await query(`
        UPDATE blog_posts SET category_id=$1, title=$2, slug=$3, excerpt=$4, body=$5,
          cover_image=$6, author_name=$7, published=$8,
          published_at = CASE WHEN $8 = true AND published_at IS NULL THEN NOW() ELSE published_at END,
          updated_at = NOW()
        WHERE id=$9
      `, [data.category_id, data.title, slug, data.excerpt, data.body,
          data.cover_image, data.author_name, data.published, data.id]);
      revalidatePath("/blog"); revalidatePath("/admin/blog");
      return { ok: true, id: data.id };
    } else {
      const rows = await query<{ id: number }>(`
        INSERT INTO blog_posts (category_id, title, slug, excerpt, body, cover_image, author_name, published, published_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $8 THEN NOW() ELSE NULL END)
        RETURNING id
      `, [data.category_id, data.title, slug, data.excerpt, data.body,
          data.cover_image, data.author_name, data.published]);
      revalidatePath("/blog"); revalidatePath("/admin/blog");
      return { ok: true, id: rows[0].id };
    }
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "Error";
    return { ok: false, error: msg.includes("unique") ? "A post with that slug already exists." : msg };
  }
}

export async function adminTogglePublished(id: number, published: boolean): Promise<{ ok: boolean }> {
  await assertAdmin();
  await query(`
    UPDATE blog_posts SET published=$1,
      published_at = CASE WHEN $1 = true AND published_at IS NULL THEN NOW() ELSE published_at END,
      updated_at = NOW()
    WHERE id=$2
  `, [published, id]);
  revalidatePath("/blog"); revalidatePath("/admin/blog");
  return { ok: true };
}

export async function adminDeletePost(id: number): Promise<{ ok: boolean }> {
  await assertAdmin();
  await query(`DELETE FROM blog_posts WHERE id=$1`, [id]);
  revalidatePath("/blog"); revalidatePath("/admin/blog");
  return { ok: true };
}

export async function adminSaveBlogCategory(data: {
  id?: number; name: string; slug?: string; description: string; color: string;
}): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  try {
    const slug = data.slug?.trim() || toSlug(data.name);
    if (data.id) {
      await query(`UPDATE blog_categories SET name=$1, slug=$2, description=$3, color=$4 WHERE id=$5`,
        [data.name, slug, data.description, data.color, data.id]);
    } else {
      await query(`INSERT INTO blog_categories (name, slug, description, color) VALUES ($1,$2,$3,$4)`,
        [data.name, slug, data.description, data.color]);
    }
    revalidatePath("/blog"); revalidatePath("/admin/blog");
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? "Error";
    return { ok: false, error: msg.includes("unique") ? "A category with that slug already exists." : msg };
  }
}

export async function adminDeleteBlogCategory(id: number): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const [{ count }] = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM blog_posts WHERE category_id=$1`, [id]);
  if (parseInt(count) > 0) return { ok: false, error: `Cannot delete — ${count} post(s) use this category.` };
  await query(`DELETE FROM blog_categories WHERE id=$1`, [id]);
  revalidatePath("/blog"); revalidatePath("/admin/blog");
  return { ok: true };
}
