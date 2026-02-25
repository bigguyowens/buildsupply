'use client';

import { useState, useRef, useEffect } from "react";
import { addToWishlistAction, removeFromWishlistAction, getUserWishlists, createWishlistAction } from "@/app/actions/wishlist";

type List = { id: number; name: string; item_count: number };

type Props = {
  productId: string;
  initialLists?: List[];
  initialActive?: number[]; // wishlist IDs already containing this product
  size?: "sm" | "md";
};

export function WishlistButton({ productId, initialLists = [], initialActive = [], size = "md" }: Props) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [active, setActive] = useState<number[]>(initialActive);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isWishlisted = active.length > 0;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open && lists.length === 0) {
      setLoading(true);
      const fresh = await getUserWishlists();
      setLists(fresh);
      setLoading(false);
    }
  }

  async function toggleList(listId: number) {
    const inList = active.includes(listId);
    if (inList) {
      setActive(a => a.filter(id => id !== listId));
      await removeFromWishlistAction(listId, productId);
    } else {
      setActive(a => [...a, listId]);
      await addToWishlistAction(listId, productId);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const fd = new FormData();
    fd.set("name", newName.trim());
    await createWishlistAction({}, fd);
    const fresh = await getUserWishlists();
    setLists(fresh);
    // Auto-add product to the new list
    const newest = fresh[fresh.length - 1];
    if (newest) {
      await addToWishlistAction(newest.id, productId);
      setActive(a => [...a, newest.id]);
    }
    setNewName("");
    setCreating(false);
  }

  const btnSize = size === "sm" ? 30 : 36;
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        title={isWishlisted ? "In your wishlist" : "Add to wishlist"}
        style={{
          width: btnSize, height: btnSize, borderRadius: "50%", border: "none",
          background: isWishlisted ? "#fee2e2" : "rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
        }}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={isWishlisted ? "#dc2626" : "none"} stroke={isWishlisted ? "#dc2626" : "#6b7280"} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
          background: "white", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          border: "1px solid #e5e7eb", minWidth: 220, overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Save to List
          </div>

          {loading ? (
            <div style={{ padding: "16px", fontSize: 13, color: "#6b7280", textAlign: "center" }}>Loading...</div>
          ) : lists.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#6b7280" }}>No lists yet — create one below.</div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {lists.map(list => {
                const checked = active.includes(list.id);
                return (
                  <button
                    key={list.id}
                    onClick={() => toggleList(list.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px", border: "none", background: checked ? "#fff7ed" : "transparent",
                      cursor: "pointer", fontSize: 13, textAlign: "left",
                      borderBottom: "1px solid #f9fafb",
                    }}
                  >
                    <span style={{
                      width: 16, height: 16, borderRadius: 3, border: `2px solid ${checked ? "var(--color-accent)" : "#d1d5db"}`,
                      background: checked ? "var(--color-accent)" : "white",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} fill="none"/></svg>}
                    </span>
                    <span style={{ flex: 1, fontWeight: checked ? 600 : 400 }}>{list.name}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{list.item_count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new list */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 6 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="New list name..."
              style={{
                flex: 1, padding: "6px 10px", borderRadius: 5, border: "1px solid #e5e7eb",
                fontSize: 12, outline: "none",
              }}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              style={{
                padding: "6px 10px", borderRadius: 5, border: "none",
                background: "var(--color-accent)", color: "white",
                fontSize: 12, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
              }}
            >
              {creating ? "..." : "+ Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
