"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type LocationRow = {
  id:         number;
  name:       string;
  city:       string;
  state:      string;
  zip:        string;
  address:    string;
  phone:      string;
  lat:        number;
  lon:        number;
  hours:      string;
  services:   string[];
  active:     boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const SELECT = `
  SELECT id, name, city, state, zip, address, phone,
         lat::float, lon::float, hours, services,
         active, sort_order, created_at, updated_at
  FROM distribution_centers
  ORDER BY sort_order ASC, id ASC
`;

export async function getLocations(): Promise<LocationRow[]> {
  return query<LocationRow>(SELECT);
}

export async function createLocation(data: Omit<LocationRow, "id" | "created_at" | "updated_at">) {
  await query(
    `INSERT INTO distribution_centers
       (name, city, state, zip, address, phone, lat, lon, hours, services, active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [data.name, data.city, data.state, data.zip, data.address,
     data.phone, data.lat, data.lon, data.hours, data.services,
     data.active, data.sort_order]
  );
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  return { ok: true };
}

export async function updateLocation(id: number, data: Partial<Omit<LocationRow, "id" | "created_at" | "updated_at">>) {
  await query(
    `UPDATE distribution_centers SET
       name=$1, city=$2, state=$3, zip=$4, address=$5,
       phone=$6, lat=$7, lon=$8, hours=$9, services=$10,
       active=$11, sort_order=$12, updated_at=NOW()
     WHERE id=$13`,
    [data.name, data.city, data.state, data.zip, data.address,
     data.phone, data.lat, data.lon, data.hours, data.services,
     data.active, data.sort_order, id]
  );
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  return { ok: true };
}

export async function deleteLocation(id: number) {
  await query("DELETE FROM distribution_centers WHERE id=$1", [id]);
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  return { ok: true };
}

export async function toggleLocationActive(id: number, active: boolean) {
  await query(
    "UPDATE distribution_centers SET active=$1, updated_at=NOW() WHERE id=$2",
    [active, id]
  );
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  return { ok: true };
}
