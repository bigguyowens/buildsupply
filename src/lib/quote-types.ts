// Pure utility functions — no DB imports, safe for client components

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired" | "ordered";

export type QuoteItem = {
  id: number;
  quote_id: number;
  product_id: string | null;
  name: string;
  description: string;
  sku: string;
  image: string;
  qty: number;
  unit_price: number;
};

export type Quote = {
  id: number;
  customer_id: number;
  created_by: number;
  status: QuoteStatus;
  title: string;
  notes: string;
  expires_at: string | null;
  order_id: number | null;
  created_at: string;
  updated_at: string;
  // joined
  customer_name?: string;
  customer_email?: string;
  created_by_name?: string;
  items?: QuoteItem[];
};

export type QuoteInput = {
  customer_id: number;
  title: string;
  notes: string;
  expires_at: string | null;
  items: Omit<QuoteItem, "id" | "quote_id">[];
};

export const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "#f1f5f9", color: "#64748b" },
  sent:     { bg: "#dbeafe", color: "#1d4ed8" },
  accepted: { bg: "#dcfce7", color: "#15803d" },
  declined: { bg: "#fee2e2", color: "#dc2626" },
  expired:  { bg: "#fef3c7", color: "#b45309" },
  ordered:  { bg: "#ede9fe", color: "#7c3aed" },
};

export function quoteSubtotal(items: QuoteItem[]): number {
  return items.reduce((s, i) => s + Number(i.unit_price) * i.qty, 0);
}

export function quoteTotals(items: QuoteItem[]) {
  const subtotal = quoteSubtotal(items);
  const tax      = subtotal * 0.07;
  return { subtotal, tax, total: subtotal + tax };
}
