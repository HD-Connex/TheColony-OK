// Stub for articles (home + news surfaces). Minimal for deploy/test of video/live features.
// Full impl would use articles table + RLS.
import { supabasePublic } from "./supabase";

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published_at: string;
  tier_required?: string | null;
  hero_url?: string | null;
  hero_alt?: string | null;
  category?: string | null;
  status?: string;
  member_only?: boolean;
  dek?: string | null;
  contributor?: {
    slug: string;
    name: string;
    tier: string;
    headshot_url?: string | null;
    location?: string | null;
  } | null;
}

type ArticleRow = Omit<Article, "description" | "tier_required"> & {
  body?: string | null;
  member_only?: boolean | null;
};

export const ARTICLE_COLS =
  "id,slug,title,dek,body,published_at,member_only,hero_url,hero_alt,category,status";

function enrichArticle(row: ArticleRow): Article {
  const memberOnly = row.member_only ?? false;
  return {
    ...row,
    description: row.body ?? null,
    tier_required: memberOnly ? "member" : "free",
    member_only: memberOnly,
  };
}

export async function getArticles(opts: { limit?: number } = {}): Promise<Article[]> {
  const { limit = 8 } = opts;
  const sb = supabasePublic();
  const { data } = await sb
    .from("articles")
    .select(ARTICLE_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ArticleRow[]).map(enrichArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await supabasePublic()
    .from("articles")
    .select(ARTICLE_COLS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ? enrichArticle(data as ArticleRow) : null;
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<Article[]> {
  const sb = supabasePublic();
  const current = await getArticleBySlug(slug);

  if (current?.category) {
    const { data } = await sb
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("status", "published")
      .eq("category", current.category)
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(limit);
    if ((data?.length ?? 0) >= limit) return (data as ArticleRow[]).map(enrichArticle);
  }

  const { data } = await sb
    .from("articles")
    .select(ARTICLE_COLS)
    .eq("status", "published")
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ArticleRow[]).map(enrichArticle);
}

export async function getTierArticles(tier: string, limit = 3): Promise<Article[]> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("articles")
    .select(ARTICLE_COLS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  // tier filter stub (in real join or column)
  return ((data ?? []) as ArticleRow[]).map(enrichArticle);
}
