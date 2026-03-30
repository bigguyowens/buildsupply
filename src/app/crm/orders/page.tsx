import { getCRMOrders } from "@/app/actions/crm-orders";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMOrdersClient } from "./crm-orders-client";
import { CRMScopeToggle } from "@/components/crm-scope-toggle";

export default async function CRMOrdersPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin", "account_manager", "manager"].includes(session.role)) redirect("/account");

  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === "all" ? "all" : "mine";

  const orders = await getCRMOrders(scope);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <CRMOrdersClient
      orders={orders}
      totalRevenue={totalRevenue}
      statusCounts={statusCounts}
      sessionRole={session.role}
      scope={scope}
      scopeToggle={<CRMScopeToggle sessionRole={session.role} currentScope={scope} />}
    />
  );
}
