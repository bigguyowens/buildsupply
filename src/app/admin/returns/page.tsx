import { getAdminReturns } from "@/app/actions/returns";
import { AdminReturnsClient } from "./returns-client";

export const metadata = { title: "Returns | Admin" };

export default async function AdminReturnsPage() {
  const returns = await getAdminReturns();
  return <AdminReturnsClient initialReturns={returns} />;
}
