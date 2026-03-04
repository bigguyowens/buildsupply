import Link from "next/link";
import { PostingEditor } from "../posting-editor";

export default function NewPostingPage() {
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/admin/careers" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 13 }}>← Careers</Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>New Job Posting</h1>
      </div>
      <PostingEditor />
    </div>
  );
}
