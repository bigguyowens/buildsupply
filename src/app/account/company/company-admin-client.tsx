"use client";

import { useState, useTransition } from "react";
import { updateMemberRole } from "@/app/actions/company";

type Member = { id: number; first_name: string; last_name: string; email: string; role: string; created_at: string };

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  company_admin: { label: "Company Admin", bg: "#fef3c7", color: "#92400e" },
  customer:      { label: "Member",        bg: "#f1f5f9", color: "#475569" },
};

export function CompanyAdminClient({ members, currentUserId }: {
  members: Member[];
  currentUserId: number;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--color-border)", background: "#f9fafb" }}>
          {["Member", "Email", "Role", "Joined", "Actions"].map(h => (
            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
              color: "var(--color-muted)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {members.map(m => (
          <MemberRow key={m.id} member={m} isCurrentUser={m.id === currentUserId} />
        ))}
      </tbody>
    </table>
  );
}

function MemberRow({ member, isCurrentUser }: { member: Member; isCurrentUser: boolean }) {
  const [role, setRole] = useState(member.role);
  const [, startT] = useTransition();
  const meta = ROLE_META[role] ?? ROLE_META.customer;

  function toggleRole() {
    const next = role === "company_admin" ? "customer" : "company_admin";
    startT(async () => {
      await updateMemberRole(member.id, next as "customer" | "company_admin");
      setRole(next);
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {member.first_name[0]}{member.last_name[0]}
          </div>
          <div>
            <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>
              {member.first_name} {member.last_name}
              {isCurrentUser && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--color-muted)", fontWeight: 400 }}>(you)</span>}
            </p>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px", color: "var(--color-muted)", fontSize: 13 }}>{member.email}</td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
          background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
      </td>
      <td style={{ padding: "12px 16px", color: "var(--color-muted)", fontSize: 13 }}>
        {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td style={{ padding: "12px 16px" }}>
        {!isCurrentUser ? (
          <button onClick={toggleRole} style={{
            background: "transparent", border: "1px solid var(--color-border)",
            borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", color: "var(--color-foreground)",
          }}>
            {role === "company_admin" ? "Demote to Member" : "Make Admin"}
          </button>
        ) : (
          <span style={{ color: "var(--color-muted)", fontSize: 12 }}>—</span>
        )}
      </td>
    </tr>
  );
}
