import { getBlogCategories } from "@/app/actions/blog";
import { AdminBlogCategoriesClient } from "./client";

export default async function AdminBlogCategoriesPage() {
  const categories = await getBlogCategories();
  return <AdminBlogCategoriesClient categories={categories} />;
}
