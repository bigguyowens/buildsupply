import { getCustomersWithHealth, getCRMStaff } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomersClient } from "./customers-client";
import { CRMScopeToggle } from "@/components/crm-scope-toggle";

export default async function CRMCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === "all" ? "all" : "mine";

  const [customers, staff] = await Promise.all([
    getCustomersWithHealth(undefined, scope),
    getCRMStaff(),
  ]);

  return (
    <CustomersClient
      customers={customers}
      staff={staff}
      sessionRole={session.role}
      scope={scope}
      scopeToggle={<CRMScopeToggle sessionRole={session.role} currentScope={scope} />}
    />
  );
}
