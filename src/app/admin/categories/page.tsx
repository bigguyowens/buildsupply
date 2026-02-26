import { getAdminCategories } from "@/app/actions/categories";
import { CategoriesAdminClient } from "./client";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <CategoriesAdminClient categories={categories} />;
}
