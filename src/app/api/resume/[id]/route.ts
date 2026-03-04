import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [app] = await query<{
    resume_data: string; resume_mime: string; resume_filename: string;
  }>(
    `SELECT resume_data, resume_mime, resume_filename FROM job_applications WHERE id = $1`,
    [Number(id)]
  );

  if (!app?.resume_data)
    return NextResponse.json({ error: "No resume on file." }, { status: 404 });

  const buffer = Buffer.from(app.resume_data, "base64");
  const filename = app.resume_filename ?? "resume.pdf";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        app.resume_mime ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(buffer.byteLength),
    },
  });
}
