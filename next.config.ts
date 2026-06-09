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
  // Phase 3-05: CSP report-only (non-blocking). Tighten over time.
  // Allows current stack: Plausible, Stripe, YouTube/Rumble embeds, Supabase, Vercel Blob (clips), plausible analytics.
  {
    key: "Content-Security-Policy-Report-Only",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://js.stripe.com https://www.youtube.com https://rumble.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://*.supabase.co https://plausible.io https://api.stripe.com https://*.vercel.app blob: https://*.public.blob.vercel-storage.com; " +
      "media-src 'self' blob: https:; " +
      "frame-src https://www.youtube.com https://rumble.com https://js.stripe.com; " +
      "report-uri /api/csp-report; report-to default;",
  },
];

const nextConfig: NextConfig = {
  /* defaults for vercel */
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Phase 3-05: Sentry runtime wiring is in sentry.*.config.ts + instrumentation.ts.
// These are completely optional (no-op without SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN).
// Removed build wrapper (withSentryConfig) to eliminate any potential source-map-upload or auth errors during Vercel builds when tokens/org not configured.
// Re-enable the wrapper later with proper SENTRY_AUTH_TOKEN + org/project for full source maps + releases.
export default nextConfig;