'use client';

import {
  createContext, useContext, useMemo, useReducer,
  useEffect, useRef, useCallback,
} from "react";
import type { Product } from "@/lib/products";

export type CartItem = Product & { quantity: number };
export type AppliedPromo = { id: number; code: string; discount_percent: number; description: string };
type CartState = { items: CartItem[]; hydrated: boolean; promo: AppliedPromo | null };

type CartAction =
  | { type: "ADD_ITEM";        product: Product; quantity: number }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "REMOVE_ITEM";     productId: string }
  | { type: "CLEAR_CART" }
  | { type: "MERGE_ITEMS";     items: CartItem[] }
  | { type: "HYDRATE";         items: CartItem[] }
  | { type: "SET_PROMO";       promo: AppliedPromo | null };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  hydrated: boolean;
  promo: AppliedPromo | null;
  addItem:             (product: Product, quantity?: number) => void;
  updateItemQuantity:  (productId: string, quantity: number) => void;
  removeItem:          (productId: string) => void;
  clearCart:           () => void;
  mergeItems:          (items: CartItem[]) => void;
  setPromo:            (promo: AppliedPromo | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const LS_KEY = "bs_cart";

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true, promo: state.promo };

    case "SET_PROMO":
      return { ...state, promo: action.promo };

    case "ADD_ITEM": {
      const idx = state.items.findIndex(i => i.id === action.product.id);
      const items = idx >= 0
        ? state.items.map((item, i) => i === idx ? { ...item, quantity: item.quantity + action.quantity } : item)
        : [...state.items, { ...action.product, quantity: action.quantity }];
      return { ...state, items };
    }
    case "UPDATE_QUANTITY": {
      const items = action.quantity <= 0
        ? state.items.filter(i => i.id !== action.productId)
        : state.items.map(i => i.id === action.productId ? { ...i, quantity: action.quantity } : i);
      return { ...state, items };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.id !== action.productId) };

    case "CLEAR_CART":
      return { ...state, items: [], promo: null };

    case "MERGE_ITEMS": {
      const merged = [...state.items];
      for (const incoming of action.items) {
        const idx = merged.findIndex(i => i.id === incoming.id);
        if (idx >= 0) merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + incoming.quantity };
        else merged.push(incoming);
      }
      return { ...state, items: merged };
    }
    default:
      return state;
  }
}

export function CartProvider({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn: boolean }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false, promo: null });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoggedIn = useRef(isLoggedIn);

  // ── Hydrate on mount ─────────────────────────────────
  useEffect(() => {
    async function hydrate() {
      if (isLoggedIn) {
        // Fetch server cart
        const res = await fetch("/api/cart");
        const { items: serverItems } = await res.json();

        // Check for pending guest cart to merge in
        let guestItems: CartItem[] = [];
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) guestItems = JSON.parse(raw);
        } catch {}

        if (guestItems.length > 0) {
          // Merge guest into server, then clear localStorage
          const merged = [...serverItems];
          for (const g of guestItems) {
            const idx = merged.findIndex((i: CartItem) => i.id === g.id);
            if (idx >= 0) merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + g.quantity };
            else merged.push(g);
          }
          localStorage.removeItem(LS_KEY);
          dispatch({ type: "HYDRATE", items: merged });
          // Save merged cart to server
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: merged }),
          });
        } else {
          dispatch({ type: "HYDRATE", items: serverItems });
        }
      } else {
        // Guest — load from localStorage
        try {
          const raw = localStorage.getItem(LS_KEY);
          const items = raw ? JSON.parse(raw) : [];
          dispatch({ type: "HYDRATE", items });
        } catch {
          dispatch({ type: "HYDRATE", items: [] });
        }
      }
    }
    hydrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle login state change mid-session ────────────
  useEffect(() => {
    if (prevLoggedIn.current === isLoggedIn) return;
    prevLoggedIn.current = isLoggedIn;
    if (!isLoggedIn) {
      // Logged out — clear server cart from memory, keep nothing
      dispatch({ type: "CLEAR_CART" });
    }
  }, [isLoggedIn]);

  // ── Persist after every change (debounced 600ms) ─────
  const persist = useCallback((items: CartItem[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (isLoggedIn) {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
      } else {
        try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
      }
    }, 600);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!state.hydrated) return; // don't save on initial hydration
    persist(state.items);
  }, [state.items, state.hydrated, persist]);

  const value = useMemo<CartContextValue>(() => ({
    items:     state.items,
    hydrated:  state.hydrated,
    promo:     state.promo,
    itemCount: state.items.reduce((t, i) => t + i.quantity, 0),
    addItem:            (product, quantity = 1) => dispatch({ type: "ADD_ITEM",        product, quantity }),
    updateItemQuantity: (productId, quantity)   => dispatch({ type: "UPDATE_QUANTITY", productId, quantity }),
    removeItem:         (productId)             => dispatch({ type: "REMOVE_ITEM",     productId }),
    clearCart:          ()                      => dispatch({ type: "CLEAR_CART" }),
    mergeItems:         (items)                 => dispatch({ type: "MERGE_ITEMS",     items }),
    setPromo:           (promo)                 => dispatch({ type: "SET_PROMO",       promo }),
  }), [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
