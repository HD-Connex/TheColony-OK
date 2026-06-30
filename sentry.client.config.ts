// Phase 3-05 Sentry wiring (guarded, report-only friendly start).
// Only initializes if DSN is present. Safe to deploy without Sentry DSN set.
// P2-15: For source maps, set SENTRY_AUTH_TOKEN (Vercel) + wrap in next.config.ts with withSentryConfig (see next.config.ts placeholder comments; needs org/project too).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower trace sampling in production to control Sentry ingestion cost.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  replaysOnErrorSampleRate: 1.0,
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
