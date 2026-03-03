// Server-only DB functions — do NOT import this in client components
import { query } from "@/lib/db";
import type { Quote, QuoteItem, QuoteInput } from "@/lib/quote-types";

export type { Quote, QuoteItem, QuoteInput, QuoteStatus, QuoteStatus as QuoteStatusType } from "@/lib/quote-types";
export { quoteSubtotal, quoteTotals, STATUS_STYLE } from "@/lib/quote-types";

// ── Admin reads ───────────────────────────────────────────────────────────

export async function adminGetQuotes(): Promise<Quote[]> {
  return query<Quote>(`
    SELECT q.*,
      u.first_name || ' ' || u.last_name AS customer_name,
      u.email AS customer_email,
      a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    JOIN users a ON a.id = q.created_by
    ORDER BY q.created_at DESC
  `);
}

export async function adminGetQuoteById(id: number): Promise<Quote | null> {
  const [quote] = await query<Quote>(`
    SELECT q.*,
      u.first_name || ' ' || u.last_name AS customer_name,
      u.email AS customer_email,
      a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users u ON u.id = q.customer_id
    JOIN users a ON a.id = q.created_by
    WHERE q.id = $1
  `, [id]);
  if (!quote) return null;
  quote.items = await query<QuoteItem>(
    `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id ASC`, [id]
  );
  return quote;
}

export async function getCustomers(): Promise<{ id: number; name: string; email: string }[]> {
  return query(`
    SELECT id, first_name || ' ' || last_name AS name, email
    FROM users WHERE role != 'admin' ORDER BY first_name ASC
  `);
}

// ── Customer reads ────────────────────────────────────────────────────────

export async function getCustomerQuotes(userId: number): Promise<Quote[]> {
  return query<Quote>(`
    SELECT q.*,
      a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users a ON a.id = q.created_by
    WHERE q.customer_id = $1
    ORDER BY q.created_at DESC
  `, [userId]);
}

export async function getCustomerQuoteById(id: number, userId: number): Promise<Quote | null> {
  const [quote] = await query<Quote>(`
    SELECT q.*,
      a.first_name || ' ' || a.last_name AS created_by_name
    FROM quotes q
    JOIN users a ON a.id = q.created_by
    WHERE q.id = $1 AND q.customer_id = $2
  `, [id, userId]);
  if (!quote) return null;
  quote.items = await query<QuoteItem>(
    `SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id ASC`, [id]
  );
  return quote;
}
