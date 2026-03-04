import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminThemeWrapper } from "@/components/admin-theme-wrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <AdminThemeWrapper>
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--ad-bg)" }}>
        <AdminSidebar session={session} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
    </AdminThemeWrapper>
  );
}
