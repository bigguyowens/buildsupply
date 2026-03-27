import { getRevenueAnalytics } from "@/app/actions/crm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const AnalyticsClient = dynamic(() => import("./analytics-client").then(m => ({ default: m.AnalyticsClient })), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 400, color: "#9ca3af", fontSize: 14 }}>
      Loading analytics…
    </div>
  ),
});

export default async function CRMAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await getRevenueAnalytics();
  const safeData = {
    ...data,
    winRate: data.winRate ?? { total: 0, accepted: 0, declined: 0, pending: 0 },
    quotePipeline: data.quotePipeline ?? [],
    monthlyRevenue: (data.monthlyRevenue ?? []).map(m => ({ ...m, revenue: Number(m.revenue) })),
    revenueByAM: (data.revenueByAM ?? []).map(r => ({ ...r, revenue: Number(r.revenue) })),
    topCustomers: (data.topCustomers ?? []).map(c => ({ ...c, revenue: Number(c.revenue) })),
  };
  return <AnalyticsClient data={safeData} sessionRole={session.role} />;
}
