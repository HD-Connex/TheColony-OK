import type { MetadataRoute } from "next";
import { getActiveContributorSlugs } from "@/lib/contributors";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";

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
  "/search",
  "/pricing",
  "/membership",
  "/membership/account",
  "/vs/blaze",
  "/about",
  "/journalists",
  "/advertise",
  "/submit-a-tip",
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

  // Future: approved clips could get /clips or per-ep deep links with lastmod from clips.created_at
  // For now clips are discoverable via episode pages + Live + JSON-LD VideoObject (seo-schema).

  return [...staticRoutes, ...contributorRoutes, ...showRoutes];
}