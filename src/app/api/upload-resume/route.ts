import { NextResponse } from "next/server";

const MAX_SIZE    = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (!ALLOWED_MIME.includes(file.type) && !ALLOWED_EXT.includes(ext))
      return NextResponse.json({ error: "Only PDF, DOC, and DOCX files are accepted." }, { status: 400 });

    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });

    // Convert to base64
    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    return NextResponse.json({
      base64,
      mime:     file.type || "application/octet-stream",
      filename: file.name,
      size:     file.size,
    });
  } catch (err) {
    console.error("[upload-resume]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
