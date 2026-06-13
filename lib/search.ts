// Unified text search across podcasts, video catalog, and articles (Supabase ilike).
// Semantic / transcript hits are resolved via resolveEmbeddingHits in this module.

import { escapeIlike } from "./ilike";
import { supabaseConfigured, supabasePublic } from "./supabase";
import type { EmbeddingSearchResult } from "./semantic-search";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  thumbnail?: string | null;
  excerpt?: string;
  /** Phase 3: start time in seconds for transcript/spoken phrase matches (for jump + clipper) */
  startTime?: number;
}

function truncate(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function dedupeByHref(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of results) {
    if (seen.has(r.href)) continue;
    seen.add(r.href);
    out.push(r);
  }
  return out;
}

export async function textSearch(query: string, limitPerType = 12): Promise<SearchResult[]> {
  const raw = query.trim();
  if (!raw || !supabaseConfigured()) return [];

  const pattern = escapeIlike(raw);
  const sb = supabasePublic();

  const [showsRes, epsRes, seriesRes, videoEpsRes, articlesRes] = await Promise.all([
    sb
      .from("shows")
      .select("slug, title, host, description, cover_url")
      .eq("active", true)
      .or(`title.ilike.%${pattern}%,host.ilike.%${pattern}%,description.ilike.%${pattern}%`)
      .limit(limitPerType),
    sb
      .from("episodes")
      .select("id, slug, title, description, show_slug, thumbnail_url, shows!inner(title)")
      .or(`title.ilike.%${pattern}%,description.ilike.%${pattern}%`)
      .order("pub_date", { ascending: false })
      .limit(limitPerType),
    sb
      .from("series")
      .select("id, slug, title, tagline, description, poster_url, hero_url")
      .eq("status", "published")
      .or(`title.ilike.%${pattern}%,tagline.ilike.%${pattern}%,description.ilike.%${pattern}%`)
      .limit(limitPerType),
    sb
      .from("video_episodes")
      .select("id, slug, title, description, thumbnail_url, series:series!inner(slug, title, poster_url)")
      .eq("status", "published")
      .or(`title.ilike.%${pattern}%,description.ilike.%${pattern}%`)
      .order("published_at", { ascending: false })
      .limit(limitPerType),
    sb
      .from("articles")
      .select("id, slug, title, description, hero_url")
      .eq("status", "published")
      .or(`title.ilike.%${pattern}%,description.ilike.%${pattern}%`)
      .order("published_at", { ascending: false })
      .limit(limitPerType),
  ]);

  const results: SearchResult[] = [];

  for (const s of showsRes.data ?? []) {
    const row = s as {
      slug: string;
      title: string;
      cover_url: string | null;
    };
    results.push({
      id: `podcast-${row.slug}`,
      title: row.title,
      subtitle: "Podcast",
      href: `/podcasts/${row.slug}`,
      thumbnail: row.cover_url,
    });
  }

  for (const e of epsRes.data ?? []) {
    const row = e as {
      id: string;
      slug: string | null;
      title: string;
      show_slug: string;
      thumbnail_url: string | null;
      shows?: { title?: string } | null;
    };
    results.push({
      id: `podcast-ep-${row.id}`,
      title: row.title,
      subtitle: row.shows?.title ? `Podcast · ${row.shows.title}` : "Podcast episode",
      href: `/podcasts/${row.show_slug}/${row.slug || row.id}`,
      thumbnail: row.thumbnail_url,
    });
  }

  for (const s of seriesRes.data ?? []) {
    const row = s as {
      slug: string;
      title: string;
      poster_url: string | null;
      hero_url: string | null;
    };
    results.push({
      id: `series-${row.slug}`,
      title: row.title,
      subtitle: "Show",
      href: `/shows/${row.slug}`,
      thumbnail: row.poster_url ?? row.hero_url,
    });
  }

  for (const e of videoEpsRes.data ?? []) {
    const row = e as {
      id: string;
      slug: string | null;
      title: string;
      thumbnail_url: string | null;
      series?: { slug?: string; title?: string; poster_url?: string | null } | null;
    };
    const seriesSlug = row.series?.slug;
    if (!seriesSlug) continue;
    results.push({
      id: `video-ep-${row.id}`,
      title: row.title,
      subtitle: row.series?.title ? `Episode · ${row.series.title}` : "Episode",
      href: `/shows/${seriesSlug}/${row.slug || row.id}`,
      thumbnail: row.thumbnail_url ?? row.series?.poster_url ?? null,
    });
  }

  for (const a of articlesRes.data ?? []) {
    const row = a as {
      id: string;
      slug: string;
      title: string;
      hero_url: string | null;
    };
    results.push({
      id: `article-${row.id}`,
      title: row.title,
      subtitle: "Article",
      href: `/stories/${row.slug}`,
      thumbnail: row.hero_url,
    });
  }

  return dedupeByHref(results);
}

/** Map embedding / transcript chunk hits to navigable search cards.
 * Phase 3: supports clips (moment clips from transcripts) + timestamp deep links (?t=START).
 */
export async function resolveEmbeddingHits(
  hits: EmbeddingSearchResult[],
  subtitle = "Transcript match"
): Promise<SearchResult[]> {
  if (!hits.length || !supabaseConfigured()) return [];

  const episodeIds = hits.filter((h) => h.content_type === "episode").map((h) => h.content_id);
  const videoIds = hits.filter((h) => h.content_type === "video_episode").map((h) => h.content_id);
  const clipIds = hits.filter((h) => h.content_type === "clip").map((h) => h.content_id);

  const sb = supabasePublic();
  const [epsRes, vidsRes, clipsRes] = await Promise.all([
    episodeIds.length
      ? sb
          .from("episodes")
          .select("id, slug, title, show_slug, thumbnail_url")
          .in("id", episodeIds)
      : Promise.resolve({ data: [] as unknown[] }),
    videoIds.length
      ? sb
          .from("video_episodes")
          .select("id, slug, title, thumbnail_url, series:series!inner(slug, poster_url)")
          .in("id", videoIds)
          .eq("status", "published")
      : Promise.resolve({ data: [] as unknown[] }),
    clipIds.length
      ? sb
          .from("clips")
          .select("id, ep_id, storage_path, duration_s, source_phrase, start_s, end_s, episodes:ep_id(slug, title, show_slug)")
          .in("id", clipIds)
          .eq("approved", true)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const epMap = new Map(
    ((epsRes.data ?? []) as Array<{
      id: string;
      slug: string | null;
      title: string;
      show_slug: string;
      thumbnail_url: string | null;
    }>).map((e) => [e.id, e])
  );

  const vidMap = new Map(
    ((vidsRes.data ?? []) as Array<{
      id: string;
      slug: string | null;
      title: string;
      thumbnail_url: string | null;
      series?: { slug?: string; poster_url?: string | null } | null;
    }>).map((e) => [e.id, e])
  );

  const clipMap = new Map(
    ((clipsRes.data ?? []) as Array<{
      id: string;
      ep_id: string | null;
      storage_path: string | null;
      start_s: number | null;
      end_s: number | null;
      source_phrase: string | null;
      episodes?: { slug?: string | null; title?: string; show_slug?: string } | null;
    }>).map((c) => [c.id, c])
  );

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    const key = `${hit.content_type}:${hit.content_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const timeParam = hit.start != null ? `?t=${Math.floor(hit.start)}` : "";

    if (hit.content_type === "episode") {
      const ep = epMap.get(hit.content_id);
      if (!ep) continue;
      results.push({
        id: `transcript-ep-${ep.id}`,
        title: ep.title,
        subtitle,
        href: `/podcasts/${ep.show_slug}/${ep.slug || ep.id}${timeParam}`,
        thumbnail: ep.thumbnail_url,
        excerpt: truncate(hit.chunk),
        startTime: hit.start != null ? Math.floor(hit.start) : undefined,
      });
      continue;
    }

    if (hit.content_type === "video_episode") {
      const ep = vidMap.get(hit.content_id);
      if (!ep?.series?.slug) continue;
      results.push({
        id: `transcript-video-${ep.id}`,
        title: ep.title,
        subtitle,
        href: `/shows/${ep.series.slug}/${ep.slug || ep.id}${timeParam}`,
        thumbnail: ep.thumbnail_url ?? ep.series.poster_url ?? null,
        excerpt: truncate(hit.chunk),
        startTime: hit.start != null ? Math.floor(hit.start) : undefined,
      });
      continue;
    }

    // Phase 3: clip / moment clip from transcript
    if (hit.content_type === "clip") {
      const c = clipMap.get(hit.content_id);
      if (!c?.episodes?.show_slug) continue;
      const epSlug = c.episodes.slug || c.ep_id;
      const time = c.start_s != null ? `?t=${Math.floor(c.start_s)}` : timeParam;
      results.push({
        id: `transcript-clip-${c.id}`,
        title: c.source_phrase || hit.chunk.slice(0, 60),
        subtitle: "Member clip · " + (c.episodes.title || "Moment"),
        href: `/shows/${c.episodes.show_slug}/${epSlug}${time}`,
        thumbnail: null,
        excerpt: truncate(hit.chunk),
        startTime: (c.start_s != null ? Math.floor(c.start_s) : (hit.start != null ? Math.floor(hit.start) : undefined)),
      });
      continue;
    }
  }

  return results;
}

/** Merge result lists; earlier lists win on duplicate href. */
export function mergeSearchResults(...lists: SearchResult[][]): SearchResult[] {
  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const list of lists) {
    for (const r of list) {
      if (seen.has(r.href)) continue;
      seen.add(r.href);
      out.push(r);
    }
  }
  return out;
}