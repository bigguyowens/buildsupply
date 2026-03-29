'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type SearchResult = {
  type: "customer" | "company" | "quote" | "task" | "order" | "return";
  id: number;
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
};

export async function globalCRMSearch(term: string): Promise<SearchResult[]> {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) return [];
  if (!term || term.trim().length < 2) return [];

  const q = `%${term.trim()}%`;
  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const id        = session.id;

  // Role-scoped customer WHERE clause
  const custScope = isAdmin
    ? `u.role NOT IN ('admin','account_manager','manager')`
    : isManager
      ? `u.role NOT IN ('admin','account_manager','manager') AND u.account_manager_id IN (SELECT id FROM users WHERE id=${id} OR manager_id=${id})`
      : `u.role NOT IN ('admin','account_manager','manager') AND u.account_manager_id=${id}`;

  const compScope = isAdmin
    ? `1=1`
    : isManager
      ? `c.account_manager_id IN (SELECT id FROM users WHERE id=${id} OR manager_id=${id})`
      : `c.account_manager_id=${id}`;

  const quoteScope = isAdmin
    ? `1=1`
    : isManager
      ? `q.customer_id IN (SELECT id FROM users WHERE account_manager_id IN (SELECT id FROM users WHERE id=${id} OR manager_id=${id}))`
      : `q.customer_id IN (SELECT id FROM users WHERE account_manager_id=${id})`;

  const taskScope = isAdmin
    ? `1=1`
    : isManager
      ? `t.assigned_to IN (SELECT id FROM users WHERE id=${id} OR manager_id=${id})`
      : `t.assigned_to=${id}`;

  const [customers, companies, quotes, tasks, orders, returnResults] = await Promise.all([
    // Customers
    query<{ id: number; first_name: string; last_name: string; email: string; am_name: string | null }>(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             am.first_name || ' ' || am.last_name AS am_name
      FROM users u
      LEFT JOIN users am ON am.id = u.account_manager_id
      WHERE ${custScope}
        AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1
             OR (u.first_name || ' ' || u.last_name) ILIKE $1
             OR u.email ILIKE $1)
      LIMIT 5
    `, [q]),

    // Companies
    query<{ id: number; name: string; industry: string | null; city: string | null }>(`
      SELECT c.id, c.name, c.industry, c.city
      FROM companies c
      WHERE ${compScope} AND c.name ILIKE $1
      LIMIT 4
    `, [q]),

    // Quotes — search by id or customer name
    query<{ id: number; customer_name: string; status: string; created_at: string }>(`
      SELECT q.id,
             u.first_name || ' ' || u.last_name AS customer_name,
             q.status, q.created_at
      FROM quotes q
      JOIN users u ON u.id = q.customer_id
      WHERE ${quoteScope}
        AND (q.id::text ILIKE $1
             OR (u.first_name || ' ' || u.last_name) ILIKE $1)
      ORDER BY q.created_at DESC
      LIMIT 4
    `, [q]),

    // Tasks
    query<{ id: number; title: string; type: string; status: string; due_date: string | null; entity_name: string | null }>(`
      SELECT t.id, t.title, t.type, t.status, t.due_date, t.entity_name
      FROM crm_tasks t
      WHERE ${taskScope}
        AND (t.title ILIKE $1 OR t.entity_name ILIKE $1)
        AND t.status != 'complete'
      LIMIT 4
    `, [q]),

    // Orders — by order ID or customer name
    query<{ id: number; customer_name: string; status: string; total: number; customer_id: number }>(`
      SELECT o.id,
             u.first_name || ' ' || u.last_name AS customer_name,
             o.status, o.total::numeric AS total, u.id AS customer_id
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE ${quoteScope.replace(/q\./g, "o.").replace(/q2\./g, "o.")}
        AND (o.id::text ILIKE $1
             OR (u.first_name || ' ' || u.last_name) ILIKE $1)
      ORDER BY o.created_at DESC
      LIMIT 4
    `, [q]),

    // Returns — by return ID, order ID, or customer name
    query<{ id: number; order_id: number; status: string; customer_name: string }>(`
      SELECT r.id, r.order_id, r.status,
             COALESCE(u.first_name || ' ' || u.last_name, 'Guest') AS customer_name
      FROM returns r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE (${quoteScope.replace(/q\./g, "r.").replace(/q2\./g, "r.")
               .replace("customer_id", "user_id")})
        AND (r.id::text ILIKE $1
             OR r.order_id::text ILIKE $1
             OR (u.first_name || ' ' || u.last_name) ILIKE $1)
      ORDER BY r.created_at DESC
      LIMIT 4
    `, [q]),
  ]);

  const results: SearchResult[] = [];

  customers.forEach(c => results.push({
    type: "customer",
    id: c.id,
    title: `${c.first_name} ${c.last_name}`,
    subtitle: c.email,
    href: `/crm/customers/${c.id}`,
    meta: c.am_name ?? undefined,
  }));

  companies.forEach(c => results.push({
    type: "company",
    id: c.id,
    title: c.name,
    subtitle: [c.industry, c.city].filter(Boolean).join(" · ") || "Company",
    href: `/crm/companies/${c.id}`,
  }));

  quotes.forEach(q => results.push({
    type: "quote",
    id: q.id,
    title: `Quote #${q.id}`,
    subtitle: q.customer_name,
    href: `/crm/quotes/${q.id}`,
    meta: q.status,
  }));

  tasks.forEach(t => results.push({
    type: "task",
    id: t.id,
    title: t.title,
    subtitle: t.entity_name ?? (t.type === "call" ? "Phone call" : "Email"),
    href: `/crm/tasks`,
    meta: t.due_date
      ? new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : undefined,
  }));

  orders.forEach(o => results.push({
    type: "order",
    id: o.id,
    title: `Order #${o.id}`,
    subtitle: o.customer_name,
    href: `/crm/orders`,
    meta: o.status,
  }));

  returnResults.forEach(r => results.push({
    type: "return",
    id: r.id,
    title: `Return #${r.id}`,
    subtitle: `${r.customer_name} · Order #${r.order_id}`,
    href: `/crm/returns`,
    meta: r.status,
  }));

  return results;
}
