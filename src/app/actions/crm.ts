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
