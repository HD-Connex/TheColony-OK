import type { MetadataRoute } from "next";
import { getActiveContributorSlugs } from "@/lib/contributors";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";
import { getArticles } from "@/lib/articles";
import { getTopics } from "@/lib/topics";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://thecolonyok.com";
// Production: always https://thecolonyok.com (hardcoded fallback). Previews on Vercel use deployment URL unless env var pinned.

const STATIC_PATHS = [
  "",
  "/stories",
  "/news",
  "/live",
  "/podcasts",
  "/shows",
  "/watch",      // Phase 4 unified video hub (new route coverage)
  "/clips",      // Member clips dispatches
  "/briefing",   // Member AI briefing (gated)
  "/topics",     // Phase 1 1.2 topics index + dynamic
  "/counties",
  "/my-feed",
  "/blog",
  "/search",
  "/pricing",
  "/membership",
  "/membership/account",
  "/vs/blaze",
  "/about",
  "/journalists",
  "/advertise",
  "/submit-a-tip",
  "/personalities", // Phase 8: personalities hub (TRACK B Layer5/6, mixed work, Person JsonLd, SEO/GEO)
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
    priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.7,
  }));

  // Contributors (existing)
  const contributorSlugs = await getActiveContributorSlugs().catch(() => []);
  const contributorRoutes: MetadataRoute.Sitemap = contributorSlugs.map((slug) => ({
    url: `${SITE_URL}/contributors/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Phase 3 advanced SEO: dynamic show + podcast pages (per-ep have their own generateMetadata + VideoObject)
  // Clips: embedded (VideoObject schema lives in EpisodePlayer/ClipEmbed + future dedicated clip pages or /live)
  // Rural/GEO: tags like ag/energy will surface via content; sitemap helps discovery.
  let showRoutes: MetadataRoute.Sitemap = [];
  try {
    const { shows } = await getShowsWithEpisodeCounts(20);
    showRoutes = shows.flatMap((s) => [
      {
        url: `${SITE_URL}/podcasts/${s.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.65,
      },
      {
        url: `${SITE_URL}/shows/${s.slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
    ]);
  } catch {
    // graceful in worktree / no DB
  }

  // Published articles (story detail pages).
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getArticles({ limit: 500 });
    articleRoutes = articles.map((a) => ({
      url: `${SITE_URL}/stories/${a.slug}`,
      lastModified: a.published_at ? new Date(a.published_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // graceful in worktree / no DB
  }

  // Phase 1 1.2: Topics index + per-topic pages (from real topics or demo categories/counties)
  let topicRoutes: MetadataRoute.Sitemap = [];
  try {
    const topics = await getTopics();
    topicRoutes = topics.map((t) => ({
      url: `${SITE_URL}/topics/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    // graceful fallback (demo topics will be generated on /topics visit)
  }

  return [...staticRoutes, ...contributorRoutes, ...showRoutes, ...articleRoutes, ...topicRoutes];
}