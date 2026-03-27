import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMSidebar } from "@/components/crm-sidebar";

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!["admin", "account_manager", "manager"].includes(user.role)) redirect("/account");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f2f2f2" }}>
      <CRMSidebar user={user} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5",
          padding: "0 28px", height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>CRM Live</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
        {/* Page content */}
        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
