import type { MetadataRoute } from "next";

// .trim() guards against trailing whitespace/newlines in the Vercel env var, which
// otherwise corrupt the emitted URLs (e.g. "https://thecolonyok.com /sitemap.xml" →
// Lighthouse "Invalid sitemap URL"). Root cause is a dirty env var; this is defense-in-depth.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://thecolonyok.com"
).trim();
// Production: always https://thecolonyok.com (hardcoded fallback). Previews on Vercel use deployment URL unless env var pinned.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/profile", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}