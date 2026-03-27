import { getRevenueAnalytics } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

export default async function CRMAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getRevenueAnalytics();
  return <AnalyticsClient data={data} sessionRole={session.role} />;
}
