import { getSiteTheme } from "@/app/actions/theme";
import { AdminThemeClient } from "./client";

export default async function AdminThemePage() {
  const theme = await getSiteTheme();
  return <AdminThemeClient theme={theme} />;
}
