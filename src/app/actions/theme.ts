'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type SiteTheme = {
  color_primary:    string;
  color_accent:     string;
  color_background: string;
  color_foreground: string;
  heading_font:     string;
  body_font:        string;
};

export async function getSiteTheme(): Promise<SiteTheme> {
  try {
    const rows = await query<SiteTheme>(
      `SELECT color_primary, color_accent, color_background, color_foreground, heading_font, body_font FROM site_theme WHERE id=1 LIMIT 1`
    );
    return rows[0] ?? {
      color_primary: "#002244", color_accent: "#e8561c",
      color_background: "#f4f5f6", color_foreground: "#111827",
      heading_font: "Geist", body_font: "Geist",
    };
  } catch {
    return {
      color_primary: "#002244", color_accent: "#e8561c",
      color_background: "#f4f5f6", color_foreground: "#111827",
      heading_font: "Geist", body_font: "Geist",
    };
  }
}

export async function saveSiteTheme(data: SiteTheme): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { ok: false, error: "Unauthorized" };
  try {
    await query(`
      UPDATE site_theme SET
        color_primary=$1, color_accent=$2, color_background=$3, color_foreground=$4,
        heading_font=$5, body_font=$6, updated_at=NOW()
      WHERE id=1
    `, [data.color_primary, data.color_accent, data.color_background, data.color_foreground,
        data.heading_font, data.body_font]);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: (e as { message?: string })?.message ?? "Error saving theme." };
  }
}
