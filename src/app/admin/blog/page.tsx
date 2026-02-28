import Link from "next/link";
import { adminGetAllPosts, getBlogCategories, adminTogglePublished, adminDeletePost } from "@/app/actions/blog";
import { AdminBlogClient } from "./client";

export default async function AdminBlogPage() {
  const [posts, categories] = await Promise.all([
    adminGetAllPosts(),
    getBlogCategories(),
  ]);
  return <AdminBlogClient posts={posts} categories={categories} />;
}
