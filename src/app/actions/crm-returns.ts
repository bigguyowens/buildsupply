'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type CRMReturn = {
  id: number;
  order_id: number;
  status: string;
  reason: string;
  refund_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  item_count: number;
  customer_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  account_manager_id: number | null;
  account_manager_name: string | null;
};

export async function getCRMReturns(scope: "mine" | "all" = "mine"): Promise<CRMReturn[]> {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) return [];

  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const id        = session.id;

  const showAll = isAdmin || scope === "all";

  const scopeClause = showAll
    ? `1=1`
    : isManager
      ? `u.account_manager_id IN (SELECT id FROM users WHERE id = ${id} OR manager_id = ${id})`
      : `u.account_manager_id = ${id}`;

  return query<CRMReturn>(`
    SELECT r.id, r.order_id, r.status, r.reason,
           r.refund_amount::numeric AS refund_amount,
           r.admin_notes, r.created_at, r.updated_at,
           (SELECT COUNT(*)::int FROM return_items ri WHERE ri.return_id = r.id) AS item_count,
           u.id AS customer_id,
           COALESCE(u.first_name, 'Guest') AS first_name,
           COALESCE(u.last_name, '')       AS last_name,
           COALESCE(u.email, r.guest_email, '') AS email,
           u.account_manager_id,
           am.first_name || ' ' || am.last_name AS account_manager_name
    FROM returns r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN users am ON am.id = u.account_manager_id
    WHERE ${scopeClause}
    ORDER BY r.created_at DESC
  `);
}
