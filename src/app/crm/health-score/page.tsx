import { getHealthScoreConfig } from "@/app/actions/health-config";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HealthScoreConfigClient } from "@/app/admin/health-score/health-score-client";

export default async function CRMHealthScorePage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/crm");

  const config = await getHealthScoreConfig();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d",
          letterSpacing: "-0.03em" }}>Health Score Configuration</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Adjust how customer health scores are calculated. Changes apply immediately across the CRM.
          {config.updated_by_name && (
            <> · Last updated by <strong>{config.updated_by_name}</strong> on{" "}
              {new Date(config.updated_at).toLocaleDateString("en-US",
                { month: "short", day: "numeric", year: "numeric" })}
            </>
          )}
        </p>
      </div>
      <HealthScoreConfigClient config={config} />
    </div>
  );
}
