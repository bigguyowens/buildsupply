'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { firstName: string; lastName: string } | null;

export function AccountNav() {
  const [user, setUser] = useState<User>(undefined as unknown as User);

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  // Loading — render nothing to avoid flash
  if (user === undefined) return null;

  if (user) {
    return (
      <Link href="/account" style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}>
        {user.firstName} {user.lastName[0]}.
      </Link>
    );
  }

  return (
    <Link href="/login" style={{ color: "inherit", textDecoration: "none" }}>
      Sign In
    </Link>
  );
}
