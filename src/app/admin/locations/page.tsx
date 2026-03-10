import { getLocations } from "@/app/actions/locations";
import { AdminLocationsClient } from "./locations-client";

export const metadata = { title: "Distribution Centers | Admin" };

export default async function AdminLocationsPage() {
  const locations = await getLocations();
  return <AdminLocationsClient initialLocations={locations} />;
}
