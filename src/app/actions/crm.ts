"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Auth guard ─────────────────────────────────────────────────────────────
async function assertCRM() {
  const session = await getSession();
  if (!session || !["admin", "account_manager"].includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export type CRMCustomer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  last_activity_at: string | null;
  open_quotes: number;
  note_count: number;
  account_manager_name: string | null;
  account_manager_id: number | null;
};

export type CRMNote = {
  id: number;
  customer_id: number;
  author_id: number | null;
  body: string;
  pinned: boolean;
  created_at: string;
  author_name?: string;
};

export type CRMActivity = {
  id: number;
  customer_id: number;
  author_id: number | null;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  author_name?: string;
};

// ── Dashboard stats ────────────────────────────────────────────────────────
export async function getCRMDashboard() {
  await assertCRM();
  const [customers, orders, quotes, contacts, recentActivity] = await Promise.all([
    query<{ count: number }>("SELECT COUNT(*)::int AS count FROM users WHERE role = 'customer'"),
    query<{ count: number; total: number; today: number }>(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(total),0)::numeric AS total,
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS today
       FROM orders`
    ),
    query<{ open: number }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'sent')::int AS open FROM quotes`
    ),
    query<{ pending: number }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'new')::int AS pending FROM contact_submissions`
    ),
    query<CRMActivity & { customer_name: string }>(
      `SELECT a.*, 
              u2.first_name || ' ' || u2.last_name AS customer_name,
              COALESCE(u3.first_name || ' ' || u3.last_name, 'System') AS author_name
       FROM crm_activities a
       JOIN users u2 ON u2.id = a.customer_id
       LEFT JOIN users u3 ON u3.id = a.author_id
       ORDER BY a.created_at DESC LIMIT 10`
    ),
  ]);
  return {
    customerCount: customers[0]?.count ?? 0,
    orderCount: orders[0]?.count ?? 0,
    totalRevenue: Number(orders[0]?.total ?? 0),
    ordersToday: orders[0]?.today ?? 0,
    openQuotes: quotes[0]?.open ?? 0,
    pendingContacts: contacts[0]?.pending ?? 0,
    recentActivity,
  };
}

// ── Customer list ──────────────────────────────────────────────────────────
export async function getCRMCustomers(search = ""): Promise<CRMCustomer[]> {
  await assertCRM();
  const like = `%${search}%`;
  return query<CRMCustomer>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(DISTINCT o.id)::int AS order_count,
            COALESCE(SUM(o.total),0)::numeric AS total_spent,
            MAX(o.created_at) AS last_order_at,
            MAX(a.created_at) AS last_activity_at,
            COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'sent')::int AS open_quotes,
            COUNT(DISTINCT n.id)::int AS note_count,
            am.first_name || ' ' || am.last_name AS account_manager_name,
            u.account_manager_id
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN quotes q ON q.customer_id = u.id
     LEFT JOIN crm_activities a ON a.customer_id = u.id
     LEFT JOIN crm_notes n ON n.customer_id = u.id
     LEFT JOIN users am ON am.id = u.account_manager_id
     WHERE u.role NOT IN ('admin','account_manager')
       AND ($1 = '' OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)
     GROUP BY u.id, am.first_name, am.last_name
     ORDER BY MAX(o.created_at) DESC NULLS LAST`,
    [like]
  );
}

// ── Customer 360 ───────────────────────────────────────────────────────────
export async function getCRMCustomer(customerId: number) {
  await assertCRM();
  const [users, orders, quotes, notes, activities, contacts] = await Promise.all([
    query<{ id: number; first_name: string; last_name: string; email: string; role: string; created_at: string; account_manager_id: number | null }>(
      "SELECT id, first_name, last_name, email, role, created_at, account_manager_id FROM users WHERE id = $1",
      [customerId]
    ),
    query<{ id: number; status: string; total: number; created_at: string; items: unknown }>(
      "SELECT id, status, total, created_at, items FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
      [customerId]
    ),
    query<{ id: number; status: string; created_at: string; expires_at: string | null; total_quoted: number }>(
      `SELECT q.id, q.status, q.created_at, q.expires_at,
              COALESCE(SUM(qi.quantity * qi.quoted_price),0) AS total_quoted
       FROM quotes q LEFT JOIN quote_items qi ON qi.quote_id = q.id
       WHERE q.customer_id = $1 GROUP BY q.id ORDER BY q.created_at DESC`,
      [customerId]
    ),
    query<CRMNote>(
      `SELECT n.*, COALESCE(u.first_name || ' ' || u.last_name, 'System') AS author_name
       FROM crm_notes n LEFT JOIN users u ON u.id = n.author_id
       WHERE n.customer_id = $1 ORDER BY n.pinned DESC, n.created_at DESC`,
      [customerId]
    ),
    query<CRMActivity>(
      `SELECT a.*, COALESCE(u.first_name || ' ' || u.last_name, 'System') AS author_name
       FROM crm_activities a LEFT JOIN users u ON u.id = a.author_id
       WHERE a.customer_id = $1 ORDER BY a.created_at DESC LIMIT 50`,
      [customerId]
    ),
    query<{ id: number; name: string; email: string; reason: string | null; message: string; status: string; created_at: string }>(
      "SELECT id, name, email, reason, message, status, created_at FROM contact_submissions WHERE LOWER(email) = (SELECT LOWER(email) FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT 10",
      [customerId]
    ),
  ]);
  if (!users.length) return null;
  return { customer: users[0], orders, quotes, notes, activities, contacts };
}

// ── Notes ──────────────────────────────────────────────────────────────────
export async function addCRMNote(customerId: number, body: string) {
  const session = await assertCRM();
  await query(
    `INSERT INTO crm_notes (customer_id, author_id, body) VALUES ($1, $2, $3)`,
    [customerId, session.id, body.trim()]
  );
  await query(
    `INSERT INTO crm_activities (customer_id, author_id, type, description) VALUES ($1, $2, 'note', $3)`,
    [customerId, session.id, `Added a note`]
  );
  revalidatePath(`/crm/customers/${customerId}`);
  return { ok: true };
}

export async function togglePinNote(noteId: number) {
  await assertCRM();
  await query(`UPDATE crm_notes SET pinned = NOT pinned WHERE id = $1`, [noteId]);
  revalidatePath("/crm/customers");
  return { ok: true };
}

export async function deleteCRMNote(noteId: number) {
  await assertCRM();
  await query(`DELETE FROM crm_notes WHERE id = $1`, [noteId]);
  return { ok: true };
}

// ── Log activity ───────────────────────────────────────────────────────────
export async function logCRMActivity(
  customerId: number,
  type: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  const session = await assertCRM();
  await query(
    `INSERT INTO crm_activities (customer_id, author_id, type, description, metadata) VALUES ($1,$2,$3,$4,$5)`,
    [customerId, session.id, type, description, metadata ? JSON.stringify(metadata) : null]
  );
  revalidatePath(`/crm/customers/${customerId}`);
  return { ok: true };
}

// ── Get all account managers (for assignment dropdown) ─────────────────────
export async function getAccountManagers() {
  await assertCRM();
  return query<{ id: number; first_name: string; last_name: string; email: string }>(
    `SELECT id, first_name, last_name, email FROM users
     WHERE role IN ('admin','account_manager') ORDER BY first_name ASC`
  );
}

// ── Assign customer to account manager ─────────────────────────────────────
export async function assignAccountManager(customerId: number, accountManagerId: number | null) {
  await assertCRM();
  await query(`UPDATE users SET account_manager_id = $1 WHERE id = $2`, [accountManagerId, customerId]);
  revalidatePath(`/crm/customers/${customerId}`);
  revalidatePath("/crm/customers");
  return { ok: true };
}

// ── Update user role ───────────────────────────────────────────────────────
export async function updateUserRole(customerId: number, role: string) {
  const session = await assertCRM();
  const allowed = ["customer", "account_manager", "admin"];
  if (!allowed.includes(role)) return { error: "Invalid role" };
  // Only admins can grant admin role
  if (role === "admin" && session.role !== "admin") return { error: "Only admins can grant admin role" };
  await query(`UPDATE users SET role = $1 WHERE id = $2`, [role, customerId]);
  revalidatePath(`/crm/customers/${customerId}`);
  revalidatePath("/crm/customers");
  return { ok: true };
}

// ── Contact form queue ─────────────────────────────────────────────────────
export async function getCRMContactQueue() {
  await assertCRM();
  return query<{ id: number; name: string; email: string; reason: string | null; message: string; status: string; created_at: string; replied_at: string | null }>(
    `SELECT id, name, email, reason, message, status, created_at, updated_at AS replied_at
     FROM contact_submissions ORDER BY created_at DESC`
  );
}

// ── Get staff (AMs + admins) ───────────────────────────────────────────────
export type CRMStaff = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  assigned_customers: number;
  assigned_companies: number;
};

export async function getCRMStaff(): Promise<CRMStaff[]> {
  await assertCRM();
  return query<CRMStaff>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(DISTINCT c.id)::int AS assigned_customers,
            COUNT(DISTINCT co.id)::int AS assigned_companies
     FROM users u
     LEFT JOIN users c ON c.account_manager_id = u.id
     LEFT JOIN companies co ON co.account_manager_id = u.id
     WHERE u.role IN ('admin','account_manager')
     GROUP BY u.id
     ORDER BY u.role ASC, u.first_name ASC`
  );
}

// ── Companies ──────────────────────────────────────────────────────────────
export type CRMCompany = {
  id: number;
  name: string;
  domain: string | null;
  industry: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  account_manager_id: number | null;
  account_manager_name: string | null;
  employee_count: number;
  total_spent: number;
  order_count: number;
  open_quotes: number;
  created_at: string;
};

export async function getCRMCompanies(): Promise<CRMCompany[]> {
  await assertCRM();
  return query<CRMCompany>(
    `SELECT c.id, c.name, c.domain, c.industry, c.phone, c.city, c.state,
            c.account_manager_id, c.created_at,
            am.first_name || ' ' || am.last_name AS account_manager_name,
            COUNT(DISTINCT u.id)::int AS employee_count,
            COALESCE(SUM(o.total),0)::numeric AS total_spent,
            COUNT(DISTINCT o.id)::int AS order_count,
            COUNT(DISTINCT q.id) FILTER (WHERE q.status='sent')::int AS open_quotes
     FROM companies c
     LEFT JOIN users u ON u.company_id = c.id
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN quotes q ON q.customer_id = u.id
     LEFT JOIN users am ON am.id = c.account_manager_id
     GROUP BY c.id, am.first_name, am.last_name
     ORDER BY c.name ASC`
  );
}

export async function getCRMCompany(companyId: number) {
  await assertCRM();
  const [companies, employees] = await Promise.all([
    query<CRMCompany & { address: string | null; zip: string | null }>(
      `SELECT c.*, am.first_name || ' ' || am.last_name AS account_manager_name,
              COUNT(DISTINCT u.id)::int AS employee_count,
              COALESCE(SUM(o.total),0)::numeric AS total_spent,
              COUNT(DISTINCT o.id)::int AS order_count,
              COUNT(DISTINCT q.id) FILTER (WHERE q.status='sent')::int AS open_quotes
       FROM companies c
       LEFT JOIN users u ON u.company_id = c.id
       LEFT JOIN orders o ON o.user_id = u.id
       LEFT JOIN quotes q ON q.customer_id = u.id
       LEFT JOIN users am ON am.id = c.account_manager_id
       WHERE c.id = $1
       GROUP BY c.id, am.first_name, am.last_name`,
      [companyId]
    ),
    query<{ id: number; first_name: string; last_name: string; email: string; role: string; order_count: number; total_spent: number }>(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
              COUNT(DISTINCT o.id)::int AS order_count,
              COALESCE(SUM(o.total),0)::numeric AS total_spent
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       WHERE u.company_id = $1
       GROUP BY u.id ORDER BY u.role DESC, u.first_name ASC`,
      [companyId]
    ),
  ]);
  if (!companies.length) return null;
  return { company: companies[0], employees };
}

export async function updateCompany(companyId: number, data: {
  name?: string; industry?: string; phone?: string;
  city?: string; state?: string; account_manager_id?: number | null;
}) {
  await assertCRM();
  const fields: string[] = [];
  const vals: unknown[] = [];
  let n = 1;
  if (data.name              !== undefined) { fields.push(`name=$${n++}`);              vals.push(data.name); }
  if (data.industry          !== undefined) { fields.push(`industry=$${n++}`);          vals.push(data.industry); }
  if (data.phone             !== undefined) { fields.push(`phone=$${n++}`);             vals.push(data.phone); }
  if (data.city              !== undefined) { fields.push(`city=$${n++}`);              vals.push(data.city); }
  if (data.state             !== undefined) { fields.push(`state=$${n++}`);             vals.push(data.state); }
  if (data.account_manager_id !== undefined) { fields.push(`account_manager_id=$${n++}`); vals.push(data.account_manager_id); }
  if (!fields.length) return { ok: true };
  fields.push(`updated_at=NOW()`);
  vals.push(companyId);
  await query(`UPDATE companies SET ${fields.join(",")} WHERE id=$${n}`, vals);
  revalidatePath(`/crm/companies/${companyId}`);
  revalidatePath("/crm/companies");
  return { ok: true };
}

export async function assignUserToCompany(userId: number, companyId: number | null) {
  await assertCRM();
  await query(`UPDATE users SET company_id=$1 WHERE id=$2`, [companyId, userId]);
  revalidatePath("/crm/companies");
  return { ok: true };
}

// ── Onboarding ─────────────────────────────────────────────────────────────
export type OnboardingStep = {
  id: number;
  template_id: number;
  step_order: number;
  title: string;
  description: string | null;
  required: boolean;
  status: "pending" | "in_progress" | "complete" | "skipped";
  note: string | null;
  completed_at: string | null;
  completed_by_name: string | null;
};

export type OnboardingStatus = {
  total: number;
  complete: number;
  required_total: number;
  required_complete: number;
  percent: number;
  steps: OnboardingStep[];
};

export async function getOnboarding(
  entityType: "customer" | "company",
  entityId: number
): Promise<OnboardingStatus> {
  await assertCRM();
  const steps = await query<OnboardingStep>(
    `SELECT op.id, op.template_id, ot.step_order, ot.title, ot.description, ot.required,
            op.status, op.note, op.completed_at,
            u.first_name || ' ' || u.last_name AS completed_by_name
     FROM onboarding_progress op
     JOIN onboarding_templates ot ON ot.id = op.template_id
     LEFT JOIN users u ON u.id = op.completed_by
     WHERE op.entity_type = $1 AND op.entity_id = $2
     ORDER BY ot.step_order ASC`,
    [entityType, entityId]
  );

  // Auto-provision if missing (new entity)
  if (!steps.length) {
    await query(
      `INSERT INTO onboarding_progress (entity_type, entity_id, template_id)
       SELECT $1, $2, id FROM onboarding_templates WHERE type = $1
       ON CONFLICT DO NOTHING`,
      [entityType, entityId]
    );
    return getOnboarding(entityType, entityId);
  }

  const total            = steps.length;
  const complete         = steps.filter(s => s.status === "complete").length;
  const required_total   = steps.filter(s => s.required).length;
  const required_complete = steps.filter(s => s.required && s.status === "complete").length;
  const percent          = total > 0 ? Math.round((complete / total) * 100) : 0;

  return { total, complete, required_total, required_complete, percent, steps };
}

export async function updateOnboardingStep(
  progressId: number,
  status: "pending" | "in_progress" | "complete" | "skipped",
  note?: string
) {
  const session = await assertCRM();
  await query(
    `UPDATE onboarding_progress
     SET status=$1, note=COALESCE($2, note),
         completed_by=CASE WHEN $1='complete' THEN $3 ELSE completed_by END,
         completed_at=CASE WHEN $1='complete' THEN NOW() ELSE NULL END,
         updated_at=NOW()
     WHERE id=$4`,
    [status, note ?? null, session.id, progressId]
  );
  revalidatePath("/crm");
  return { ok: true };
}

// ── Onboarding pipeline for dashboard ─────────────────────────────────────
export async function getOnboardingPipeline() {
  await assertCRM();

  const customers = await query<{
    id: number; first_name: string; last_name: string; email: string;
    total: number; complete: number; percent: number; account_manager_name: string | null;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.email,
            COUNT(op.id)::int AS total,
            COUNT(op.id) FILTER (WHERE op.status='complete')::int AS complete,
            ROUND(COUNT(op.id) FILTER (WHERE op.status='complete') * 100.0 / NULLIF(COUNT(op.id),0))::int AS percent,
            am.first_name || ' ' || am.last_name AS account_manager_name
     FROM users u
     JOIN onboarding_progress op ON op.entity_id = u.id AND op.entity_type = 'customer'
     LEFT JOIN users am ON am.id = u.account_manager_id
     WHERE u.role NOT IN ('admin','account_manager')
     GROUP BY u.id, am.first_name, am.last_name
     HAVING COUNT(op.id) FILTER (WHERE op.status='complete') < COUNT(op.id)
     ORDER BY percent DESC
     LIMIT 8`
  );

  const companies = await query<{
    id: number; name: string;
    total: number; complete: number; percent: number; account_manager_name: string | null;
  }>(
    `SELECT c.id, c.name,
            COUNT(op.id)::int AS total,
            COUNT(op.id) FILTER (WHERE op.status='complete')::int AS complete,
            ROUND(COUNT(op.id) FILTER (WHERE op.status='complete') * 100.0 / NULLIF(COUNT(op.id),0))::int AS percent,
            am.first_name || ' ' || am.last_name AS account_manager_name
     FROM companies c
     JOIN onboarding_progress op ON op.entity_id = c.id AND op.entity_type = 'company'
     LEFT JOIN users am ON am.id = c.account_manager_id
     GROUP BY c.id, am.first_name, am.last_name
     HAVING COUNT(op.id) FILTER (WHERE op.status='complete') < COUNT(op.id)
     ORDER BY percent DESC
     LIMIT 6`
  );

  return { customers, companies };
}

// ── Tasks ──────────────────────────────────────────────────────────────────
export type CRMTask = {
  id: number;
  title: string;
  description: string | null;
  type: "call" | "email" | "follow_up" | "demo" | "check_in" | "proposal" | "other";
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "complete";
  due_date: string | null;
  entity_type: "customer" | "company" | null;
  entity_id: number | null;
  entity_name: string | null;
  assigned_to: number | null;
  assigned_name: string | null;
  created_by: number | null;
  completed_at: string | null;
  created_at: string;
};

export async function getCRMTasks(filters?: {
  entityType?: "customer" | "company";
  entityId?: number;
  assignedTo?: number;
  status?: string;
}): Promise<CRMTask[]> {
  const session = await assertCRM();
  const isAdmin = session.role === "admin";

  const conditions: string[] = [];
  const vals: unknown[] = [];
  let n = 1;

  // AMs only see their own tasks
  if (!isAdmin) {
    conditions.push(`t.assigned_to = $${n++}`);
    vals.push(session.id);
  }
  if (filters?.entityType) { conditions.push(`t.entity_type = $${n++}`); vals.push(filters.entityType); }
  if (filters?.entityId)   { conditions.push(`t.entity_id   = $${n++}`); vals.push(filters.entityId); }
  if (filters?.assignedTo) { conditions.push(`t.assigned_to = $${n++}`); vals.push(filters.assignedTo); }
  if (filters?.status)     { conditions.push(`t.status      = $${n++}`); vals.push(filters.status); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return query<CRMTask>(
    `SELECT t.*,
            u.first_name || ' ' || u.last_name AS assigned_name
     FROM crm_tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     ${where}
     ORDER BY
       CASE t.status WHEN 'complete' THEN 1 ELSE 0 END,
       t.due_date ASC NULLS LAST,
       t.priority DESC`,
    vals
  );
}

export async function createCRMTask(data: {
  title: string;
  description?: string;
  type: CRMTask["type"];
  priority: CRMTask["priority"];
  due_date?: string;
  entity_type?: "customer" | "company";
  entity_id?: number;
  entity_name?: string;
  assigned_to?: number;
}) {
  const session = await assertCRM();
  const assignedTo = data.assigned_to ?? session.id;
  const res = await query<{ id: number }>(
    `INSERT INTO crm_tasks
       (title, description, type, priority, due_date, entity_type, entity_id, entity_name, assigned_to, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [data.title, data.description ?? null, data.type, data.priority,
     data.due_date ?? null, data.entity_type ?? null, data.entity_id ?? null,
     data.entity_name ?? null, assignedTo, session.id]
  );
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
  return { ok: true, id: res[0].id };
}

export async function updateCRMTask(taskId: number, data: {
  title?: string;
  description?: string;
  type?: CRMTask["type"];
  priority?: CRMTask["priority"];
  status?: CRMTask["status"];
  due_date?: string | null;
  assigned_to?: number | null;
}) {
  const session = await assertCRM();
  const fields: string[] = [];
  const vals: unknown[] = [];
  let n = 1;

  if (data.title       !== undefined) { fields.push(`title=$${n++}`);       vals.push(data.title); }
  if (data.description !== undefined) { fields.push(`description=$${n++}`); vals.push(data.description); }
  if (data.type        !== undefined) { fields.push(`type=$${n++}`);        vals.push(data.type); }
  if (data.priority    !== undefined) { fields.push(`priority=$${n++}`);    vals.push(data.priority); }
  if (data.due_date    !== undefined) { fields.push(`due_date=$${n++}`);    vals.push(data.due_date); }
  if (data.assigned_to !== undefined) { fields.push(`assigned_to=$${n++}`); vals.push(data.assigned_to); }

  if (data.status !== undefined) {
    fields.push(`status=$${n++}`);
    vals.push(data.status);
    if (data.status === "complete") {
      fields.push(`completed_at=NOW()`);
    } else {
      fields.push(`completed_at=NULL`);
    }
  }

  fields.push(`updated_at=NOW()`);
  vals.push(taskId);

  await query(`UPDATE crm_tasks SET ${fields.join(",")} WHERE id=$${n}`, vals);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
  return { ok: true };
}

export async function deleteCRMTask(taskId: number) {
  await assertCRM();
  await query(`DELETE FROM crm_tasks WHERE id=$1`, [taskId]);
  revalidatePath("/crm/tasks");
  return { ok: true };
}

export async function getTaskCounts() {
  const session = await assertCRM();
  const isAdmin = session.role === "admin";
  const rows = await query<{ overdue: number; due_today: number; upcoming: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'complete')::int AS overdue,
       COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status != 'complete')::int AS due_today,
       COUNT(*) FILTER (WHERE due_date > CURRENT_DATE AND status != 'complete')::int AS upcoming
     FROM crm_tasks
     ${isAdmin ? "" : `WHERE assigned_to = ${session.id}`}`
  );
  return rows[0] ?? { overdue: 0, due_today: 0, upcoming: 0 };
}
