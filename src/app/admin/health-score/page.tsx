import { getHealthScoreConfig } from "@/app/actions/health-config";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HealthScoreConfigClient } from "./health-score-client";

export default async function HealthScoreConfigPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin");

  const config = await getHealthScoreConfig();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--ad-text)" }}>
          Health Score Configuration
        </h1>
        <p style={{ color: "var(--ad-muted)", fontSize: 14, margin: "4px 0 0" }}>
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
