import type { NextConfig } from 'next';

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Declares the reporting group referenced by the CSP `report-to default` directive
  // below. Modern Reporting API v1 replacement for the legacy `Report-To` header;
  // without this, `report-to default` points at an undefined group and is inert.
  {
    key: "Reporting-Endpoints",
    value: 'default="/api/csp-report"',
  },
  // Phase 3: Enforce CSP (was report-only). Tighten over time as needed.
  // Allows current stack: Plausible, Stripe, YouTube/Rumble embeds, Supabase, Vercel Blob (clips), plausible analytics.
  // report-uri still present for violation reporting (via /api/csp-report).
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://js.stripe.com https://www.youtube.com https://rumble.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io https://api.stripe.com https://*.vercel.app blob: https://*.public.blob.vercel-storage.com; " +
      "media-src 'self' blob: https:; " +
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://rumble.com https://js.stripe.com; " +
      "report-uri /api/csp-report; report-to default;",
  },
];

const nextConfig: NextConfig = {
  /* defaults for vercel */
  reactStrictMode: true,
  poweredByHeader: false,
  // P2-15 (CI hygiene): ignoreBuildErrors REMOVED. Strict TS now enforced on builds for app/ and lib/ (tsconfig excludes only _archived_TheColony + node_modules).
  // Run `npx tsc --noEmit --skipLibCheck` (as in CI) or full to surface; fix real errors in active sources only.
  // Dev still full checks; prod builds now fail on TS issues in src (no legacy bypass). Clean at time of removal.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "i.ytimg.com" },
      // Pexels stock CDN — used by lib/media-map STOCK fallbacks + seeded hero_url.
      // Without this, next/image throws "url not allowed" → RSC 500 (e.g. the two
      // story heroes oklahoma-budget-crisis / lobbyist-network-silence).
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  // TWA/PWA Phase 8: manifest served via app/manifest.ts (standalone + icons/maskable in public/icon-*.png + screenshots).
  // No PWA plugin needed (Next built-in). assetlinks for TWA verification in public/.well-known (see vercel.json + MOBILE doc).
  // Offline shell in public/sw.js (v6, clips SWR + shell routes). Test: build produces manifest.webmanifest; /sw.js registers in SiteClient.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // p2-14 cache headers for CDN (s-maxage): example for stable public paths (robots, sitemap, manifest, health demo). Hot RSC use revalidate+unstable_cache.
      // Focus on 3-4 hot: e.g. home/news benefit from reval 60 + lib caches; add per-route if api surfaces content.
      { source: "/robots.txt", headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate" }] },
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate" }] },
      { source: "/api/health", headers: [{ key: "Cache-Control", value: "public, s-maxage=15, stale-while-revalidate=30" }] },
    ];
  },
};

// Phase 3-05: Sentry runtime wiring is in sentry.*.config.ts + instrumentation.ts.
// These are completely optional (no-op without SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN).
// Removed build wrapper (withSentryConfig) to eliminate any potential source-map-upload or auth errors during Vercel builds when tokens/org not configured.
// Re-enable the wrapper later with proper SENTRY_AUTH_TOKEN + org/project for full source maps + releases.

// P2-15 (Sentry source maps enable): 
// To enable source map uploads for better error stack traces in Sentry (prod):
// - Add SENTRY_AUTH_TOKEN (from sentry.io org settings > Auth Tokens) + SENTRY_ORG, SENTRY_PROJECT to Vercel env vars (Settings > Environment Variables; for build only).
// - Re-introduce wrapper in this file:
//   import { withSentryConfig } from '@sentry/nextjs';
//   export default withSentryConfig(nextConfig, {
//     // For all available options, see:
//     // https://github.com/getsentry/sentry-webpack-plugin#options
//     org: process.env.SENTRY_ORG,
//     project: process.env.SENTRY_PROJECT,
//     authToken: process.env.SENTRY_AUTH_TOKEN,
//     sourcemaps: {
//       assets: './**/*', // or specific .next/static etc
//       ignore: ['**/_archived_**', '**/node_modules/**'],
//     },
//     release: { /* name, setCommits etc */ },
//     // widenClientFileUpload: true,
//   });
// Placeholder comments only — do NOT activate wrapper until token is provisioned in Vercel (would fail builds otherwise, as prior note).
// See also sentry.*.config.ts for DSN guarded inits.
export default nextConfig;