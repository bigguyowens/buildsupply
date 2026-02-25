'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export function WishlistNavIcon() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/wishlist/count")
      .then(r => r.ok ? r.json() : null)
      .then(data => setCount(data?.count ?? null))
      .catch(() => setCount(null));
  }, []);

  // Not logged in or loading — render nothing
  if (count === null) return null;

  return (
    <Link
      href="/account/wishlist"
      title="My Wishlists"
      style={{
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        width: 36, height: 36, borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.3)", color: "white",
        textDecoration: "none", flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {count > 0 && (
        <span style={{
          position: "absolute", top: -4, right: -4,
          background: "var(--color-accent)", color: "white",
          borderRadius: 9999, fontSize: 10, fontWeight: 700,
          minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 3px",
        }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
