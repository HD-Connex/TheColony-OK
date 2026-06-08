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

export async function getArticles(opts: { limit?: number } = {}): Promise<Article[]> {
  const { limit = 8 } = opts;
  const sb = supabasePublic();
  const { data } = await sb
    .from("articles")
    .select("id,slug,title,description,published_at,tier_required")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Article[];
}

export async function getTierArticles(tier: string, limit = 3): Promise<Article[]> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("articles")
    .select("id,slug,title,description,published_at,tier_required")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  // tier filter stub (in real join or column)
  return (data ?? []) as Article[];
}
