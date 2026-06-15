// Phase 3-05 Sentry wiring for Edge runtime (guarded).
// P2-15: For source maps, set SENTRY_AUTH_TOKEN (Vercel) + wrap in next.config.ts with withSentryConfig (see next.config.ts placeholder comments; needs org/project too).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
});
