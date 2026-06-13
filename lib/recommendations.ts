/**
 * Phase 2 Recommendations: embedding-similarity "more like this" + collaborative filtering from usage_events.
 * - embedding: embed query text of current, then searchEmbeddings (pgvector).
 * - collaborative: users who did "view_article" or "play_episode" near a seed also did for others (simple co-occurrence).
 * Gated fully by OPENAI_API_KEY (for embed) + presence of usage_events rows. No key = empty (graceful; caller falls to naive).
 * Powers: replace getRelatedArticles, For You rails on /watch + /my-feed + per-story.
 * Reuses semantic-search + supabase + sanitize patterns.
 */

import { supabasePublic, supabaseAdmin, supabaseConfigured } from "./supabase";
import { embedQuery, semanticSearch, type EmbeddingSearchResult } from "./semantic-search";
import { log } from "./log";

export interface RecItem {
  id: string;
  title: string;
  href: string;
  type: "article" | "episode" | "video_episode" | "clip";
  score: number;
  dek?: string | null;
}

/** "More like this" via embedding similarity on title+dek/body excerpt. */
export async function getSimilarByEmbedding(seedText: string, excludeIds: string[] = [], limit = 4): Promise<RecItem[]> {
  if (!process.env.OPENAI_API_KEY || !seedText.trim() || !supabaseConfigured()) return [];
  const vec = await embedQuery(seedText);
  if (!vec) return [];
  try {
    const hits: EmbeddingSearchResult[] = await semanticSearch(seedText, limit + 4, { threshold: 0.4 });
    const out: RecItem[] = [];
    for (const h of hits) {
      if (excludeIds.includes(h.content_id)) continue;
      // Resolve minimally via public reads (reuse resolve logic patterns but light here)
      if (h.content_type === "episode") {
        const { data } = await supabasePublic().from("episodes").select("id,title,description,show_slug,slug").eq("id", h.content_id).maybeSingle();
        if (data) out.push({ id: data.id, title: data.title, href: `/podcasts/${(data as any).show_slug}/${(data as any).slug || data.id}`, type: "episode", score: h.similarity, dek: (data as any).description });
      } else if (h.content_type === "article") {
        const { data } = await supabasePublic().from("articles").select("id,slug,title,dek").eq("id", h.content_id).eq("status", "published").maybeSingle();
        if (data) out.push({ id: data.id, title: data.title, href: `/stories/${(data as any).slug}`, type: "article", score: h.similarity, dek: (data as any).dek });
      }
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    log.warn("[recs] embedding similar failed", e);
    return [];
  }
}

/** Collaborative: simple co-view from usage_events (event_type like 'view' | 'play' | 'read'). */
export async function getCollaborativeRecs(seedId: string, seedType: string, limit = 4): Promise<RecItem[]> {
  if (!supabaseConfigured()) return [];
  try {
    const sb = supabasePublic(); // note: usage RLS may limit; admin would be better but public recent ok for demo
    // Find users who interacted with seed recently
    const { data: seedEvents } = await sb.from("usage_events").select("user_id").eq("metadata->>target_id", seedId).limit(20);
    const userIds = Array.from(new Set((seedEvents || []).map((e: any) => e.user_id).filter(Boolean)));
    if (!userIds.length) return [];
    // Other targets those users touched
    const { data: others } = await sb
      .from("usage_events")
      .select("metadata")
      .in("user_id", userIds as any)
      .neq("metadata->>target_id", seedId)
      .order("created_at", { ascending: false })
      .limit(30);
    const counts: Record<string, number> = {};
    for (const o of others || []) {
      const t = (o as any).metadata?.target_id;
      const typ = (o as any).metadata?.target_type || "article";
      if (t && t !== seedId) counts[`${typ}:${t}`] = (counts[`${typ}:${t}`] || 0) + 1;
    }
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
    const out: RecItem[] = [];
    for (const [key] of ranked) {
      const [typ, id] = key.split(":");
      if (typ === "article") {
        const { data } = await sb.from("articles").select("id,slug,title,dek").eq("id", id).eq("status", "published").maybeSingle();
        if (data) out.push({ id: data.id, title: data.title, href: `/stories/${data.slug}`, type: "article", score: 0.6, dek: (data as any).dek });
      } else if (typ === "episode") {
        const { data } = await sb.from("episodes").select("id,title,show_slug,slug,description").eq("id", id).maybeSingle();
        if (data) out.push({ id: data.id, title: (data as any).title, href: `/podcasts/${(data as any).show_slug}/${(data as any).slug || id}`, type: "episode", score: 0.6, dek: (data as any).description });
      }
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** Unified recs for a seed (article or episode). Embedding first, then collab merge, dedupe. */
export async function getRecommendations(seed: { id: string; text: string; type: "article" | "episode" }, userId?: string, limit = 5): Promise<RecItem[]> {
  const exclude = [seed.id];
  const emb = await getSimilarByEmbedding(seed.text, exclude, Math.ceil(limit * 0.7));
  const collab = await getCollaborativeRecs(seed.id, seed.type, Math.ceil(limit * 0.6));
  const merged: RecItem[] = [];
  const seen = new Set<string>();
  for (const r of [...emb, ...collab]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    merged.push(r);
    if (merged.length >= limit) break;
  }
  return merged;
}
