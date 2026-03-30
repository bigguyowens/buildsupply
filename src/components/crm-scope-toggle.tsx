"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Props = {
  sessionRole: string;
  currentScope: "mine" | "all";
};

const LABELS: Record<string, { mine: string; all: string }> = {
  admin:           { mine: "All",        all: "All" }, // admins always see all
  manager:         { mine: "My Team",    all: "All Customers" },
  account_manager: { mine: "My Customers", all: "All Customers" },
};

export function CRMScopeToggle({ sessionRole, currentScope }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  // Admins always see everything — no toggle needed
  if (sessionRole === "admin") return null;

  const labels = LABELS[sessionRole] ?? { mine: "My Data", all: "All" };

  function setScope(scope: "mine" | "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (scope === "all") params.set("scope", "all");
    else params.delete("scope");
    router.push(`${pathname}?${params.toString()}`);
  }

  const isMine = currentScope === "mine";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Viewing:
      </span>
      <div style={{ display: "flex", background: "#f1f1f1",
        borderRadius: 8, padding: 3, gap: 2 }}>
        <button
          onClick={() => setScope("mine")}
          style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            background: isMine ? "#0d0d0d" : "transparent",
            color: isMine ? "#f5c700" : "#6b7280",
            boxShadow: isMine ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          }}>
          {labels.mine}
        </button>
        <button
          onClick={() => setScope("all")}
          style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            background: !isMine ? "#0d0d0d" : "transparent",
            color: !isMine ? "#f5c700" : "#6b7280",
            boxShadow: !isMine ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          }}>
          {labels.all}
          {!isMine && (
            <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>👁</span>
          )}
        </button>
      </div>
      {!isMine && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
          background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a",
        }}>
          Viewing all — read only
        </span>
      )}
    </div>
  );
}
