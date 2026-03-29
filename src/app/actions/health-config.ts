'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type HealthScoreConfig = {
  id: number;
  pts_recency: number;
  pts_frequency: number;
  pts_spend: number;
  pts_onboarding: number;
  pts_engagement: number;
  pts_quotes: number;
  recency_great: number;
  recency_good: number;
  recency_ok: number;
  recency_pts_great: number;
  recency_pts_good: number;
  recency_pts_ok: number;
  recency_pts_stale: number;
  freq_high: number;
  freq_mid: number;
  freq_low: number;
  freq_pts_high: number;
  freq_pts_mid: number;
  freq_pts_low: number;
  engage_great: number;
  engage_good: number;
  engage_ok: number;
  engage_pts_great: number;
  engage_pts_good: number;
  engage_pts_ok: number;
  engage_pts_note: number;
  threshold_healthy: number;
  threshold_at_risk: number;
  updated_at: string;
  updated_by_name: string | null;
};

export async function getHealthScoreConfig(): Promise<HealthScoreConfig> {
  const rows = await query<HealthScoreConfig>(
    `SELECT * FROM health_score_config WHERE id = 1`
  );
  // Return defaults if somehow missing
  return rows[0];
}

export async function saveHealthScoreConfig(
  cfg: Omit<HealthScoreConfig, "id" | "updated_at" | "updated_by_name">
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false, error: "Unauthorized" };

  // Validate total points don't exceed 100
  const total = cfg.pts_recency + cfg.pts_frequency + cfg.pts_spend +
                cfg.pts_onboarding + cfg.pts_engagement + cfg.pts_quotes;
  if (total !== 100) {
    return { ok: false, error: `Factor points must total 100 (currently ${total})` };
  }

  await query(`
    UPDATE health_score_config SET
      pts_recency        = $1,  pts_frequency      = $2,  pts_spend          = $3,
      pts_onboarding     = $4,  pts_engagement     = $5,  pts_quotes         = $6,
      recency_great      = $7,  recency_good       = $8,  recency_ok         = $9,
      recency_pts_great  = $10, recency_pts_good   = $11, recency_pts_ok     = $12,
      recency_pts_stale  = $13,
      freq_high          = $14, freq_mid           = $15, freq_low           = $16,
      freq_pts_high      = $17, freq_pts_mid       = $18, freq_pts_low       = $19,
      engage_great       = $20, engage_good        = $21, engage_ok          = $22,
      engage_pts_great   = $23, engage_pts_good    = $24, engage_pts_ok      = $25,
      engage_pts_note    = $26,
      threshold_healthy  = $27, threshold_at_risk  = $28,
      updated_at = NOW(), updated_by_name = $29
    WHERE id = 1
  `, [
    cfg.pts_recency, cfg.pts_frequency, cfg.pts_spend,
    cfg.pts_onboarding, cfg.pts_engagement, cfg.pts_quotes,
    cfg.recency_great, cfg.recency_good, cfg.recency_ok,
    cfg.recency_pts_great, cfg.recency_pts_good, cfg.recency_pts_ok, cfg.recency_pts_stale,
    cfg.freq_high, cfg.freq_mid, cfg.freq_low,
    cfg.freq_pts_high, cfg.freq_pts_mid, cfg.freq_pts_low,
    cfg.engage_great, cfg.engage_good, cfg.engage_ok,
    cfg.engage_pts_great, cfg.engage_pts_good, cfg.engage_pts_ok, cfg.engage_pts_note,
    cfg.threshold_healthy, cfg.threshold_at_risk,
    `${session.firstName} ${session.lastName}`,
  ]);

  revalidatePath("/admin/health-score");
  revalidatePath("/crm");
  revalidatePath("/crm/customers");
  return { ok: true };
}
