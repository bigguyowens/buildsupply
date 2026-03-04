'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────────────────

export type JobPosting = {
  id: number; title: string; slug: string; department: string;
  location: string; type: string; status: string;
  description: string; requirements: string; salary_range: string | null;
  created_at: string; updated_at: string;
  application_count?: number;
};

export type JobApplication = {
  id: number; posting_id: number; name: string; email: string;
  phone: string | null; linkedin: string | null; portfolio: string | null;
  cover_letter: string | null; resume_text: string | null;
  resume_filename: string | null; resume_size: number | null;
  has_resume: boolean;
  status: string; admin_notes: string | null;
  created_at: string; updated_at: string;
  posting_title?: string;
};

export type PostingInput = {
  title: string; department: string; location: string; type: string;
  status: string; description: string; requirements: string; salary_range: string;
};

export type ApplicationInput = {
  posting_id: number; name: string; email: string; phone: string;
  linkedin: string; portfolio: string; cover_letter: string; resume_text: string;
  resume_data?: string; resume_mime?: string; resume_filename?: string; resume_size?: number;
};

// ── Slug helper ───────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Public reads ──────────────────────────────────────────────────────────

export async function getActivePostings(department?: string): Promise<JobPosting[]> {
  const rows = await query<JobPosting>(
    `SELECT * FROM job_postings WHERE status = 'active'
     ${department ? "AND department = $1" : ""}
     ORDER BY created_at DESC`,
    department ? [department] : []
  );
  return rows;
}

export async function getPostingBySlug(slug: string): Promise<JobPosting | null> {
  const [row] = await query<JobPosting>(
    `SELECT * FROM job_postings WHERE slug = $1 AND status = 'active'`, [slug]
  );
  return row ?? null;
}

export async function getDepartments(): Promise<string[]> {
  const rows = await query<{ department: string }>(
    `SELECT DISTINCT department FROM job_postings WHERE status = 'active' ORDER BY department`
  );
  return rows.map(r => r.department);
}

// ── Public: submit application ────────────────────────────────────────────

export async function submitApplicationAction(
  data: ApplicationInput
): Promise<{ success: boolean; error?: string }> {
  if (!data.name.trim() || !data.email.trim()) return { success: false, error: "Name and email are required." };

  try {
    // Check posting is still active
    const [posting] = await query<{ id: number }>(
      `SELECT id FROM job_postings WHERE id = $1 AND status = 'active'`, [data.posting_id]
    );
    if (!posting) return { success: false, error: "This position is no longer accepting applications." };

    // Prevent duplicate from same email
    const [existing] = await query<{ id: number }>(
      `SELECT id FROM job_applications WHERE posting_id = $1 AND email = $2`, [data.posting_id, data.email.toLowerCase()]
    );
    if (existing) return { success: false, error: "You've already applied for this position." };

    await query(
      `INSERT INTO job_applications
         (posting_id, name, email, phone, linkedin, portfolio, cover_letter, resume_text,
          resume_data, resume_mime, resume_filename, resume_size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [data.posting_id, data.name.trim(), data.email.toLowerCase().trim(),
       data.phone || null, data.linkedin || null, data.portfolio || null,
       data.cover_letter || null, data.resume_text || null,
       data.resume_data || null, data.resume_mime || null,
       data.resume_filename || null, data.resume_size || null]
    );

    revalidatePath(`/admin/careers/${data.posting_id}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to submit application. Please try again." };
  }
}

// ── Admin: postings CRUD ──────────────────────────────────────────────────

export async function adminGetPostings(): Promise<JobPosting[]> {
  return query<JobPosting>(`
    SELECT jp.*,
      COUNT(ja.id)::int AS application_count
    FROM job_postings jp
    LEFT JOIN job_applications ja ON ja.posting_id = jp.id
    GROUP BY jp.id
    ORDER BY jp.created_at DESC
  `);
}

export async function adminGetPostingById(id: number): Promise<JobPosting | null> {
  const [row] = await query<JobPosting>(`SELECT * FROM job_postings WHERE id = $1`, [id]);
  return row ?? null;
}

export async function adminCreatePosting(
  data: PostingInput
): Promise<{ success: true; id: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    let slug = toSlug(data.title);
    // Ensure unique slug
    const [existing] = await query<{ id: number }>(`SELECT id FROM job_postings WHERE slug = $1`, [slug]);
    if (existing) slug = `${slug}-${Date.now()}`;

    const [row] = await query<{ id: number }>(
      `INSERT INTO job_postings (title, slug, department, location, type, status, description, requirements, salary_range)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [data.title, slug, data.department, data.location, data.type,
       data.status, data.description, data.requirements, data.salary_range || null]
    );
    revalidatePath("/admin/careers");
    revalidatePath("/careers");
    return { success: true, id: row.id };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to create posting." };
  }
}

export async function adminUpdatePosting(
  id: number, data: PostingInput
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await query(
      `UPDATE job_postings SET title=$1, department=$2, location=$3, type=$4, status=$5,
       description=$6, requirements=$7, salary_range=$8, updated_at=NOW() WHERE id=$9`,
      [data.title, data.department, data.location, data.type, data.status,
       data.description, data.requirements, data.salary_range || null, id]
    );
    revalidatePath("/admin/careers");
    revalidatePath(`/admin/careers/${id}`);
    revalidatePath("/careers");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update posting." };
  }
}

export async function adminDeletePosting(id: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };
  try {
    await query(`DELETE FROM job_postings WHERE id = $1`, [id]);
    revalidatePath("/admin/careers");
    revalidatePath("/careers");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete." };
  }
}

// ── Admin: applications ───────────────────────────────────────────────────

export async function adminGetApplications(postingId: number): Promise<JobApplication[]> {
  return query<JobApplication>(
    `SELECT id, posting_id, name, email, phone, linkedin, portfolio,
            cover_letter, resume_text, resume_filename, resume_size,
            (resume_data IS NOT NULL) AS has_resume,
            status, admin_notes, created_at, updated_at
     FROM job_applications WHERE posting_id = $1 ORDER BY created_at DESC`, [postingId]
  );
}

export async function adminGetAllApplications(): Promise<JobApplication[]> {
  return query<JobApplication>(`
    SELECT ja.id, ja.posting_id, ja.name, ja.email, ja.phone, ja.linkedin, ja.portfolio,
           ja.cover_letter, ja.resume_text, ja.resume_filename, ja.resume_size,
           (ja.resume_data IS NOT NULL) AS has_resume,
           ja.status, ja.admin_notes, ja.created_at, ja.updated_at,
           jp.title AS posting_title
    FROM job_applications ja
    JOIN job_postings jp ON jp.id = ja.posting_id
    ORDER BY ja.created_at DESC
  `);
}

export async function adminUpdateApplicationStatus(
  id: number, status: string, notes?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };
  try {
    await query(
      `UPDATE job_applications SET status=$1, admin_notes=COALESCE($2, admin_notes), updated_at=NOW() WHERE id=$3`,
      [status, notes ?? null, id]
    );
    revalidatePath("/admin/careers");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update." };
  }
}
