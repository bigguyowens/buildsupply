"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type OrderItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  brand: string;
};

export type ShippingInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type PlaceOrderResult =
  | { success: true; orderId: number }
  | { success: false; error: string };

export async function placeOrderAction(
  items: OrderItem[],
  shipping: ShippingInfo,
  total: number
): Promise<PlaceOrderResult> {
  if (!items.length) return { success: false, error: "Cart is empty." };

  try {
    const session = await getSession();
    const userId = session?.id ?? null;

    const rows = await query<{ id: number }>(
      `INSERT INTO orders (user_id, status, total, items, shipping)
       VALUES ($1, 'pending', $2, $3, $4)
       RETURNING id`,
      [userId, total, JSON.stringify(items), JSON.stringify(shipping)]
    );

    return { success: true, orderId: rows[0].id };
  } catch (err) {
    console.error("placeOrder error:", err);
    return { success: false, error: "Failed to place order. Please try again." };
  }
}
