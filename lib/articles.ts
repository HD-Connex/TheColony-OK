// Articles for home + news surfaces (Supabase + RLS).
import { supabasePublic, supabaseAdmin } from "./supabase";
import { STORY_HERO, STORY_HERO_ALT, safeStockImage } from "./media-map";
import { embedQuery } from "./semantic-search"; // Phase 2: generate embeddings on article ingest/publish for semantic search
import { getRecommendations } from "./recommendations"; // Phase 2: AI recs replace naive category/recency
import { getPaginateParams, type PaginateParams } from "./paginate"; // P1-10: pagination support for listings (avoids full scans)

export interface Article {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published_at: string;
  updated_at?: string; // added for defensive JsonLd / story pages (Phase 6 verifier)
  tier_required?: string | null;
  hero_url?: string | null;
  hero_alt?: string | null;
  category?: string | null;
  county?: string | null;
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

type ArticleRow = Omit<Article, "description" | "tier_required" | "hero_url" | "hero_alt"> & {
  body?: string | null;
  member_only?: boolean | null;
  hero_url?: string | null;
  hero_alt?: string | null;
  contributor?: Article["contributor"];
};

export const ARTICLE_COLS =
  "id,slug,title,dek,body,published_at,member_only,hero_url,hero_alt,category,county,status";

const CONTRIBUTOR_JOIN =
  "contributor:contributors!contributor_id(slug,name,tier,headshot_url,location)";

const ARTICLE_CONTRIBUTOR_FALLBACK: Record<string, Article["contributor"]> = {
  "oklahoma-budget-crisis": { slug: "sarah-mitchell", name: "Sarah Mitchell", tier: "headliner", location: "Oklahoma City, OK" },
  "lobbyist-network-silence": { slug: "sarah-mitchell", name: "Sarah Mitchell", tier: "headliner", location: "Oklahoma City, OK" },
  "parents-curriculum-pushback": { slug: "rachel-torres", name: "Rachel Torres", tier: "featured", location: "Lawton, OK" },
  "energy-sector-green-mandates": { slug: "marcus-webb", name: "Marcus Webb", tier: "featured", location: "Oklahoma City, OK" },
  "sheriffs-race-investigation": { slug: "sarah-mitchell", name: "Sarah Mitchell", tier: "headliner", location: "Oklahoma City, OK" },
  "tulsa-dei-defund-vote": { slug: "rachel-torres", name: "Rachel Torres", tier: "featured", location: "Tulsa, OK" },
  // Migrated newsletter archive articles (ex-external refs, now native)
  "harvest-reality-2026": { slug: "wes-carter", name: "Wes Carter", tier: "featured", location: "Enid, OK" },
  "patch-reality-energy": { slug: "wes-carter", name: "Wes Carter", tier: "featured", location: "Guymon, OK" },
  "heritage-4h-counties": { slug: "rachel-torres", name: "Rachel Torres", tier: "featured", location: "Lawton, OK" },
  // Phase 6 new rural OK articles (wes-carter fits ag/ranch focus; seed has UPDATEs)
  "panhandle-coop-grid-strain-2026": { slug: "wes-carter", name: "Wes Carter", tier: "featured", location: "Guymon, OK" },
  "fifth-gen-ranchers-dc-mandates-2026": { slug: "wes-carter", name: "Wes Carter", tier: "featured", location: "Guymon, OK" },
};

function normalizeContributor(raw: unknown): Article["contributor"] {
  if (!raw) return null;
  if (Array.isArray(raw)) return (raw[0] as Article["contributor"]) ?? null;
  return raw as Article["contributor"];
}

function normalizeRow(row: Record<string, unknown>): ArticleRow {
  const { contributor, ...rest } = row;
  return {
    ...(rest as ArticleRow),
    contributor: normalizeContributor(contributor),
  };
}

function enrichArticle(row: ArticleRow): Article {
  const memberOnly = row.member_only ?? false;
  return {
    ...row,
    description: row.body ?? null,
    tier_required: memberOnly ? "member" : "free",
    member_only: memberOnly,
    contributor: row.contributor ?? ARTICLE_CONTRIBUTOR_FALLBACK[row.slug] ?? null,
    hero_url: safeStockImage("story", row.slug, row.hero_url) || STORY_HERO[row.slug] || null,
    hero_alt: row.hero_alt || STORY_HERO_ALT[row.slug] || row.title,
  };
}

export async function getArticles(opts: { limit?: number; offset?: number; county?: string } & Partial<PaginateParams> = {}): Promise<Article[]> {
  const { county } = opts;
  const { limit, offset } = getPaginateParams(opts); // P1-10: use shared paginate (supports page/offset/limit, capped)
  const sb = supabasePublic();
  const from = offset;
  const to = offset + limit - 1;
  let q = sb
    .from("articles")
    .select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}`)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);
  if (county) q = q.eq("county", county);

  const joined = await q;

  const rows = joined.error
    ? (
        await sb
          .from("articles")
          .select(ARTICLE_COLS)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .range(from, to)
      ).data ?? []
    : joined.data ?? [];

  return (rows as Record<string, unknown>[]).map((r) => enrichArticle(normalizeRow(r)));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const sb = supabasePublic();
  const joined = await sb
    .from("articles")
    .select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  let row: Record<string, unknown> | null = null;
  if (!joined.error && joined.data) {
    row = joined.data as Record<string, unknown>;
  } else {
    const plain = await sb
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    row = (plain.data as Record<string, unknown>) ?? null;
  }
  return row ? enrichArticle(normalizeRow(row)) : null;
}

export async function getRelatedArticles(slug: string, limit = 3): Promise<Article[]> {
  const current = await getArticleBySlug(slug);
  if (!current) return [];

  // Phase 2 AI recs: prefer embedding sim + collab (usage_events). Gated graceful degrade to old behavior.
  try {
    const seedText = `${current.title} ${current.dek || current.description || ""}`;
    const recs = await getRecommendations({ id: current.id, text: seedText, type: "article" }, undefined, limit);
    if (recs.length > 0) {
      // Map rec items back to full Article shape (light fetch)
      const ids = recs.map(r => r.id);
      const { data } = await supabasePublic()
        .from("articles")
        .select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}`)
        .in("id", ids)
        .eq("status", "published");
      if (data && data.length) {
        const mapped = (data as any[]).map((r) => enrichArticle(normalizeRow(r)));
        if (mapped.length) return mapped.slice(0, limit);
      }
    }
  } catch {}

  // Fallback: original naive category + recency (preserves behavior when no keys or no embeddings/usage)
  const sb = supabasePublic();

  const fetchRelated = async (withCategory: boolean) => {
    const joinedQ = sb
      .from("articles")
      .select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}`)
      .eq("status", "published")
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(limit);
    const joined = withCategory && current?.category
      ? await joinedQ.eq("category", current.category)
      : await joinedQ;

    if (!joined.error && joined.data) {
      return (joined.data as Record<string, unknown>[]).map((r) => enrichArticle(normalizeRow(r)));
    }

    const plainQ = sb
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("status", "published")
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(limit);
    const plain = withCategory && current?.category
      ? await plainQ.eq("category", current.category)
      : await plainQ;

    return ((plain.data ?? []) as Record<string, unknown>[]).map((r) => enrichArticle(normalizeRow(r)));
  };

  if (current?.category) {
    const related = await fetchRelated(true);
    if (related.length >= limit) return related;
  }
  return fetchRelated(false);
}

export async function getTierArticles(_tier: string, limit = 3): Promise<Article[]> {
  return getArticles({ limit });
}

/** Count for pager UI (P1 pagination surfaces). */
export async function getArticlesCount(county?: string): Promise<number> {
  const sb = supabasePublic();
  let q = sb.from("articles").select("id", { count: "exact", head: true }).eq("status", "published");
  if (county) q = q.eq("county", county);
  const { count } = await q;
  return count || 0;
}

/** Get distinct counties with story counts for /counties page. */
export async function getCountiesWithCounts(): Promise<{ county: string; count: number }[]> {
  const sb = supabasePublic();
  const { data, error } = await sb
    .from("articles")
    .select("county", { count: "exact" })
    .eq("status", "published")
    .not("county", "is", null);

  if (error || !data) return [];

  const counts = data.reduce((acc: Record<string, number>, row: any) => {
    const c = row.county as string;
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([county, count]) => ({ county, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

// ===== ADMIN / EDITOR HELPERS (use supabaseAdmin only; called from gated routes or server components) =====

export interface AdminArticleInput {
  slug: string;
  title: string;
  dek?: string | null;
  body?: string | null; // store MD or HTML; we treat as content source
  body_md?: string | null;
  status?: "draft" | "review" | "scheduled" | "published" | "archived";
  tier_required?: string | null;
  hero_url?: string | null;
  hero_alt?: string | null;
  category?: string | null;
  county?: string | null; // Phase 3 local moat
  contributor_id?: string | null;
  published_at?: string | null;
  review_notes?: string | null;
}

export async function adminListArticles(opts: { status?: string; limit?: number } = {}) {
  const { status, limit = 50 } = opts;
  const sb = supabaseAdmin();
  let q = sb.from("articles").select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}, body_md, review_notes`).order("updated_at", { ascending: false }).limit(limit);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((r: any) => enrichArticle(normalizeRow(r)));
}

export async function adminGetArticle(idOrSlug: string) {
  const sb = supabaseAdmin();
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const { data } = await sb
    .from("articles")
    .select(`${ARTICLE_COLS}, ${CONTRIBUTOR_JOIN}, body_md, review_notes`)
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();
  return data ? enrichArticle(normalizeRow(data as any)) : null;
}

export async function adminUpsertArticle(input: AdminArticleInput & { id?: string }) {
  const sb = supabaseAdmin();
  const payload: any = {
    slug: input.slug,
    title: input.title,
    dek: input.dek ?? null,
    body: input.body ?? input.body_md ?? null,
    body_md: input.body_md ?? input.body ?? null,
    status: input.status ?? "draft",
    tier_required: input.tier_required ?? "free",
    hero_url: input.hero_url ?? null,
    hero_alt: input.hero_alt ?? null,
    category: input.category ?? null,
    county: input.county ?? null,
    contributor_id: input.contributor_id ?? null,
    published_at: input.published_at ?? (input.status === "published" ? new Date().toISOString() : null),
    review_notes: input.review_notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await sb.from("articles").update(payload).eq("id", input.id).select().single();
    if (error) throw error;
    // Phase 2 AI: re-embed on update if published
    if (data && (data as any).status === 'published') void embedArticleForSearch(data as any);
    return data;
  } else {
    const { data, error } = await sb.from("articles").insert(payload).select().single();
    if (error) throw error;
    if (data && (data as any).status === 'published') void embedArticleForSearch(data as any);
    return data;
  }
}

async function embedArticleForSearch(article: { id: string; title?: string; dek?: string | null; description?: string | null; body?: string | null }) {
  if (!process.env.OPENAI_API_KEY) return; // gated
  const text = [article.title, article.dek, article.description, (article.body || '').slice(0, 1200)].filter(Boolean).join(' \n ');
  if (!text.trim()) return;
  const vec = await embedQuery(text);
  if (!vec) return;
  try {
    await supabaseAdmin().from('content_embeddings').insert({
      content_type: 'article' as any, // extend for articles (search will resolve)
      content_id: article.id,
      chunk: text.slice(0, 900),
      embedding: vec,
    });
  } catch {}
}

export async function adminDeleteArticle(id: string) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("articles").delete().eq("id", id);
  if (error) throw error;
  return { ok: true };
}