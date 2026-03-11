"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendReturnConfirmation, sendReturnStatusUpdate } from "@/lib/email";
import type { ReturnStatusUpdateData } from "@/lib/email";

export type ReturnStatus = "requested" | "approved" | "received" | "refunded" | "rejected";

export type ReturnRow = {
  id: number;
  order_id: number;
  user_id: number;
  status: ReturnStatus;
  reason: string;
  notes: string | null;
  refund_amount: number | null;
  admin_notes: string | null;
  guest_email: string | null;
  created_at: string;
  updated_at: string;
  items: ReturnItemRow[];
  // joined
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type ReturnItemRow = {
  id: number;
  return_id: number;
  product_id: string;
  name: string;
  sku: string;
  image: string | null;
  price: number;
  quantity: number;
  reason: string | null;
};

export type SubmitReturnInput = {
  orderId: number;
  reason: string;
  notes?: string;
  items: { product_id: string; name: string; sku: string; image?: string; price: number; quantity: number; reason?: string }[];
};

// ── Customer: submit a return request ──────────────────────────────────
export async function submitReturn(input: SubmitReturnInput) {
  const session = await getSession();
  if (!session) return { error: "Not logged in" };

  // Check order belongs to user and is returnable
  const orders = await query<{ id: number; status: string }>(
    "SELECT id, status FROM orders WHERE id = $1 AND user_id = $2",
    [input.orderId, session.id]
  );
  if (!orders.length) return { error: "Order not found" };
  if (!["completed", "shipped"].includes(orders[0].status)) return { error: "Order is not eligible for return" };

  // Check no existing open return for this order
  const existing = await query<{ id: number }>(
    "SELECT id FROM returns WHERE order_id = $1 AND status NOT IN ('rejected','refunded')",
    [input.orderId]
  );
  if (existing.length) return { error: "A return request already exists for this order" };

  const [ret] = await query<{ id: number }>(
    `INSERT INTO returns (order_id, user_id, reason, notes) VALUES ($1,$2,$3,$4) RETURNING id`,
    [input.orderId, session.id, input.reason, input.notes ?? null]
  );

  for (const item of input.items) {
    await query(
      `INSERT INTO return_items (return_id, product_id, name, sku, image, price, quantity, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [ret.id, item.product_id, item.name, item.sku, item.image ?? null, item.price, item.quantity, item.reason ?? null]
    );
  }

  // Send confirmation email (fire-and-forget)
  const userRows = await query<{ email: string; first_name: string }>(
    "SELECT email, first_name FROM users WHERE id = $1",
    [session.id]
  );
  if (userRows.length) {
    sendReturnConfirmation({
      to: userRows[0].email,
      firstName: userRows[0].first_name,
      returnId: ret.id,
      orderId: input.orderId,
      items: input.items.map(i => ({ name: i.name, sku: i.sku, quantity: i.quantity, price: i.price })),
      reason: input.reason,
    }).catch(err => console.error("Return confirmation email failed:", err));
  }

  revalidatePath(`/account/orders/${input.orderId}`);
  revalidatePath("/account/returns");
  return { ok: true, returnId: ret.id };
}

// ── Customer: get their returns ─────────────────────────────────────────
export async function getMyReturns() {
  const session = await getSession();
  if (!session) return [];
  return query<ReturnRow>(
    `SELECT r.*, o.id as order_ref
     FROM returns r
     JOIN orders o ON o.id = r.order_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [session.id]
  );
}

// ── Customer: get return status for an order ────────────────────────────
export async function getReturnForOrder(orderId: number) {
  const session = await getSession();
  if (!session) return null;
  const rows = await query<ReturnRow>(
    `SELECT r.* FROM returns r WHERE r.order_id = $1 AND r.user_id = $2 LIMIT 1`,
    [orderId, session.id]
  );
  if (!rows.length) return null;
  const ret = rows[0];
  ret.items = await query<ReturnItemRow>(
    "SELECT * FROM return_items WHERE return_id = $1",
    [ret.id]
  );
  return ret;
}
// ── Admin: get all returns ──────────────────────────────────────────────
export async function getAdminReturns() {
  return query<ReturnRow & { first_name: string; last_name: string; email: string; item_count: number }>(
    `SELECT r.*,
            COALESCE(u.first_name, 'Guest')                          AS first_name,
            COALESCE(u.last_name, '')                                AS last_name,
            COALESCE(u.email, r.guest_email)                        AS email,
            (SELECT COUNT(*) FROM return_items ri WHERE ri.return_id = r.id)::int AS item_count
     FROM returns r
     LEFT JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC`
  );
}

// ── Admin: get single return with items ────────────────────────────────
export async function getAdminReturn(returnId: number) {
  const rows = await query<ReturnRow & { first_name: string; last_name: string; email: string; order_total: number }>(
    `SELECT r.*,
            COALESCE(u.first_name, 'Guest')      AS first_name,
            COALESCE(u.last_name, '')            AS last_name,
            COALESCE(u.email, r.guest_email)     AS email,
            o.total                              AS order_total
     FROM returns r
     LEFT JOIN users u ON u.id = r.user_id
     JOIN orders o ON o.id = r.order_id
     WHERE r.id = $1`,
    [returnId]
  );
  if (!rows.length) return null;
  const ret = rows[0];
  ret.items = await query<ReturnItemRow>(
    "SELECT * FROM return_items WHERE return_id = $1",
    [returnId]
  );
  return ret;
}

// ── Admin: update return status ─────────────────────────────────────────
export async function updateReturnStatus(returnId: number, status: ReturnStatus, adminNotes?: string, refundAmount?: number) {
  await query(
    `UPDATE returns SET status=$1, admin_notes=COALESCE($2, admin_notes),
     refund_amount=COALESCE($3::numeric, refund_amount), updated_at=NOW()
     WHERE id=$4`,
    [status, adminNotes ?? null, refundAmount ?? null, returnId]
  );

  // Send status update email for customer-facing statuses (fire-and-forget)
  if (["approved", "received", "refunded", "rejected"].includes(status)) {
    const rows = await query<{
      email: string; first_name: string; order_id: number; guest_email: string | null;
    }>(
      `SELECT u.email, u.first_name, r.order_id, r.guest_email
       FROM returns r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [returnId]
    );
    if (rows.length) {
      const row = rows[0];
      const toEmail = row.email ?? row.guest_email;
      const firstName = row.first_name ?? "Customer";
      if (toEmail) {
        sendReturnStatusUpdate({
          to: toEmail,
          firstName,
          returnId,
          orderId: row.order_id,
          status: status as ReturnStatusUpdateData["status"],
          refundAmount: refundAmount ?? undefined,
          adminNotes: adminNotes ?? undefined,
        }).catch(err => console.error("Return status email failed:", err));
      }
    }
  }

  revalidatePath("/admin/returns");
  return { ok: true };
}

// ── Guest: lookup order by id + email ──────────────────────────────────
export async function lookupGuestOrder(orderId: number, email: string) {
  const rows = await query<{
    id: number; status: string; items: string; created_at: string;
  }>(
    `SELECT id, status, items, created_at FROM orders
     WHERE id = $1
       AND user_id IS NULL
       AND LOWER((shipping->>'email')) = LOWER($2)`,
    [orderId, email]
  );
  if (!rows.length) return { error: "No order found with that order number and email address." };

  const order = rows[0];
  if (!["shipped", "completed"].includes(order.status)) {
    return { error: `Order #${orderId} is not eligible for return (status: ${order.status}).` };
  }

  // Check no existing open return
  const existing = await query<{ id: number }>(
    "SELECT id FROM returns WHERE order_id = $1 AND status NOT IN ('rejected','refunded')",
    [orderId]
  );
  if (existing.length) return { error: "A return request already exists for this order." };

  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items ?? "[]");
  return { ok: true, order: { ...order, items } };
}

// ── Guest: submit return without account ───────────────────────────────
export async function submitGuestReturn(input: SubmitReturnInput & { email: string }) {
  // Re-validate before inserting
  const lookup = await lookupGuestOrder(input.orderId, input.email);
  if ("error" in lookup) return { error: lookup.error };

  const [ret] = await query<{ id: number }>(
    `INSERT INTO returns (order_id, user_id, guest_email, reason, notes)
     VALUES ($1, NULL, $2, $3, $4) RETURNING id`,
    [input.orderId, input.email.toLowerCase(), input.reason, input.notes ?? null]
  );

  for (const item of input.items) {
    await query(
      `INSERT INTO return_items (return_id, product_id, name, sku, image, price, quantity, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [ret.id, item.product_id, item.name, item.sku, item.image ?? null, item.price, item.quantity, item.reason ?? null]
    );
  }

  // Send confirmation to guest email (fire-and-forget)
  sendReturnConfirmation({
    to: input.email,
    firstName: "Valued Customer",
    returnId: ret.id,
    orderId: input.orderId,
    items: input.items.map(i => ({ name: i.name, sku: i.sku, quantity: i.quantity, price: i.price })),
    reason: input.reason,
  }).catch(err => console.error("Guest return confirmation email failed:", err));

  revalidatePath("/returns");
  return { ok: true, returnId: ret.id };
}
