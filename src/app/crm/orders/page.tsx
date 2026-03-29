import { getCRMOrders } from "@/app/actions/crm-orders";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CRMOrdersClient } from "./crm-orders-client";

export default async function CRMOrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!["admin", "account_manager", "manager"].includes(session.role)) redirect("/account");

  const orders = await getCRMOrders();

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
    />
  );
}
