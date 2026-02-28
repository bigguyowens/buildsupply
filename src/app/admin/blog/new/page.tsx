import { getBlogCategories } from "@/app/actions/blog";
import { BlogPostEditor } from "../editor";

export default async function AdminBlogNewPage() {
  const categories = await getBlogCategories();
  return <BlogPostEditor categories={categories} />;
}
