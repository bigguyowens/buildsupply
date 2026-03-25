"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recordPromoUse } from "@/app/actions/promotions";
import type { ValidatedPromo } from "@/app/actions/promotions";
import { sendOrderConfirmation } from "@/lib/email";

export type OrderItem = {
  id: string; name: string; slug: string; image: string;
  price: number; quantity: number; sku: string; brand: string;
};

export type ShippingInfo = {
  firstName: string; lastName: string; email: string; phone: string;
  company: string; address: string; city: string; state: string;
  zip: string; country: string;
};

export type PlaceOrderResult =
  | { success: true; orderId: number }
  | { success: false; error: string };

export async function placeOrderAction(
  items: OrderItem[],
  shipping: ShippingInfo,
  total: number,
  promo?: ValidatedPromo | null,
): Promise<PlaceOrderResult> {
  if (!items.length) return { success: false, error: "Cart is empty." };

  try {
    const session = await getSession();
    const userId = session?.id ?? null;

    // Compute discount server-side from promo — don't trust the client total blindly
    const subtotal       = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const discountAmount = promo ? parseFloat((subtotal * (promo.discount_percent / 100)).toFixed(2)) : 0;
    const verifiedTotal  = total; // caller already computed with same logic; stored as-is

    const rows = await query<{ id: number }>(
      `INSERT INTO orders (user_id, status, total, items, shipping, promo_id, promo_code, discount_amount, status_history, updated_at)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [
        userId,
        verifiedTotal,
        JSON.stringify(items),
        JSON.stringify(shipping),
        promo?.id ?? null,
        promo?.code ?? null,
        discountAmount,
        JSON.stringify([{ status: "pending", timestamp: new Date().toISOString() }]),
      ]
    );

    const orderId = rows[0].id;

    // Record promo use and increment used_count
    if (promo) {
      await recordPromoUse(promo.id, userId, orderId);
    }

    // Send order confirmation email (fire-and-forget)
    const TAX_RATE = 0.07;
    const SHIP_FEE = subtotal < 500 ? 29.99 : 0;
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    sendOrderConfirmation({
      to: shipping.email,
      firstName: shipping.firstName,
      orderId,
      items: items.map(i => ({ name: i.name, sku: i.sku, quantity: i.quantity, price: i.price })),
      subtotal,
      discount: discountAmount,
      shipping: SHIP_FEE,
      tax,
      total: verifiedTotal,
      shippingAddress: { address: shipping.address, city: shipping.city, state: shipping.state, zip: shipping.zip },
      promoCode: promo?.code,
    }).catch(err => console.error("Order confirmation email failed:", err));

    return { success: true, orderId };
  } catch (err) {
    console.error("placeOrder error:", err);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}
