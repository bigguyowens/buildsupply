"use server";

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function getHomepageContent() {
  const rows = await query<{ section: string; enabled: boolean; content: unknown }>(
    "SELECT section, enabled, content FROM homepage_content ORDER BY id ASC"
  );
  const map: Record<string, { enabled: boolean; content: unknown }> = {};
  for (const row of rows) map[row.section] = { enabled: row.enabled, content: row.content };
  return map;
}

export async function saveHomepageSectionAction(
  section: string,
  enabled: boolean,
  content: unknown
) {
  await assertAdmin();
  await query(
    `INSERT INTO homepage_content (section, enabled, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (section) DO UPDATE SET enabled = $2, content = $3, updated_at = NOW()`,
    [section, enabled, JSON.stringify(content)]
  );
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}
