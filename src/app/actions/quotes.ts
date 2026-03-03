'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type QuoteItemInput = {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string;
  product_slug: string;
  quantity: number;
  original_price: number;
  quoted_price: number;
};

export type QuoteFormData = {
  customer_id: number;
  items: QuoteItemInput[];
  notes: string;
  internal_notes: string;
  expires_at: string; // ISO date string
};

// ── Admin: create a new quote (draft) ─────────────────────────────────────
export async function createQuoteAction(data: QuoteFormData): Promise<{ success: true; quoteId: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };
  if (!data.items.length) return { success: false, error: "Quote must have at least one item." };

  try {
    const [row] = await query<{ id: number }>(`
      INSERT INTO quotes (customer_id, created_by_id, status, expires_at, notes, internal_notes)
      VALUES ($1, $2, 'draft', $3, $4, $5)
      RETURNING id
    `, [data.customer_id, session.id, data.expires_at || null, data.notes || null, data.internal_notes || null]);

    for (const item of data.items) {
      await query(`
        INSERT INTO quote_items (quote_id, product_id, product_name, product_sku, product_image, product_slug, quantity, original_price, quoted_price)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [row.id, item.product_id, item.product_name, item.product_sku, item.product_image, item.product_slug, item.quantity, item.original_price, item.quoted_price]);
    }

    revalidatePath("/admin/quotes");
    return { success: true, quoteId: row.id };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to create quote." };
  }
}

// ── Admin: send quote to customer (draft → sent) ───────────────────────────
export async function sendQuoteAction(quoteId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await query(`UPDATE quotes SET status='sent', updated_at=NOW() WHERE id=$1 AND status='draft'`, [quoteId]);
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send quote." };
  }
}

// ── Admin: update quote items/notes (draft only) ──────────────────────────
export async function updateQuoteAction(quoteId: number, data: Partial<QuoteFormData>): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await query(`
      UPDATE quotes SET notes=$1, internal_notes=$2, expires_at=$3, updated_at=NOW()
      WHERE id=$4 AND status='draft'
    `, [data.notes ?? null, data.internal_notes ?? null, data.expires_at ?? null, quoteId]);

    if (data.items?.length) {
      await query(`DELETE FROM quote_items WHERE quote_id=$1`, [quoteId]);
      for (const item of data.items) {
        await query(`
          INSERT INTO quote_items (quote_id, product_id, product_name, product_sku, product_image, product_slug, quantity, original_price, quoted_price)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `, [quoteId, item.product_id, item.product_name, item.product_sku, item.product_image, item.product_slug, item.quantity, item.original_price, item.quoted_price]);
      }
    }

    revalidatePath(`/admin/quotes/${quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update quote." };
  }
}

// ── Customer: accept a quote ───────────────────────────────────────────────
export async function acceptQuoteAction(quoteId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not logged in." };

  try {
    const result = await query(`
      UPDATE quotes SET status='accepted', updated_at=NOW()
      WHERE id=$1 AND customer_id=$2 AND status='sent'
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [quoteId, session.id]);
    if ((result as unknown as { rowCount: number }).rowCount === 0)
      return { success: false, error: "Quote cannot be accepted." };
    revalidatePath("/account/quotes");
    revalidatePath(`/account/quotes/${quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to accept quote." };
  }
}

// ── Customer: decline a quote ──────────────────────────────────────────────
export async function declineQuoteAction(quoteId: number): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not logged in." };

  try {
    await query(`
      UPDATE quotes SET status='declined', updated_at=NOW()
      WHERE id=$1 AND customer_id=$2 AND status IN ('sent','accepted')
    `, [quoteId, session.id]);
    revalidatePath("/account/quotes");
    revalidatePath(`/account/quotes/${quoteId}`);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to decline quote." };
  }
}

// ── Customer: place order from an accepted quote ───────────────────────────
export async function placeQuoteOrderAction(
  quoteId: number,
  shipping: {
    firstName: string; lastName: string; email: string; phone: string;
    company: string; address: string; city: string; state: string; zip: string; country: string;
  }
): Promise<{ success: true; orderId: number } | { success: false; error: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not logged in." };

  try {
    const [quote] = await query<{ id: number; customer_id: number; status: string }>(
      `SELECT id, customer_id, status FROM quotes WHERE id=$1`, [quoteId]
    );
    if (!quote || quote.customer_id !== session.id)
      return { success: false, error: "Quote not found." };
    if (quote.status !== "accepted")
      return { success: false, error: "Quote must be accepted before checkout." };

    const items = await query<{
      product_id: string; product_name: string; product_sku: string;
      product_image: string; product_slug: string; quantity: number; quoted_price: number;
    }>(`SELECT * FROM quote_items WHERE quote_id=$1`, [quoteId]);

    const orderItems = items.map(i => ({
      id: i.product_id, name: i.product_name, slug: i.product_slug,
      image: i.product_image, price: Number(i.quoted_price),
      quantity: i.quantity, sku: i.product_sku, brand: "",
    }));

    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const TAX_RATE = 0.07;
    const SHIP_FEE = subtotal < 500 ? 29.99 : 0;
    const total    = subtotal + SHIP_FEE + subtotal * TAX_RATE;

    const [orderRow] = await query<{ id: number }>(`
      INSERT INTO orders (user_id, status, total, items, shipping)
      VALUES ($1, 'pending', $2, $3, $4)
      RETURNING id
    `, [session.id, total, JSON.stringify(orderItems), JSON.stringify(shipping)]);

    // Link order to quote, mark converted
    await query(`UPDATE quotes SET status='accepted', order_id=$1, updated_at=NOW() WHERE id=$2`, [orderRow.id, quoteId]);

    revalidatePath("/account/quotes");
    return { success: true, orderId: orderRow.id };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to place order." };
  }
}
