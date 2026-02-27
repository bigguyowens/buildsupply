'use server';

import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ContactHero    = { badge: string; headline: string; subtext: string };
export type ContactForm    = { title: string; subtitle: string; button: string; reasons: string[] };
export type QuickContact   = { icon: string; label: string; value: string; href: string };
export type HoursRow       = { day: string; hours: string };
export type Location       = { city: string; label: string; address: string; phone: string; hours: string; mapUrl: string };

export type ContactCMS = {
  hero:           ContactHero;
  form:           ContactForm;
  quick_contacts: QuickContact[];
  hours:          HoursRow[];
  locations:      Location[];
};

async function assertAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function getContactCMS(): Promise<ContactCMS> {
  const rows = await query<{ key: string; content: unknown }>(
    `SELECT key, content FROM contact_cms`
  );
  const map = Object.fromEntries(rows.map(r => [r.key, r.content]));
  return {
    hero:           (map.hero           as ContactHero)    ?? {},
    form:           (map.form           as ContactForm)    ?? {},
    quick_contacts: (map.quick_contacts as QuickContact[]) ?? [],
    hours:          (map.hours          as HoursRow[])     ?? [],
    locations:      (map.locations      as Location[])     ?? [],
  };
}

async function saveSection(key: string, content: unknown) {
  await assertAdmin();
  await query(
    `INSERT INTO contact_cms (key, content, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET content = $2, updated_at = NOW()`,
    [key, JSON.stringify(content)]
  );
  revalidatePath("/contact");
  revalidatePath("/admin/contact-cms");
}

export async function saveHero(data: ContactHero):           Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("hero", data); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
export async function saveForm(data: ContactForm):           Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("form", data); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
export async function saveQuickContacts(data: QuickContact[]): Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("quick_contacts", data); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
export async function saveHours(data: HoursRow[]):           Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("hours", data); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
export async function saveLocations(data: Location[]):       Promise<{ ok: boolean; error?: string }> {
  try { await saveSection("locations", data); return { ok: true }; } catch (e) { return { ok: false, error: (e as Error).message }; }
}
