// Phase 3-05/3-06: Sentry + boot env validation for Next.js 16 (App Router).
// register() runs once per cold start (Node/Edge). Call assertEnv() first so
// missing *core* vars fail fast in prod (or warn in dev). Feature keys
// (Stripe, CRON_SECRET, Mux, service role, Resend, etc.) no longer block boot;
// they degrade gracefully. See lib/env.ts + .env.example.
import * as Sentry from "@sentry/nextjs";
import { assertEnv } from "@/lib/env";

export async function register() {
  // Boot validation — throws in prod on missing CORE (URL + public Supabase key + SITE_URL).
  // Feature/optional vars only warn. See .env.example for the full list + degradation notes.
  assertEnv();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
