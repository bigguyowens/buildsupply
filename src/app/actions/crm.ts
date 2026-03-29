"use server";

import { query } from "@/lib/db";
import { getHealthScoreConfig, type HealthScoreConfig } from "@/app/actions/health-config";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ── Auth guard ─────────────────────────────────────────────────────────────
async function assertCRM() {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) {
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
  const session = await assertCRM();
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";

  // Build a subquery that scopes customers to this user's visibility
  const customerScope = isAdmin
    ? `u.role NOT IN ('admin','account_manager','manager')`
    : isManager
      ? `u.account_manager_id IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id})`
      : `u.account_manager_id = ${session.id}`;

  const orderScope = isAdmin
    ? `1=1`
    : isManager
      ? `o.user_id IN (SELECT id FROM users WHERE account_manager_id IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id}))`
      : `o.user_id IN (SELECT id FROM users WHERE account_manager_id = ${session.id})`;

  const quoteScope = isAdmin
    ? `1=1`
    : isManager
      ? `q.customer_id IN (SELECT id FROM users WHERE account_manager_id IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id}))`
      : `q.customer_id IN (SELECT id FROM users WHERE account_manager_id = ${session.id})`;

  const activityScope = isAdmin
    ? `1=1`
    : isManager
      ? `a.customer_id IN (SELECT id FROM users WHERE account_manager_id IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id}))`
      : `a.customer_id IN (SELECT id FROM users WHERE account_manager_id = ${session.id})`;

  const [customers, orders, quotes, contacts, recentActivity] = await Promise.all([
    query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM users u WHERE ${customerScope}`
    ),
    query<{ count: number; total: number; today: number }>(
      `SELECT COUNT(*)::int AS count,
              COALESCE(SUM(total),0)::numeric AS total,
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS today
       FROM orders o WHERE ${orderScope}`
    ),
    query<{ open: number }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'sent')::int AS open
       FROM quotes q WHERE ${quoteScope}`
    ),
    // Contacts: admins see all, others see contacts from their scoped customers' emails
    isAdmin
      ? query<{ pending: number }>(
          `SELECT COUNT(*) FILTER (WHERE status = 'new')::int AS pending FROM contact_submissions`
        )
      : query<{ pending: number }>(
          `SELECT COUNT(*) FILTER (WHERE cs.status = 'new')::int AS pending
           FROM contact_submissions cs
           WHERE cs.email IN (
             SELECT email FROM users u WHERE ${customerScope}
           )`
        ),
    query<CRMActivity & { customer_name: string }>(
      `SELECT a.*,
              u2.first_name || ' ' || u2.last_name AS customer_name,
              COALESCE(u3.first_name || ' ' || u3.last_name, 'System') AS author_name
       FROM crm_activities a
       JOIN users u2 ON u2.id = a.customer_id
       LEFT JOIN users u3 ON u3.id = a.author_id
       WHERE ${activityScope}
       ORDER BY a.created_at DESC LIMIT 10`
    ),
  ]);

  return {
    customerCount:   customers[0]?.count ?? 0,
    orderCount:      orders[0]?.count ?? 0,
    totalRevenue:    Number(orders[0]?.total ?? 0),
    ordersToday:     orders[0]?.today ?? 0,
    openQuotes:      quotes[0]?.open ?? 0,
    pendingContacts: contacts[0]?.pending ?? 0,
    recentActivity,
    // Pass scopes through for enhanced dashboard to reuse
    _scopes: { customerScope, orderScope, quoteScope },
    _session: { id: session.id, role: session.role,
                name: `${session.firstName} ${session.lastName}` },
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
  const allowed = ["customer", "company_admin", "account_manager", "manager", "admin"];
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
     WHERE u.role IN ('admin','account_manager','manager')
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
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";

  const conditions: string[] = [];
  const vals: unknown[] = [];
  let n = 1;

  if (isAdmin) {
    // Admins see all tasks — no scoping unless explicitly filtered
  } else if (isManager) {
    // Managers see tasks assigned to themselves or their AMs
    // Unless a specific assignedTo filter is passed
    if (!filters?.assignedTo) {
      conditions.push(`t.assigned_to IN (
        SELECT id FROM users WHERE id = $${n} OR manager_id = $${n}
      )`);
      vals.push(session.id);
      n++;
    }
  } else {
    // AMs only see their own tasks
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

// Staff list for filtering tasks (admin sees all AMs, manager sees their team)
export async function getTaskStaff(): Promise<{ id: number; first_name: string; last_name: string; role: string }[]> {
  const session = await assertCRM();
  if (session.role === "admin") {
    return query(
      `SELECT id, first_name, last_name, role FROM users
       WHERE role IN ('admin','manager','account_manager')
       ORDER BY role ASC, first_name ASC`
    );
  }
  if (session.role === "manager") {
    return query(
      `SELECT id, first_name, last_name, role FROM users
       WHERE id = $1 OR manager_id = $1
       ORDER BY role ASC, first_name ASC`,
      [session.id]
    );
  }
  return [];
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
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";

  const scopeWhere = isAdmin
    ? ""
    : isManager
      ? `WHERE assigned_to IN (SELECT id FROM users WHERE id = ${session.id} OR manager_id = ${session.id})`
      : `WHERE assigned_to = ${session.id}`;

  const rows = await query<{ overdue: number; due_today: number; upcoming: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'complete')::int AS overdue,
       COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status != 'complete')::int AS due_today,
       COUNT(*) FILTER (WHERE due_date > CURRENT_DATE AND status != 'complete')::int AS upcoming
     FROM crm_tasks ${scopeWhere}`
  );
  return rows[0] ?? { overdue: 0, due_today: 0, upcoming: 0 };
}

// ── Analytics ──────────────────────────────────────────────────────────────
const safeQuery = async <T>(fn: () => Promise<T[]>, fallback: T[] = []): Promise<T[]> => {
  try { return await fn(); } catch (e) { console.error("[crm analytics]", (e as Error).message); return fallback; }
};

export async function getRevenueAnalytics() {
  const session = await assertCRM();

  const monthlyRevenue = await safeQuery(() => query<{ month: string; revenue: number; orders: number }>(
    `SELECT TO_CHAR(gs.month_date, 'Mon YY') AS month,
            COALESCE(SUM(o.total),0)::numeric AS revenue,
            COUNT(o.id)::int AS orders
     FROM generate_series(
       DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
       DATE_TRUNC('month', NOW()),
       '1 month'
     ) AS gs(month_date)
     LEFT JOIN orders o ON DATE_TRUNC('month', o.created_at) = gs.month_date
       AND o.status != 'cancelled'
     GROUP BY gs.month_date
     ORDER BY gs.month_date ASC`
  ));

  // Revenue by AM
  const isAdmin = ["admin", "manager"].includes(session.role);
  const revenueByAM = await safeQuery(() => query<{ am_name: string; revenue: number; orders: number; customers: number }>(
    isAdmin
      ? `SELECT COALESCE(am.first_name || ' ' || am.last_name, 'Unassigned') AS am_name,
                COALESCE(SUM(o.total),0)::numeric AS revenue,
                COUNT(DISTINCT o.id)::int AS orders,
                COUNT(DISTINCT u.id)::int AS customers
         FROM users am
         JOIN users u ON u.account_manager_id = am.id
         LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
         WHERE am.role IN ('account_manager','manager','admin')
         GROUP BY am.id, am.first_name, am.last_name
         ORDER BY revenue DESC`
      : `SELECT COALESCE(am.first_name || ' ' || am.last_name, 'Unassigned') AS am_name,
                COALESCE(SUM(o.total),0)::numeric AS revenue,
                COUNT(DISTINCT o.id)::int AS orders,
                COUNT(DISTINCT u.id)::int AS customers
         FROM users am
         JOIN users u ON u.account_manager_id = am.id
         LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
         WHERE am.id = $1
         GROUP BY am.id, am.first_name, am.last_name`,
    isAdmin ? [] : [session.id]
  ));

  const quotePipeline = await safeQuery(() => query<{ status: string; count: number; value: number }>(
    `SELECT q.status,
            COUNT(q.id)::int AS count,
            COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS value
     FROM quotes q
     LEFT JOIN quote_items qi ON qi.quote_id = q.id
     WHERE q.status != 'draft'
     GROUP BY q.status`
  ));

  const topCustomers = await safeQuery(() => query<{ name: string; email: string; revenue: number; orders: number }>(
    `SELECT u.first_name || ' ' || u.last_name AS name,
            u.email,
            COALESCE(SUM(o.total),0)::numeric AS revenue,
            COUNT(o.id)::int AS orders
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
     WHERE u.role NOT IN ('admin','account_manager','manager')
     GROUP BY u.id
     ORDER BY revenue DESC
     LIMIT 8`
  ));

  const winRateRows = await safeQuery(() => query<{ total: number; accepted: number; declined: number; pending: number }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='accepted')::int AS accepted,
            COUNT(*) FILTER (WHERE status='declined')::int AS declined,
            COUNT(*) FILTER (WHERE status='sent')::int AS pending
     FROM quotes WHERE status != 'draft'`
  ), [{ total: 0, accepted: 0, declined: 0, pending: 0 }]);

  const winRate = winRateRows[0] ?? { total: 0, accepted: 0, declined: 0, pending: 0 };

  return { monthlyRevenue, revenueByAM, quotePipeline, topCustomers, winRate };
}

// ── AM Performance ─────────────────────────────────────────────────────────
export type AMPerformance = {
  id: number;
  name: string;
  email: string;
  role: string;
  manager_name: string | null;
  customer_count: number;
  company_count: number;
  revenue: number;
  order_count: number;
  open_quotes: number;
  quote_value: number;
  win_rate: number;
  tasks_total: number;
  tasks_overdue: number;
  onboarding_avg: number;
};

export async function getAMPerformance(): Promise<AMPerformance[]> {
  const session = await assertCRM();
  if (!["admin", "manager"].includes(session.role)) return [];

  const today = new Date().toISOString().split("T")[0];

  const rows = await query<AMPerformance>(
    session.role === "admin"
      ? `SELECT am.id, am.first_name || ' ' || am.last_name AS name, am.email, am.role,
                mgr.first_name || ' ' || mgr.last_name AS manager_name,
                COUNT(DISTINCT u.id)::int AS customer_count,
                COUNT(DISTINCT c.id)::int AS company_count,
                COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'),0)::numeric AS revenue,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status != 'cancelled')::int AS order_count,
                COUNT(DISTINCT q.id) FILTER (WHERE q.status='sent')::int AS open_quotes,
                COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS quote_value,
                CASE WHEN COUNT(q.id) FILTER (WHERE q.status IN ('accepted','declined')) = 0 THEN 0
                     ELSE ROUND(COUNT(q.id) FILTER (WHERE q.status='accepted') * 100.0
                          / NULLIF(COUNT(q.id) FILTER (WHERE q.status IN ('accepted','declined')),0))
                END::int AS win_rate,
                COUNT(DISTINCT t.id)::int AS tasks_total,
                COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < $1 AND t.status != 'complete')::int AS tasks_overdue,
                COALESCE(AVG(
                  (SELECT COUNT(*) FILTER (WHERE op2.status='complete') * 100.0 / NULLIF(COUNT(*),0)
                   FROM onboarding_progress op2
                   WHERE op2.entity_type='customer' AND op2.entity_id=u.id)
                ),0)::int AS onboarding_avg
         FROM users am
         LEFT JOIN users mgr ON mgr.id = am.manager_id
         LEFT JOIN users u ON u.account_manager_id = am.id
         LEFT JOIN companies c ON c.account_manager_id = am.id
         LEFT JOIN orders o ON o.user_id = u.id
         LEFT JOIN quotes q ON q.customer_id = u.id AND q.status != 'draft'
         LEFT JOIN quote_items qi ON qi.quote_id = q.id AND q.status != 'draft'
         LEFT JOIN crm_tasks t ON t.assigned_to = am.id
         WHERE am.role = 'account_manager'
         GROUP BY am.id, am.first_name, am.last_name, am.email, am.role, mgr.first_name, mgr.last_name
         ORDER BY revenue DESC`
      : `SELECT am.id, am.first_name || ' ' || am.last_name AS name, am.email, am.role,
                mgr.first_name || ' ' || mgr.last_name AS manager_name,
                COUNT(DISTINCT u.id)::int AS customer_count,
                COUNT(DISTINCT c.id)::int AS company_count,
                COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'),0)::numeric AS revenue,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status != 'cancelled')::int AS order_count,
                COUNT(DISTINCT q.id) FILTER (WHERE q.status='sent')::int AS open_quotes,
                COALESCE(SUM(qi.quantity * qi.quoted_price),0)::numeric AS quote_value,
                CASE WHEN COUNT(q.id) FILTER (WHERE q.status IN ('accepted','declined')) = 0 THEN 0
                     ELSE ROUND(COUNT(q.id) FILTER (WHERE q.status='accepted') * 100.0
                          / NULLIF(COUNT(q.id) FILTER (WHERE q.status IN ('accepted','declined')),0))
                END::int AS win_rate,
                COUNT(DISTINCT t.id)::int AS tasks_total,
                COUNT(DISTINCT t.id) FILTER (WHERE t.due_date < $1 AND t.status != 'complete')::int AS tasks_overdue,
                COALESCE(AVG(
                  (SELECT COUNT(*) FILTER (WHERE op2.status='complete') * 100.0 / NULLIF(COUNT(*),0)
                   FROM onboarding_progress op2
                   WHERE op2.entity_type='customer' AND op2.entity_id=u.id)
                ),0)::int AS onboarding_avg
         FROM users am
         LEFT JOIN users mgr ON mgr.id = am.manager_id
         LEFT JOIN users u ON u.account_manager_id = am.id
         LEFT JOIN companies c ON c.account_manager_id = am.id
         LEFT JOIN orders o ON o.user_id = u.id
         LEFT JOIN quotes q ON q.customer_id = u.id AND q.status != 'draft'
         LEFT JOIN quote_items qi ON qi.quote_id = q.id AND q.status != 'draft'
         LEFT JOIN crm_tasks t ON t.assigned_to = am.id
         WHERE am.role = 'account_manager' AND am.manager_id = $2
         GROUP BY am.id, am.first_name, am.last_name, am.email, am.role, mgr.first_name, mgr.last_name
         ORDER BY revenue DESC`,
    session.role === "admin" ? [today] : [today, session.id]
  );

  return rows;
}

// ── Customer Health Score ─────────────────────────────────────────────────
export type HealthScore = {
  score: number;
  label: "Healthy" | "At Risk" | "Needs Attention" | "New";
  color: string;
  bg: string;
  breakdown: {
    recency: number;
    frequency: number;
    spend: number;
    onboarding: number;
    engagement: number;
    quotes: number;
  };
};

export type CustomerWithHealth = CRMCustomer & HealthScore;

function calcHealth(row: {
  order_count: number;
  total_spent: number;
  last_order_days: number | null;
  last_activity_days: number | null;
  onboarding_pct: number;
  note_count: number;
  accepted_quotes: number;
  avg_spend: number;
}, cfg: HealthScoreConfig): HealthScore {
  // Recency
  const recency =
    row.last_order_days === null          ? 0 :
    row.last_order_days <= cfg.recency_great ? cfg.recency_pts_great :
    row.last_order_days <= cfg.recency_good  ? cfg.recency_pts_good  :
    row.last_order_days <= cfg.recency_ok    ? cfg.recency_pts_ok    :
    cfg.recency_pts_stale;

  // Frequency
  const frequency =
    row.order_count >= cfg.freq_high ? cfg.freq_pts_high :
    row.order_count >= cfg.freq_mid  ? cfg.freq_pts_mid  :
    row.order_count >= cfg.freq_low  ? cfg.freq_pts_low  : 0;

  // Spend vs avg
  const spendRatio = cfg.pts_spend > 0 && row.avg_spend > 0
    ? Number(row.total_spent) / row.avg_spend : 0;
  const spend = Math.min(cfg.pts_spend, Math.round(spendRatio * (cfg.pts_spend / 2)));

  // Onboarding
  const onboarding = Math.round(row.onboarding_pct * (cfg.pts_onboarding / 100));

  // Engagement
  const engageDays = row.last_activity_days ?? 999;
  const engagement =
    engageDays <= cfg.engage_great ? cfg.engage_pts_great :
    engageDays <= cfg.engage_good  ? cfg.engage_pts_good  :
    engageDays <= cfg.engage_ok    ? cfg.engage_pts_ok    :
    row.note_count > 0 ? cfg.engage_pts_note : 0;

  // Quotes
  const quotes = row.accepted_quotes > 0 ? cfg.pts_quotes : 0;

  const score = Math.min(100, recency + frequency + spend + onboarding + engagement + quotes);

  const isNew = row.order_count === 0 && (row.last_activity_days ?? 999) > 30;
  const label: HealthScore["label"] =
    isNew                         ? "New" :
    score >= cfg.threshold_healthy ? "Healthy" :
    score >= cfg.threshold_at_risk ? "At Risk" : "Needs Attention";

  const colors: Record<HealthScore["label"], { color: string; bg: string }> = {
    "Healthy":         { color: "#15803d", bg: "#dcfce7" },
    "At Risk":         { color: "#92400e", bg: "#fef3c7" },
    "Needs Attention": { color: "#991b1b", bg: "#fee2e2" },
    "New":             { color: "#1e40af", bg: "#dbeafe" },
  };

  return {
    score,
    label,
    color: colors[label].color,
    bg: colors[label].bg,
    breakdown: { recency, frequency, spend, onboarding, engagement, quotes },
  };
}

export async function getCustomersWithHealth(scopeWhere?: string): Promise<CustomerWithHealth[]> {
  await assertCRM();

  const [avgSpendRow, cfg] = await Promise.all([
    query<{ avg: number }>(
      `SELECT COALESCE(AVG(total),0)::numeric AS avg FROM orders WHERE status != 'cancelled'`
    ),
    getHealthScoreConfig(),
  ]);
  const avgSpend = Number(avgSpendRow[0]?.avg ?? 0);

  const whereClause = scopeWhere
    ? `WHERE ${scopeWhere}`
    : `WHERE u.role NOT IN ('admin','account_manager','manager')`;

  const rows = await query<{
    id: number; first_name: string; last_name: string; email: string;
    role: string; created_at: string;
    order_count: number; total_spent: number;
    last_order_at: string | null; last_activity_at: string | null;
    open_quotes: number; note_count: number;
    account_manager_name: string | null; account_manager_id: number | null;
    last_order_days: number | null; last_activity_days: number | null;
    onboarding_pct: number; accepted_quotes: number;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
            COUNT(DISTINCT o.id)::int AS order_count,
            COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'),0)::numeric AS total_spent,
            MAX(o.created_at) AS last_order_at,
            MAX(a.created_at) AS last_activity_at,
            COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'sent')::int AS open_quotes,
            COUNT(DISTINCT n.id)::int AS note_count,
            am.first_name || ' ' || am.last_name AS account_manager_name,
            u.account_manager_id,
            EXTRACT(DAY FROM NOW() - MAX(o.created_at))::int AS last_order_days,
            EXTRACT(DAY FROM NOW() - MAX(a.created_at))::int AS last_activity_days,
            COALESCE(
              (SELECT COUNT(*) FILTER (WHERE op.status='complete') * 100.0 / NULLIF(COUNT(*),0)
               FROM onboarding_progress op WHERE op.entity_type='customer' AND op.entity_id=u.id)
            ,0)::int AS onboarding_pct,
            COUNT(DISTINCT q2.id) FILTER (WHERE q2.status='accepted')::int AS accepted_quotes
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN quotes q ON q.customer_id = u.id
     LEFT JOIN quotes q2 ON q2.customer_id = u.id
     LEFT JOIN crm_activities a ON a.customer_id = u.id
     LEFT JOIN crm_notes n ON n.customer_id = u.id
     LEFT JOIN users am ON am.id = u.account_manager_id
     ${whereClause}
     GROUP BY u.id, am.first_name, am.last_name
     ORDER BY u.first_name ASC`
  );

  return rows.map(row => ({
    ...row,
    ...calcHealth({ ...row, avg_spend: avgSpend }, cfg),
  }));
}

export async function getHealthSummary(scopeWhere?: string) {
  await assertCRM();
  const customers = await getCustomersWithHealth(scopeWhere);
  return {
    healthy:        customers.filter(c => c.label === "Healthy").length,
    atRisk:         customers.filter(c => c.label === "At Risk").length,
    needsAttention: customers.filter(c => c.label === "Needs Attention").length,
    new:            customers.filter(c => c.label === "New").length,
    total:          customers.length,
    avgScore:       customers.length > 0
                      ? Math.round(customers.reduce((s, c) => s + c.score, 0) / customers.length)
                      : 0,
  };
}

// ── Enhanced dashboard data ────────────────────────────────────────────────
export async function getCRMDashboardEnhanced() {
  await assertCRM();

  const base = await getCRMDashboard();
  const { customerScope, orderScope, quoteScope } = base._scopes;
  const { id: sessionId, role: sessionRole } = base._session;

  const [
    healthSummary,
    revenueSparkline,
    topCustomers,
    quoteStats,
    recentTasks,
  ] = await Promise.all([
    getHealthSummary(customerScope),

    // 6-month revenue sparkline — scoped
    query<{ month: string; revenue: number }>(`
      SELECT TO_CHAR(gs.m, 'Mon') AS month,
             COALESCE(SUM(o.total),0)::numeric AS revenue
      FROM generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
        DATE_TRUNC('month', NOW()),
        '1 month'
      ) AS gs(m)
      LEFT JOIN orders o ON DATE_TRUNC('month', o.created_at) = gs.m
        AND o.status != 'cancelled'
        AND ${orderScope}
      GROUP BY gs.m ORDER BY gs.m ASC
    `),

    // Top 5 customers by revenue — scoped
    query<{ id: number; first_name: string; last_name: string; revenue: number; order_count: number }>(`
      SELECT u.id, u.first_name, u.last_name,
             COALESCE(SUM(o.total),0)::numeric AS revenue,
             COUNT(o.id)::int AS order_count
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
      WHERE ${customerScope}
      GROUP BY u.id ORDER BY revenue DESC LIMIT 5
    `),

    // Quote win rate — scoped
    query<{ total: number; accepted: number; pending: number }>(`
      SELECT COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status='accepted')::int AS accepted,
             COUNT(*) FILTER (WHERE status='sent')::int AS pending
      FROM quotes q WHERE ${quoteScope} AND status != 'draft'
    `),

    // Next 3 tasks — already role-scoped via getCRMTasks but inline for perf
    query<{ id: number; title: string; due_date: string; type: string; entity_name: string | null; assigned_name: string | null }>(`
      SELECT t.id, t.title, t.due_date, t.type, t.entity_name,
             u.first_name || ' ' || u.last_name AS assigned_name
      FROM crm_tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.status != 'complete'
        AND (
          ${sessionRole === "admin"
            ? "1=1"
            : sessionRole === "manager"
              ? `t.assigned_to IN (SELECT id FROM users WHERE id = ${sessionId} OR manager_id = ${sessionId})`
              : `t.assigned_to = ${sessionId}`
          }
        )
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 3
    `),
  ]);

  const qs = quoteStats[0] ?? { total: 0, accepted: 0, pending: 0 };
  const winRate = qs.total > 0 ? Math.round((qs.accepted / qs.total) * 100) : 0;

  return {
    ...base,
    healthSummary,
    revenueSparkline,
    topCustomers,
    winRate,
    openQuotes: qs.pending,
    recentTasks,
    sessionRole,
    sessionName: base._session.name,
  };
}

// ── Single customer health score ───────────────────────────────────────────
export async function getCustomerHealth(customerId: number): Promise<HealthScore | null> {
  await assertCRM();

  const [avgSpendRow, cfg] = await Promise.all([
    query<{ avg: number }>(
      `SELECT COALESCE(AVG(total),0)::numeric AS avg FROM orders WHERE status != 'cancelled'`
    ),
    getHealthScoreConfig(),
  ]);
  const avgSpend = Number(avgSpendRow[0]?.avg ?? 0);

  const rows = await query<{
    order_count: number; total_spent: number;
    last_order_days: number | null; last_activity_days: number | null;
    onboarding_pct: number; note_count: number; accepted_quotes: number;
  }>(
    `SELECT
       COUNT(DISTINCT o.id)::int AS order_count,
       COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'),0)::numeric AS total_spent,
       EXTRACT(DAY FROM NOW() - MAX(o.created_at))::int AS last_order_days,
       EXTRACT(DAY FROM NOW() - MAX(a.created_at))::int AS last_activity_days,
       COALESCE(
         (SELECT COUNT(*) FILTER (WHERE op.status='complete') * 100.0 / NULLIF(COUNT(*),0)
          FROM onboarding_progress op WHERE op.entity_type='customer' AND op.entity_id=$1)
       ,0)::int AS onboarding_pct,
       COUNT(DISTINCT n.id)::int AS note_count,
       COUNT(DISTINCT q.id) FILTER (WHERE q.status='accepted')::int AS accepted_quotes
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     LEFT JOIN crm_activities a ON a.customer_id = u.id
     LEFT JOIN crm_notes n ON n.customer_id = u.id
     LEFT JOIN quotes q ON q.customer_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [customerId]
  );

  if (!rows.length) return null;
  return calcHealth({ ...rows[0], avg_spend: avgSpend }, cfg);
}
