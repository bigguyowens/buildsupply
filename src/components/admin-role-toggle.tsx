'use client';

import { useState, useTransition } from "react";
import { toggleAdminRoleAction } from "@/app/actions/admin-role";

export function AdminRoleToggle({ userId, currentRole }: { userId: number; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [pending, startTransition] = useTransition();
  const isAdmin = role === "admin";

  function handleToggle() {
    const next = isAdmin ? "customer" : "admin";
    setRole(next);
    startTransition(() => toggleAdminRoleAction(userId, next === "admin"));
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          padding: "3px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
          textTransform: "uppercase",
          background: isAdmin ? "#fff7ed" : "#f1f5f9",
          color: isAdmin ? "#f97316" : "#64748b",
        }}>
          {role}
        </span>
        {isAdmin && <span style={{ fontSize: 12, color: "#94a3b8" }}>Has admin access</span>}
      </div>
      <button
        onClick={handleToggle}
        disabled={pending}
        style={{
          padding: "7px 16px", borderRadius: 6, border: "none", cursor: pending ? "not-allowed" : "pointer",
          fontWeight: 700, fontSize: 13, transition: "all 0.15s",
          background: isAdmin ? "#fee2e2" : "#fff7ed",
          color: isAdmin ? "#991b1b" : "#f97316",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Saving..." : isAdmin ? "Revoke Admin" : "Make Admin"}
      </button>
    </div>
  );
}
