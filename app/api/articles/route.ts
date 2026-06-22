import { NextResponse } from "next/server";
import { getArticles } from "@/lib/articles";

export const runtime = "nodejs";
export const revalidate = 60;

/**
 * Public published-articles listing. Optional `county` filter + `limit`.
 * GET /api/articles?county=Garfield&limit=12
 * Used by client surfaces (e.g. /my-feed) that can't call server lib directly
 * and must NOT hit the admin-gated /api/admin/articles.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const county = searchParams.get("county") || undefined;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 12, 1), 50);

  try {
    const articles = await getArticles({ county, limit });
    return NextResponse.json({ articles });
  } catch (e) {
    console.error("[api/articles] failed", e);
    return NextResponse.json({ articles: [] });
  }
}
