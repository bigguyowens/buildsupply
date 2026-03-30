import { getCRMReturns } from "@/app/actions/crm-returns";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMReturnsClient } from "./crm-returns-client";
import { CRMScopeToggle } from "@/components/crm-scope-toggle";

export default async function CRMReturnsPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin", "account_manager", "manager"].includes(session.role)) redirect("/account");

  const { scope: scopeParam } = await searchParams;
  const scope = scopeParam === "all" ? "all" : "mine";

  const returns = await getCRMReturns(scope);

  const statusCounts = returns.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalRefunded = returns
    .filter(r => r.status === "refunded" && r.refund_amount)
    .reduce((s, r) => s + Number(r.refund_amount), 0);

  return (
    <CRMReturnsClient
      returns={returns}
      statusCounts={statusCounts}
      totalRefunded={totalRefunded}
      sessionRole={session.role}
      scope={scope}
      scopeToggle={<CRMScopeToggle sessionRole={session.role} currentScope={scope} />}
    />
  );
}
