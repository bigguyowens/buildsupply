'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type CRMOrder = {
  id: number;
  status: string;
  total: number;
  created_at: string;
  item_count: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_manager_name: string | null;
  account_manager_id: number | null;
  promo_code: string | null;
  discount_amount: number;
};

export async function getCRMOrders(): Promise<CRMOrder[]> {
  const session = await getSession();
  if (!session || !["admin", "account_manager", "manager"].includes(session.role)) return [];

  const isAdmin   = session.role === "admin";
  const isManager = session.role === "manager";
  const id        = session.id;

  const scope = isAdmin
    ? `1=1`
    : isManager
      ? `u.account_manager_id IN (SELECT id FROM users WHERE id = ${id} OR manager_id = ${id})`
      : `u.account_manager_id = ${id}`;

  return query<CRMOrder>(`
    SELECT o.id, o.status, o.total::numeric AS total,
           o.created_at, o.promo_code,
           COALESCE(o.discount_amount, 0)::numeric AS discount_amount,
           jsonb_array_length(o.items) AS item_count,
           u.id AS customer_id,
           u.first_name, u.last_name, u.email,
           u.account_manager_id,
           am.first_name || ' ' || am.last_name AS account_manager_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN users am ON am.id = u.account_manager_id
    WHERE ${scope}
    ORDER BY o.created_at DESC
  `);
}
