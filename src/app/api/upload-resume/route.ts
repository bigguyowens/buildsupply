import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED  = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate type
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: "Only PDF, DOC, and DOCX files are accepted." }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });
    }

    // Sanitise filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blobPath = `resumes/${Date.now()}-${safeName}`;

    const blob = await put(blobPath, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url:      blob.url,
      filename: file.name,
      size:     file.size,
    });
  } catch (err) {
    console.error("[upload-resume]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
