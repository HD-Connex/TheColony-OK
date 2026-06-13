// Topics lib (Phase 1 1.2)
// getTopics, getTopic, getTopicArticles — supports real DB topics + article_topics join.
// Graceful fallback to existing categories + counties from articles (seed data) for immediate breadth.
// No new deps. Reuses getArticles + supabasePublic.
// Designed to work even before 0026 applied or if join empty.

import { supabasePublic } from "./supabase";
import { getArticles, type Article, getCountiesWithCounts } from "./articles";

export interface Topic {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  count?: number; // article count for listing
}

const DEMO_CATEGORIES = [
  { slug: "economy", name: "Economy", description: "Energy, ag, jobs, and Oklahoma business beats." },
  { slug: "investigations", name: "Investigations", description: "Deep reporting and accountability stories." },
  { slug: "politics", name: "Politics", description: "Statehouse, policy, and elections coverage." },
  { slug: "culture", name: "Culture", description: "Faith, family, community, and rural heritage." },
  { slug: "state", name: "Statewide", description: "Oklahoma-wide issues and trends." },
];

const DEMO_RURAL: Topic = {
  slug: "rural",
  name: "Rural Oklahoma",
  description: "County-level stories from farms, patches, and small towns.",
};

export async function getTopics(): Promise<Topic[]> {
  const sb = supabasePublic();
  try {
    // Try real topics table (may not exist yet or empty)
    const { data, error } = await sb
      .from("topics")
      .select("id,slug,name,description,sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      // Enrich with counts from article_topics if present
      const topics = data as any[];
      const counts = await getTopicArticleCounts(topics.map((t: any) => t.id)).catch(() => ({} as Record<string, number>));
      return topics.map((t: any) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description ?? null,
        count: counts[t.id] ?? 0,
      }));
    }
  } catch {
    // table may not exist in dev / pre-migration; fall through
  }

  // Fallback: synthesize from articles' categories + counties (seed data breadth)
  // This ensures /topics and /topics/[slug] work out of the box with existing content.
  return getDemoTopicsFromArticles();
}

async function getTopicArticleCounts(topicIds: string[]): Promise<Record<string, number>> {
  if (!topicIds.length) return {};
  const sb = supabasePublic();
  const { data, error } = await sb
    .from("article_topics")
    .select("topic_id")
    .in("topic_id", topicIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as any[]) {
    const tid = row.topic_id as string;
    counts[tid] = (counts[tid] || 0) + 1;
  }
  return counts;
}

async function getDemoTopicsFromArticles(): Promise<Topic[]> {
  const [articles, countiesWithCounts] = await Promise.all([
    getArticles({ limit: 100 }).catch(() => [] as Article[]),
    getCountiesWithCounts().catch(() => [] as { county: string; count: number }[]),
  ]);

  const catMap = new Map<string, { name: string; count: number }>();
  const countyMap = new Map<string, { name: string; count: number }>();

  for (const a of articles) {
    if (a.category) {
      const key = a.category.toLowerCase();
      const existing = catMap.get(key) || { name: a.category, count: 0 };
      existing.count += 1;
      catMap.set(key, existing);
    }
    if (a.county) {
      const key = a.county.toLowerCase();
      const existing = countyMap.get(key) || { name: `${a.county} County`, count: 0 };
      existing.count += 1;
      countyMap.set(key, existing);
    }
  }

  const demo: Topic[] = [];

  // Core categories as topics (use known nice names)
  for (const dc of DEMO_CATEGORIES) {
    const catKey = dc.slug; // already lower
    const info = catMap.get(catKey);
    demo.push({
      slug: dc.slug,
      name: dc.name,
      description: dc.description,
      count: info?.count ?? 0,
    });
  }

  // Add rural as composite
  const ruralCount = articles.filter((a) =>
    (a.category?.toLowerCase().includes("economy") || a.category?.toLowerCase().includes("culture")) ||
    !!a.county
  ).length;
  demo.push({ ...DEMO_RURAL, count: ruralCount });

  // Add counties as topics (for local breadth) — use slug like "tulsa", name "Tulsa County"
  for (const c of countiesWithCounts.slice(0, 8)) { // cap for UI breadth without overload
    const slug = c.county.toLowerCase().replace(/\s+/g, "-");
    demo.push({
      slug,
      name: `${c.county} County`,
      description: `Stories from ${c.county} County.`,
      count: c.count,
    });
  }

  // Dedupe by slug, keep first (prefer cat over county collisions)
  const seen = new Set<string>();
  const unique = demo.filter((t) => {
    if (seen.has(t.slug)) return false;
    seen.add(t.slug);
    return true;
  });

  return unique;
}

export async function getTopic(slug: string): Promise<Topic | null> {
  if (!slug) return null;
  const normalized = slug.toLowerCase();

  const sb = supabasePublic();
  try {
    const { data, error } = await sb
      .from("topics")
      .select("id,slug,name,description")
      .eq("slug", normalized)
      .maybeSingle();

    if (!error && data) {
      const t = data as any;
      const count = await getTopicArticleCountById(t.id).catch(() => 0);
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        description: t.description ?? null,
        count,
      };
    }
  } catch {
    // fallthrough to demo
  }

  // Demo fallback: look up in synthesized list
  const demos = await getDemoTopicsFromArticles();
  return demos.find((t) => t.slug === normalized) ?? null;
}

async function getTopicArticleCountById(topicId: string): Promise<number> {
  const sb = supabasePublic();
  const { count, error } = await sb
    .from("article_topics")
    .select("article_id", { count: "exact", head: true })
    .eq("topic_id", topicId);
  return error ? 0 : (count ?? 0);
}

export async function getTopicArticles(slug: string, limit = 24): Promise<Article[]> {
  if (!slug) return [];
  const normalized = slug.toLowerCase();

  const sb = supabasePublic();
  let realArticles: Article[] = [];

  try {
    // 1. Try to resolve topic id
    const { data: topicRow } = await sb
      .from("topics")
      .select("id")
      .eq("slug", normalized)
      .maybeSingle();

    if (topicRow?.id) {
      // 2. Get article_ids via join
      const { data: joins } = await sb
        .from("article_topics")
        .select("article_id")
        .eq("topic_id", topicRow.id);

      const ids = (joins ?? []).map((j: any) => j.article_id as string);
      if (ids.length > 0) {
        // 3. Fetch full articles (reuse getArticles pattern + filter by ids; fallbacks inside getArticles)
        // Since getArticles doesn't filter by id set, fetch more + filter client-side (small data)
        const all = await getArticles({ limit: 200 }).catch(() => [] as Article[]);
        realArticles = all.filter((a: any) => ids.includes(a.id)).slice(0, limit);
        if (realArticles.length > 0) return realArticles;
      }
    }
  } catch {
    // no topics table / no joins: fall through
  }

  // Fallback: filter articles by category match OR county match (using seed categories/counties as topics)
  // This guarantees content when migration not applied or join empty. Broad coverage.
  const allArticles = await getArticles({ limit: 200 }).catch(() => [] as Article[]);

  const filtered = allArticles.filter((a) => {
    const cat = (a.category ?? "").toLowerCase();
    const cnty = (a.county ?? "").toLowerCase().replace(/\s+/g, "-");

    // Direct slug match against category (e.g. "economy")
    if (cat === normalized || cat.includes(normalized) || normalized.includes(cat)) return true;

    // County slug match (e.g. "tulsa")
    if (cnty === normalized) return true;

    // Special composites
    if (normalized === "rural") {
      return !!(a.county) ||
        cat.includes("economy") ||
        cat.includes("culture") ||
        cat.includes("ag");
    }
    if (normalized === "investigations") return cat.includes("investigation");
    if (normalized === "politics") return cat.includes("politic");
    if (normalized === "culture") return cat.includes("culture");
    if (normalized === "economy") return cat.includes("economy");
    if (normalized === "state") return cat.includes("state") || !a.county;

    return false;
  });

  return filtered.slice(0, limit);
}
