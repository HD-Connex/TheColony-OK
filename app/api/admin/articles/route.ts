import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { adminListArticles, adminUpsertArticle } from "@/lib/articles";
import { log } from "@/lib/log";

/** List articles (any status) for admin. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;
  const articles = await adminListArticles({ status, limit: 100 });
  return NextResponse.json({ articles });
}

/** Create or update article (MD body supported). */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  try {
    const saved = await adminUpsertArticle(body);
    return NextResponse.json({ ok: true, article: saved });
  } catch (e: any) {
    log.error("[admin/articles] upsert failed", e);
    return NextResponse.json({ error: "Save failed" }, { status: 400 });
  }
}
