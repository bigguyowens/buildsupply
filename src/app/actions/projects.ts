'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";

export type CRMProject = {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  value: number | null;
  entity_type: "customer" | "company";
  entity_id: number;
  entity_name: string;
  assigned_to: number | null;
  assigned_name: string | null;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  quote_count: number;
  order_count: number;
  task_count: number;
  open_task_count: number;
  note_count: number;
};

export type ProjectDetail = CRMProject & {
  quotes: {
    id: number; status: string; created_at: string;
    customer_name: string; total_quoted: number;
  }[];
  orders: {
    id: number; status: string; total: number;
    created_at: string; customer_name: string; item_count: number;
  }[];
  tasks: {
    id: number; title: string; type: string; priority: string;
    status: string; due_date: string | null; assigned_name: string | null;
  }[];
  notes: {
    id: number; body: string; pinned: boolean;
    created_at: string; author_name: string | null;
  }[];
};

async function assertCRMSession() {
  const session = await getSession();
  if (!session || !["admin","account_manager","manager"].includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getProjects(opts?: {
  entityType?: "customer" | "company";
  entityId?: number;
  scope?: "mine" | "all";
  status?: ProjectStatus | "all";
}): Promise<CRMProject[]> {
  const session = await assertCRMSession();
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const showAll   = isAdmin || opts?.scope === "all";

  const conditions: string[] = [];

  // Role scoping
  if (!showAll) {
    if (isManager) {
      conditions.push(`p.assigned_to IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id})`);
    } else {
      conditions.push(`p.assigned_to = ${session.id}`);
    }
  }

  if (opts?.entityType) conditions.push(`p.entity_type = '${opts.entityType}'`);
  if (opts?.entityId)   conditions.push(`p.entity_id = ${opts.entityId}`);
  if (opts?.status && opts.status !== "all") conditions.push(`p.status = '${opts.status}'`);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query<CRMProject>(`
    SELECT p.*,
           COALESCE(c.first_name || ' ' || c.last_name, co.name, 'Unknown') AS entity_name,
           am.first_name || ' ' || am.last_name AS assigned_name,
           cb.first_name || ' ' || cb.last_name AS created_by_name,
           (SELECT COUNT(*)::int FROM project_quotes pq WHERE pq.project_id = p.id) AS quote_count,
           (SELECT COUNT(*)::int FROM project_orders po WHERE po.project_id = p.id) AS order_count,
           (SELECT COUNT(*)::int FROM project_tasks pt WHERE pt.project_id = p.id) AS task_count,
           (SELECT COUNT(*)::int FROM project_tasks pt
            JOIN crm_tasks t ON t.id = pt.task_id
            WHERE pt.project_id = p.id AND t.status != 'complete') AS open_task_count,
           (SELECT COUNT(*)::int FROM crm_notes n WHERE n.project_id = p.id) AS note_count
    FROM customer_projects p
    LEFT JOIN users c  ON c.id  = p.entity_id AND p.entity_type = 'customer'
    LEFT JOIN companies co ON co.id = p.entity_id AND p.entity_type = 'company'
    LEFT JOIN users am ON am.id = p.assigned_to
    LEFT JOIN users cb ON cb.id = p.created_by
    ${where}
    ORDER BY p.updated_at DESC
  `);
}

export async function getProject(id: number): Promise<ProjectDetail | null> {
  const session = await assertCRMSession();
  const rows = await query<CRMProject>(`
    SELECT p.*,
           COALESCE(c.first_name || ' ' || c.last_name, co.name, 'Unknown') AS entity_name,
           am.first_name || ' ' || am.last_name AS assigned_name,
           cb.first_name || ' ' || cb.last_name AS created_by_name,
           (SELECT COUNT(*)::int FROM project_quotes pq WHERE pq.project_id = p.id) AS quote_count,
           (SELECT COUNT(*)::int FROM project_orders po WHERE po.project_id = p.id) AS order_count,
           (SELECT COUNT(*)::int FROM project_tasks pt WHERE pt.project_id = p.id) AS task_count,
           (SELECT COUNT(*)::int FROM project_tasks pt
            JOIN crm_tasks t ON t.id = pt.task_id
            WHERE pt.project_id = p.id AND t.status != 'complete') AS open_task_count,
           (SELECT COUNT(*)::int FROM crm_notes n WHERE n.project_id = p.id) AS note_count
    FROM customer_projects p
    LEFT JOIN users c  ON c.id  = p.entity_id AND p.entity_type = 'customer'
    LEFT JOIN companies co ON co.id = p.entity_id AND p.entity_type = 'company'
    LEFT JOIN users am ON am.id = p.assigned_to
    LEFT JOIN users cb ON cb.id = p.created_by
    WHERE p.id = $1
  `, [id]);
  if (!rows.length) return null;
  const project = rows[0];

  const [quotes, orders, tasks, notes] = await Promise.all([
    query<ProjectDetail["quotes"][0]>(`
      SELECT q.id, q.status, q.created_at,
             u.first_name || ' ' || u.last_name AS customer_name,
             COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS total_quoted
      FROM project_quotes pq
      JOIN quotes q ON q.id = pq.quote_id
      JOIN users u ON u.id = q.customer_id
      LEFT JOIN quote_items qi ON qi.quote_id = q.id
      WHERE pq.project_id = $1
      GROUP BY q.id, u.first_name, u.last_name
      ORDER BY q.created_at DESC
    `, [id]),
    query<ProjectDetail["orders"][0]>(`
      SELECT o.id, o.status, o.total::numeric AS total, o.created_at,
             u.first_name || ' ' || u.last_name AS customer_name,
             jsonb_array_length(o.items) AS item_count
      FROM project_orders po
      JOIN orders o ON o.id = po.order_id
      JOIN users u ON u.id = o.user_id
      WHERE po.project_id = $1
      ORDER BY o.created_at DESC
    `, [id]),
    query<ProjectDetail["tasks"][0]>(`
      SELECT t.id, t.title, t.type, t.priority, t.status, t.due_date,
             u.first_name || ' ' || u.last_name AS assigned_name
      FROM project_tasks pt
      JOIN crm_tasks t ON t.id = pt.task_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE pt.project_id = $1
      ORDER BY t.due_date ASC NULLS LAST
    `, [id]),
    query<ProjectDetail["notes"][0]>(`
      SELECT n.id, n.body, n.pinned, n.created_at,
             u.first_name || ' ' || u.last_name AS author_name
      FROM crm_notes n
      LEFT JOIN users u ON u.id = n.author_id
      WHERE n.project_id = $1
      ORDER BY n.pinned DESC, n.created_at DESC
    `, [id]),
  ]);

  return { ...project, quotes, orders, tasks, notes };
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function createProject(data: {
  name: string;
  description?: string;
  status?: ProjectStatus;
  value?: number;
  entity_type: "customer" | "company";
  entity_id: number;
  assigned_to?: number;
}): Promise<{ ok: boolean; id?: number; error?: string }> {
  const session = await assertCRMSession();
  try {
    const res = await query<{ id: number }>(`
      INSERT INTO customer_projects
        (name, description, status, value, entity_type, entity_id, assigned_to, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      data.name, data.description ?? null,
      data.status ?? "active", data.value ?? null,
      data.entity_type, data.entity_id,
      data.assigned_to ?? session.id, session.id,
    ]);
    revalidatePath("/crm/projects");
    return { ok: true, id: res[0].id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateProject(id: number, data: {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  value?: number | null;
  assigned_to?: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  await assertCRMSession();
  const fields: string[] = ["updated_at=NOW()"];
  const vals: unknown[]  = [];
  let n = 1;
  if (data.name        !== undefined) { fields.push(`name=$${n++}`);        vals.push(data.name); }
  if (data.description !== undefined) { fields.push(`description=$${n++}`); vals.push(data.description); }
  if (data.status      !== undefined) { fields.push(`status=$${n++}`);      vals.push(data.status); }
  if (data.value       !== undefined) { fields.push(`value=$${n++}`);       vals.push(data.value); }
  if (data.assigned_to !== undefined) { fields.push(`assigned_to=$${n++}`); vals.push(data.assigned_to); }
  vals.push(id);
  await query(`UPDATE customer_projects SET ${fields.join(",")} WHERE id=$${n}`, vals);
  revalidatePath("/crm/projects");
  revalidatePath(`/crm/projects/${id}`);
  return { ok: true };
}

export async function deleteProject(id: number): Promise<{ ok: boolean }> {
  await assertCRMSession();
  await query(`DELETE FROM customer_projects WHERE id=$1`, [id]);
  revalidatePath("/crm/projects");
  return { ok: true };
}

// ── Link / unlink items ───────────────────────────────────────────────────

export async function linkProjectItem(
  projectId: number,
  type: "quote" | "order" | "task",
  itemId: number
): Promise<{ ok: boolean }> {
  await assertCRMSession();
  const table = type === "quote" ? "project_quotes"
               : type === "order" ? "project_orders" : "project_tasks";
  const col   = type === "quote" ? "quote_id"
               : type === "order" ? "order_id" : "task_id";
  await query(`INSERT INTO ${table} (project_id, ${col}) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [projectId, itemId]);
  revalidatePath(`/crm/projects/${projectId}`);
  return { ok: true };
}

export async function unlinkProjectItem(
  projectId: number,
  type: "quote" | "order" | "task",
  itemId: number
): Promise<{ ok: boolean }> {
  await assertCRMSession();
  const table = type === "quote" ? "project_quotes"
               : type === "order" ? "project_orders" : "project_tasks";
  const col   = type === "quote" ? "quote_id"
               : type === "order" ? "order_id" : "task_id";
  await query(`DELETE FROM ${table} WHERE project_id=$1 AND ${col}=$2`, [projectId, itemId]);
  revalidatePath(`/crm/projects/${projectId}`);
  return { ok: true };
}

// ── Add note to project ───────────────────────────────────────────────────

export async function addProjectNote(
  projectId: number,
  body: string
): Promise<{ ok: boolean }> {
  const session = await assertCRMSession();

  // Get the project to find its entity
  const rows = await query<{ entity_type: string; entity_id: number }>(
    `SELECT entity_type, entity_id FROM customer_projects WHERE id = $1`, [projectId]
  );
  if (!rows.length) return { ok: false };

  const { entity_type, entity_id } = rows[0];
  // For customer projects, link to customer_id; for company, customer_id is null
  const customerId = entity_type === "customer" ? entity_id : null;

  await query(
    `INSERT INTO crm_notes (customer_id, author_id, body, project_id) VALUES ($1,$2,$3,$4)`,
    [customerId, session.id, body.trim(), projectId]
  );
  revalidatePath(`/crm/projects/${projectId}`);
  return { ok: true };
}
