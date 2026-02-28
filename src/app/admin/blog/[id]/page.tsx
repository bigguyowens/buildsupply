import { getBlogCategories, adminGetPostById } from "@/app/actions/blog";
import { BlogPostEditor } from "../editor";
import { notFound } from "next/navigation";

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, post] = await Promise.all([
    getBlogCategories(),
    adminGetPostById(Number(id)),
  ]);
  if (!post) notFound();
  return <BlogPostEditor categories={categories} post={post} />;
}
