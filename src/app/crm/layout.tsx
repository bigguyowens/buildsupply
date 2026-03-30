import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMSidebar } from "@/components/crm-sidebar";
import { CRMMobileShell } from "@/components/crm-mobile-shell";
import { CRMThemeWrapper } from "@/components/crm-theme-wrapper";

export default async function CRMLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!["admin", "account_manager", "manager"].includes(user.role)) redirect("/account");

  return (
    <CRMThemeWrapper>
      <CRMMobileShell sidebar={<CRMSidebar user={user} />}>
        {children}
      </CRMMobileShell>
    </CRMThemeWrapper>
  );
}
