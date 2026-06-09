import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

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

// Phase 3-05: Sentry + Next.js config wrapper.
// Provides automatic source maps, release tracking, and better error context for the clips layer etc.
// The wrapper is safe even without DSN (Sentry just won't send events).
export default withSentryConfig(nextConfig, {
  // Minimal safe options for current @sentry/nextjs (avoids deprecation + type issues in this version).
  // Full options: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  silent: true,
  // org and project can be provided via .sentryclirc or env if you want to upload source maps on build.
  // widenClientFileUpload: true, // enable later when you have a Sentry org/project configured
});