// Contributor directory data access (anon, RLS — only status='active' is visible).
import { supabasePublic } from "@/lib/supabase";
import type { TierId } from "@/lib/contributor-tiers";

export interface Contributor {
  id: string;
  slug: string;
  name: string;
  tier: TierId;
  role: string | null;
  headshot_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  email: string | null;
  x_handle: string | null;
  status: string;
}

const COLS = "id,slug,name,tier,role,headshot_url,bio,location,website,email,x_handle,status";
const TIER_ORDER: Record<string, number> = { headliner: 0, featured: 1, contributor: 2 };

export async function getContributors(): Promise<Contributor[]> {
  const sb = supabasePublic();
  const { data } = await sb.from("contributors").select(COLS).eq("status", "active");
  return ((data ?? []) as Contributor[]).sort(
    (a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.name.localeCompare(b.name),
  );
}

export async function getContributorsByTier(tier: TierId): Promise<Contributor[]> {
  return (await getContributors()).filter((c) => c.tier === tier);
}

export async function getContributorBySlug(slug: string): Promise<Contributor | null> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("contributors")
    .select(COLS)
    .eq("slug", slug)
    .eq("status", "active")
    .single();
  return (data as Contributor) ?? null;
}

export async function getContributorByName(name: string): Promise<Contributor | null> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("contributors")
    .select(COLS)
    .eq("status", "active")
    .ilike("name", name)
    .maybeSingle();
  return (data as Contributor) ?? null;
}

export async function getActiveContributorSlugs(): Promise<string[]> {
  const sb = supabasePublic();
  const { data } = await sb.from("contributors").select("slug").eq("status", "active");
  return (data ?? []).map((r) => (r as { slug: string }).slug);
}

// ─── Mixed-work queries (for contributor profile rails + directory teasers) ───
// Articles use FK slug join (existing getContributorArticles).
// Podcasts / video / live use host-name string match for now (hosts denormalized on shows;
// video_episodes & live_events lack contributor FKs — suggest adding host_id / appearance FKs later for accuracy).
// Uses joins/ilike for perf; small limits; RLS-respecting public client.
export interface ContributorEpisode {
  id: string;
  show_slug: string;
  show_title: string;
  title: string;
  pub_date: string;
  duration_s: number | null;
}

export interface ContributorVideo {
  id: string;
  series_slug: string;
  series_title: string;
  title: string;
  published_at: string | null;
}

interface ContributorEpisodeRow {
  id: string;
  show_slug: string;
  title: string;
  pub_date: string;
  duration_s: number | null;
  shows?: { slug?: string; title?: string; host?: string } | null;
}

interface ContributorVideoRow {
  id: string;
  title: string;
  published_at: string | null;
  series?: { slug?: string; title?: string } | null;
}

export interface ContributorLive {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_start: string | null;
  ended_at: string | null;
}

export async function getContributorEpisodes(contributorName: string, limit = 6): Promise<ContributorEpisode[]> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("episodes")
    .select(`id, show_slug, title, pub_date, duration_s, shows!inner(slug, title, host)`)
    .ilike("shows.host", `%${contributorName}%`)
    .order("pub_date", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ContributorEpisodeRow[]).map((e) => ({
    id: e.id,
    show_slug: e.show_slug,
    show_title: e.shows?.title ?? "",
    title: e.title,
    pub_date: e.pub_date,
    duration_s: e.duration_s,
  }));
}

export async function getContributorVideos(contributorName: string, limit = 6): Promise<ContributorVideo[]> {
  const sb = supabasePublic();
  const first = contributorName.split(" ")[0] || contributorName;
  const { data } = await sb
    .from("video_episodes")
    .select(`id, title, published_at, series:series!inner(slug, title)`)
    .or(`title.ilike.%${first}%,description.ilike.%${first}%`)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ContributorVideoRow[]).map((e) => ({
    id: e.id,
    series_slug: e.series?.slug ?? "",
    series_title: e.series?.title ?? "",
    title: e.title,
    published_at: e.published_at,
  }));
}

export async function getContributorLives(contributorName: string, limit = 6): Promise<ContributorLive[]> {
  const sb = supabasePublic();
  const first = contributorName.split(" ")[0] || contributorName;
  const { data } = await sb
    .from("live_events")
    .select("id, title, description, status, scheduled_start, ended_at")
    .or(`title.ilike.%${first}%,description.ilike.%${first}%`)
    .order("scheduled_start", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ContributorLive[]);
}

export interface ContributorArticle {
  id: string;
  slug: string;
  title: string;
  dek: string | null;
  published_at: string;
  category: string | null;
}

export async function getContributorArticles(contributorSlug: string, limit = 12): Promise<ContributorArticle[]> {
  const sb = supabasePublic();
  try {
    const { data } = await sb
      .from("articles")
      .select("id,slug,title,dek,published_at,category, contributors!inner(slug)")
      .eq("status", "published")
      .eq("contributors.slug", contributorSlug)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (data?.length) {
      return (data as Array<ContributorArticle & { contributors?: unknown }>).map(({ contributors: _, ...row }) => row);
    }
  } catch {
    // contributor_id FK may not exist yet — fall through to empty
  }
  return [];
}
