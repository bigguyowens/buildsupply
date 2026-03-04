import { getAnalytics } from "@/app/actions/analytics";
import { DashboardCharts } from "./dashboard-charts";

export default async function AdminDashboard() {
  const data = await getAnalytics();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <DashboardCharts
        kpi={data.kpi}
        daily30={data.daily30}
        monthly12={data.monthly12}
        topProducts={data.topProducts}
        byCat={data.byCat}
        buckets={data.buckets}
        custGrowth={data.custGrowth}
        statusRows={data.statusRows}
        viewedProducts={data.viewedProducts}
        recentOrders={data.recentOrders}
        lowStock={data.lowStock}
      />
    </div>
  );
}
