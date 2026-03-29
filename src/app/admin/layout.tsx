import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminThemeWrapper } from "@/components/admin-theme-wrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");

  return (
    <AdminThemeWrapper>
      <AdminSidebar session={session} />
      <div className="admin-content" style={{ flex: 1, minWidth: 0, background: "var(--ad-bg)" }}>
        {children}
      </div>
    </AdminThemeWrapper>
  );
}
