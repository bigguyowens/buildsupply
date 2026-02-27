'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type PromoBar = {
  text: string;
  link: string;
};

export type Announcement = {
  enabled:   boolean;
  text:      string;
  link:      string;
  bgColor:   string;
  textColor: string;
};

export type HeaderCMS = {
  promo_bar:    PromoBar;
  announcement: Announcement;
};

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function getHeaderCMS(): Promise<HeaderCMS> {
  const rows = await query<{ key: string; content: unknown }>(
    `SELECT key, content FROM header_cms`
  );
  const map = Object.fromEntries(rows.map(r => [r.key, r.content]));
  return {
    promo_bar:    (map.promo_bar    as PromoBar)    ?? { text: "Free shipping on orders $500+", link: "" },
    announcement: (map.announcement as Announcement) ?? { enabled: false, text: "", link: "", bgColor: "#f97316", textColor: "#ffffff" },
  };
}

async function saveSection(key: string, content: unknown) {
  await assertAdmin();
  await query(
    `INSERT INTO header_cms (key, content, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (key) DO UPDATE SET content=$2, updated_at=NOW()`,
    [key, JSON.stringify(content)]
  );
  revalidatePath("/", "layout");
  revalidatePath("/admin/header");
}

export async function savePromoBar(data: PromoBar): Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("promo_bar", data); return { ok: true }; }
  catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function saveAnnouncement(data: Announcement): Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("announcement", data); return { ok: true }; }
  catch (e) { return { ok: false, error: (e as Error).message }; }
}
