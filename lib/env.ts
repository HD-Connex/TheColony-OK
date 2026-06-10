// Boot-time environment validation. Called from instrumentation.ts register().
// Throws in production when a required var is missing; warns in dev so local
// work without full credentials still boots (features degrade gracefully).

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const RECOMMENDED = [
  "STRIPE_PRICE_SETTLER",
  "MUX_TOKEN_ID",
  "MUX_TOKEN_SECRET",
  "MUX_WEBHOOK_SECRET",
  "MUX_SIGNING_KEY_ID",
  "MUX_SIGNING_PRIVATE_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "RESEND_API_KEY",
  "ADMIN_SERVICE_TOKEN",
] as const;

export function assertEnv(): void {
  const missing = REQUIRED_IN_PRODUCTION.filter((k) => !process.env[k]);
  const missingRecommended = RECOMMENDED.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(", ")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${msg}. Set them in Vercel project settings. See .env.example.`);
    }
    console.warn(`[env] ${msg} — running in degraded dev mode.`);
  }

  if (missingRecommended.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn(
      `[env] Optional vars unset (features degrade): ${missingRecommended.join(", ")}`,
    );
  }
}
