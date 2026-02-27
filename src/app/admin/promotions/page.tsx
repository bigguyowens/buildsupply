import { getPromotions } from "@/app/actions/promotions";
import { PromotionsAdminClient } from "./client";

export default async function AdminPromotionsPage() {
  const promos = await getPromotions();
  return <PromotionsAdminClient promos={promos} />;
}
