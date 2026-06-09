import type { MetadataRoute } from "next";
import { getActiveContributorSlugs } from "@/lib/contributors";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://thecolonyok.com";

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

  const contributorSlugs = await getActiveContributorSlugs().catch(() => []);
  const contributorRoutes: MetadataRoute.Sitemap = contributorSlugs.map((slug) => ({
    url: `${SITE_URL}/contributors/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...contributorRoutes];
}