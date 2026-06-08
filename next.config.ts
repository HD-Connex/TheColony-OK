import type { NextConfig } from "next";

// Security headers applied to every route. Intentionally CSP-free for now: the
// site mixes inline styles + third-party embeds (YouTube/Rumble/Vimeo), Stripe,
// Supabase, and Mux, so a Content-Security-Policy needs a tested allowlist before
// enabling (see the commented template below) — shipping a wrong CSP breaks the
// page silently. These headers are safe to apply unconditionally.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // CSP template — enable after verifying embeds/Stripe/Supabase/Mux:
  // { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data: https:; media-src 'self' https://stream.mux.com blob:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://rumble.com https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline';" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The UI renders plain <img> tags (no next/image), so the optimizer is unused;
  // `unoptimized` keeps builds from depending on the /_next/image pipeline.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;