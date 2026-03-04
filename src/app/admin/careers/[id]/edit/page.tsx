import { adminGetPostingById } from "@/app/actions/careers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostingEditor } from "../../posting-editor";

export default async function EditPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posting = await adminGetPostingById(Number(id));
  if (!posting) notFound();

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/careers" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Careers</Link>
        <Link href={`/admin/careers/${id}`} style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← {posting.title}</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Edit Posting</h1>
      </div>
      <PostingEditor posting={posting} />
    </div>
  );
}
