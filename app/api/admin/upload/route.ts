import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const folder = (form.get("folder") as string) || "uploads";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const allowed = ["jpg", "jpeg", "png", "webp", "gif", "mp3", "mp4", "mov", "webm", "m4a", "wav", "pdf"];
  if (!allowed.includes(ext)) return NextResponse.json({ error: `File type .${ext} not allowed` }, { status: 400 });

  const maxSize = ext === "mp4" || ext === "mov" || ext === "webm" ? 200 * 1024 * 1024 : 30 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: "File too large" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const blob = await put(path, buffer, { access: "public", contentType: file.type || undefined });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
