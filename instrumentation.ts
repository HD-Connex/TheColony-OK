// Phase 3-05/3-06: Sentry + boot env validation for Next.js 16 (App Router).
// register() runs once per cold start (Node/Edge). Call assertEnv() first so
// missing required vars fail fast in prod (or warn in dev).
import * as Sentry from "@sentry/nextjs";
import { assertEnv } from "@/lib/env";

export async function register() {
  // Boot validation — throws in prod on missing REQUIRED, warns otherwise.
  // See .env.example for the full list + why each exists.
  assertEnv();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
