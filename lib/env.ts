// Boot-time environment validation. Called from instrumentation.ts register().
// Throws in production when a *core* required var is missing; warns in dev so local
// work without full credentials (payments, cron, video, email, etc.) still boots
// (features degrade gracefully).
//
// Core = what is needed for the public site to render content (Supabase public reads + basic URLs).
// Payments (Stripe), crons/jobs, video (Mux), admin service, email (Resend), blob uploads, AI, etc.
// are intentionally *not* required for boot — they are feature-gated and degrade with warnings or 5xx on use.

const CORE_REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  // Public client key: support modern PUBLISHABLE (sb_publishable_*) or legacy ANON for parity
  // with utils/supabase/* + lib/auth-client + older Supabase project conventions.
  // (The actual presence check below uses the || fallback; we list ANON here for the filter logic only.)
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

// Everything else that used to be "required" is now treated as recommended / feature-specific.
// Missing these will *not* hard-fail boot in prod. Callers must guard (see patterns in stripe.ts, mux.ts,
// admin-auth.ts, email.ts, clips/upload/route.ts, jobs/transcribe/route.ts, rate-limit.ts).
const FEATURE_RECOMMENDED = [
  "SUPABASE_SERVICE_ROLE_KEY", // needed for writes, crons, admin APIs, stripe webhook sync, etc. (use supabaseAdmin)
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CRON_SECRET", // protects /api/cron/* and some jobs; vercel.json schedules them. Without = 403 on cron hits in prod (intentional).
  "ADMIN_SERVICE_TOKEN", // machine-to-machine for /api/jobs/* + moderate + transcribe (requireServiceToken)
  // Stripe prices (any one of the common ones enables membership flows)
  "STRIPE_PRICE_SETTLER",
  "STRIPE_PRICE_MEMBER",
  "STRIPE_PRICE_PATRIOT",
  "STRIPE_PRICE_FOUNDER",
  // Video / live
  "MUX_TOKEN_ID",
  "MUX_TOKEN_SECRET",
  "MUX_WEBHOOK_SECRET",
  "MUX_SIGNING_KEY_ID",
  "MUX_SIGNING_PRIVATE_KEY",
  // Storage / uploads
  "BLOB_READ_WRITE_TOKEN",
  // Email
  "RESEND_API_KEY",
  // AI / search / transcription
  "OPENAI_API_KEY",
  "GROQ_API_KEY",
  // Rate limit (multi-instance)
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  // Observability (guarded in sentry.* + csp-report)
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
] as const;

export function assertEnv(): void {
  const missingCore = CORE_REQUIRED_IN_PRODUCTION.filter((k) => !process.env[k]);
  const missingFeatures = FEATURE_RECOMMENDED.filter((k) => !process.env[k]);

  // Special-case the public Supabase key: allow either ANON_KEY *or* PUBLISHABLE_KEY.
  // Do not fail the assert if at least one public key is present.
  const hasSupabasePublicKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const effectiveMissingCore = missingCore.filter((k) => {
    if (k === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      return !hasSupabasePublicKey;
    }
    return true;
  });

  if (effectiveMissingCore.length > 0) {
    const msg = `Missing core required environment variables: ${effectiveMissingCore.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${msg}. Set them in Vercel project settings. See .env.example.`);
    }
    console.warn(`[env] ${msg} — running in degraded dev mode (public reads may fail).`);
  }

  // Feature keys: always warn only in dev (never hard-fail prod boot for optional features).
  // This allows basic content site (news, podcasts, stories, search, live 24/7 if configured via public HLS) to run
  // without Stripe, Mux, cron protection, Resend, Blob, service role, etc.
  if (missingFeatures.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[env] Optional/feature vars unset (corresponding features will degrade or 503 on use): ${missingFeatures.join(", ")}`,
    );
  }

  // In prod we still surface (non-throwing) which optional features are unavailable — useful for logs.
  if (missingFeatures.length > 0 && process.env.NODE_ENV === "production") {
    console.warn(
      `[env] Production: optional feature envs missing (graceful degradation): ${missingFeatures.join(", ")}`
    );
  }
}
