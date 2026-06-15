# Exhaustive Environment Variables / Secrets / Keys Audit — The Colony OK (thecolony-app)

**Date:** 2026-06-11  
**Scope:** Entire active codebase (app/, lib/, utils/, scripts/, middleware.ts, instrumentation.ts, next.config.ts, vercel.json, .env.example, all *.ts(x) with process.env reads).  
**Method:** Full `grep -r "process\.env\."` (105+ hits), targeted greps for every key name (SUPABASE_*, STRIPE_*, CRON_SECRET, ADMIN_*, RESEND_*, MUX_*, BLOB_*, SENTRY_*, UPSTASH_*, OPENAI/GROQ, DIRECT_URL, 247_*, YT_*, etc.), full reads of lib/env.ts + .env.example + all API routes + all lib/* + scripts/* + configs + utils/supabase/* + key pages/components. Attacked *every* reference.

**Key Principle Applied (post-audit fixes):** Basic public content runtime (news, podcasts, stories, search, live fallbacks, static pages) must boot and render without payments, video signing, cron secrets, email, admin service tokens, blob, AI, or even service-role DB key. Those are *feature* paths that degrade (503, no-op, 403 on protected routes, warnings). Only true core (public Supabase reads + site URL) are boot-required.

---

## 1. lib/env.ts + Boot Validation (instrumentation.ts)

**File:** `lib/env.ts` (original)
**Original REQUIRED_IN_PRODUCTION (hard throw in prod via assertEnv):**
```ts
const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  // Support ANON_KEY (primary) or PUBLISHABLE_KEY (fallback ...)
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const RECOMMENDED = [ "STRIPE_PRICE_SETTLER", "MUX_TOKEN_ID", ... "ADMIN_SERVICE_TOKEN" ];
```

**Calls:**
- `instrumentation.ts:10`: `assertEnv();` — runs on every cold start (Node + Edge via register()).
- In prod: any missing → `throw new Error(...)` → full app boot failure on Vercel.

**Problems (original):**
- Over-required non-essentials (CRON_SECRET, full Stripe, service role) for "basic runtime".
- Special-case logic for ANON/PUBLISHABLE was defective: `NEXT_PUBLIC_SUPABASE_ANON_KEY` was *never listed in the array*, so the filter did almost nothing. Public key was effectively never asserted here.
- No distinction between "core for public site" vs "feature".

**Fixed version (now in repo):**
- `CORE_REQUIRED_IN_PRODUCTION`: only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (compat), `NEXT_PUBLIC_SITE_URL`.
- Proper dual-key check using `hasSupabasePublicKey = ANON || PUBLISHABLE`.
- All former "required" (service, Stripe secrets/webhook, CRON, ADMIN, Mux, Resend, Blob, prices, AI, Upstash, Sentry) moved to `FEATURE_RECOMMENDED`.
- Prod: core missing = hard throw. Feature missing = console.warn only (no throw). Dev: warns for both.
- Updated comments explain graceful degradation philosophy.

**Snippet (fixed assertEnv logic):**
```ts
const hasSupabasePublicKey = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
const effectiveMissingCore = missingCore.filter((k) => k === "NEXT_PUBLIC_SUPABASE_ANON_KEY" ? !hasSupabasePublicKey : true);
if (effectiveMissingCore.length > 0) { ... throw in prod ... }
```

---

## 2. .env.example — Documentation vs Reality Mismatch

**File:** `.env.example`

**Original documented "full list enforced":**
```
# REQUIRED_IN_PRODUCTION ... : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CRON_SECRET, NEXT_PUBLIC_SITE_URL
# RECOMMENDED: STRIPE_PRICE_*, MUX_*, BLOB..., RESEND..., ADMIN..., SENTRY..., UPSTASH...
```

**Issues:**
- Listed ANON_KEY in required comment but promoted PUBLISHABLE + "Legacy name for compatibility".
- Included non-core in the "enforced" required list.
- No clear "basic runtime ok without X".

**Fixed:** Complete rewrite of the enforced list section + per-section notes explaining optionality + degradation. Dual key documented prominently. Added all observed runtime vars (GROQ, 247_ variants, self-host scaffold, etc.).

---

## 3. All process.env References (Exhaustive — Key Files + Snippets)

Global grep produced 105+ lines. Grouped by category + every critical path.

### 3.1 Supabase (Core Public + Admin)

- `lib/supabase.ts` (was catastrophically broken — only 8 lines, undefined symbols):
  ```ts
  export function supabaseAdmin(): SupabaseClient {
    if (admin) return admin;  // ReferenceError / TS fail
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    ...
  }
  ```
  **No** `supabasePublic`, `supabaseConfigured`, or `export const supabase`. Yet imported everywhere:
  - lib/articles.ts, podcasts.ts, series.ts, contributors.ts, live-events.ts, live-polls.ts, report-card.ts, search.ts, semantic-search.ts, auth-server.ts, entitlements.ts, viewer.ts (dynamic), etc.
  - app/podcasts/*, stories/*, shows/* pages, admin pages, _components (LiveChat, LivePoll, ThreadedComments, Backroom, etc.).
  - This alone would prevent any content rendering + crash build/runtime.

- `utils/supabase/server.ts:5` (top-level + prod throw):
  ```ts
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!...) { if (prod) throw new Error("... missing for Supabase SSR server client."); ... }
  ```

- `utils/supabase/client.ts:3` + `middleware.ts:4`: identical dual-key + prod throw (middleware has graceful NextResponse fallback in dev/prod for missing).

- `lib/auth-client.ts:16` (browser, "use client"):
  ```ts
  function getPublicKey() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; }
  ...
  if (!url || !key) {
    if (process.env.NODE_ENV === "production") throw new Error("Supabase public env vars missing in production build.");
    ... placeholder ...
  }
  ```

- `lib/env.ts` (see §1): partial special case (now fixed).

**Dual-key support is consistent** across auth-client + all three utils/supabase/* (ANON || PUBLISHABLE). Mismatch was only in env.ts assertion + docs.

**Fix applied:** Full correct `lib/supabase.ts` with:
- Proper imports + singletons (admin + pub).
- `supabasePublic()` using same `ANON || PUBLISHABLE` logic + dev placeholder + prod throw.
- `supabaseConfigured(): boolean`.
- `export const supabase = supabasePublic();` (for docs/legacy).
- supabaseAdmin unchanged (still throws — correct for privileged use).

### 3.2 Stripe (Payments)

- `lib/stripe.ts:8` (hard throw inside lazy fn):
  ```ts
  export function stripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY missing. See .env.example.");
    ...
  }
  ```
  Top-level:
  ```ts
  export const PRICING = {
    BASIC_MONTHLY: process.env.STRIPE_PRICE_MEMBER || process.env.STRIPE_PRICE_SETTLER || null,
    ...
  };
  ```
  `tierForPriceId` reads `process.env[key]` for known price envs.

- `lib/tiers.ts:50`: `return process.env[plan.stripePriceEnv] ?? null;` (inside priceIdForPlan).

- Webhook: `app/api/webhooks/stripe/route.ts:16`: `const secret = process.env.STRIPE_WEBHOOK_SECRET; if (!sig || !secret) return 400;`
- Checkout/portal: `app/api/stripe/checkout/route.ts:9`, billing-portal: `const SITE_URL = ...` (fallbacks); call `stripe()` after price guard (503 if no price).
- `app/api/webhooks/stripe/route.ts` also calls `stripe()` + `supabaseAdmin()`.

**Graceful today:** priceIdForPlan returns null → 503 in checkout. Webhook early-returns. But original env assert required the secret/key for *boot*.

**Status post-fix:** No longer boot-killers.

### 3.3 CRON_SECRET + ADMIN_SERVICE_TOKEN (Jobs / Protected Routes)

- `lib/admin-auth.ts:65` + `74`:
  ```ts
  export function requireServiceToken(req: Request): boolean {
    const expected = process.env.ADMIN_SERVICE_TOKEN; if (!expected) return false;
    ...
  }
  export function requireCronSecret(req: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return process.env.NODE_ENV !== "production";  // graceful in dev
    ...
  }
  ```

- Cron routes (all use it):
  - `app/api/cron/ingest-rss/route.ts:17`, `poll-feeds/route.ts:12`, `weekly-digest/route.ts:13`: `if (!requireCronSecret(req)) return 403;`
  - Comments note "Vercel sends Authorization: Bearer $CRON_SECRET when CRON_SECRET is set." + vercel.json crons.

- Jobs/transcribe + clips/moderate: use `requireAdmin` (Supabase role) **or** `requireServiceToken` (ADMIN_SERVICE_TOKEN). If neither → 403. No hard throw on missing token itself.

- `app/api/cron/weekly-digest/route.ts:28`: also `NEXT_PUBLIC_SITE_URL || fallback`.

**Original problem:** CRON_SECRET was in REQUIRED → hard boot fail in prod even for a basic non-cron deploy. vercel.json always registers the schedules.

**Post-fix:** Removed from core required. require* already provide dev-grace + prod-deny semantics.

### 3.4 Mux (Video / Live / Webhooks)

- `lib/mux.ts:14` (hard inside lazy):
  ```ts
  export function mux(): Mux {
    const tokenId = process.env.MUX_TOKEN_ID; const tokenSecret = process.env.MUX_TOKEN_SECRET;
    if (!tokenId || !tokenSecret) throw new Error("Mux credentials missing...");
  }
  export async function signPlaybackToken(...) {
    ... if (!keyId || !keySecret) throw new Error("Mux signing key missing. Required for members-only playback.");
  }
  ```
  (Other fns: createLiveStream, getLiveStream, enableGeneratedSubtitles, addSimulcastTargets — all go through mux().)

- `app/api/webhooks/mux/route.ts:30`:
  ```ts
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (sig && secret) { try { mux().webhooks.verifySignature... } catch { 400 } }
  // proceeds even without secret (unsigned path)
  ```
- Admin live: `app/api/admin/live/start/route.ts` calls createLiveStream (will throw without creds).
- `scripts/verify-mux.mjs`, `create-mux-247-stream.mjs`: direct reads + exit(1) if missing (scripts only — correct).

- Public 24/7: `lib/live-247.ts` (pure public envs, no secrets; graceful null stream):
  ```ts
  if (process.env.NEXT_PUBLIC_247_HLS_URL) ...
  if (process.env.NEXT_PUBLIC_MUX_247_PLAYBACK_ID) ...
  if (...) MP4, YOUTUBE ...
  return null;  // "Off Air"
  ```

**Graceful today (webhook):** skips verify if no secret. **Hard (mux fn):** only when video features invoked.

### 3.5 Other Feature Keys (All Graceful or Script-Only)

- **BLOB_READ_WRITE_TOKEN** (`@vercel/blob` clips):
  - `app/api/clips/upload/route.ts:67`: `if (!process.env.BLOB_READ_WRITE_TOKEN) return jsonError(..., 503);`
  - Then `token: process.env.BLOB_READ_WRITE_TOKEN` in put().
  - Tests exist. Pure graceful 503.

- **RESEND_API_KEY / RESEND_FROM** (email.ts):
  - `lib/email.ts:19`: `const key = process.env.RESEND_API_KEY; if (!key) { log.warn(... no-ops ...); return null; }`
  - `const FROM = process.env.RESEND_FROM || "The Colony OK <no-reply@thecolonyok.com>";`
  - Every sendEmail* is best-effort, never throws to caller. All templates receive siteUrl from `process.env.NEXT_PUBLIC_SITE_URL` (no guard, can be undefined).

- **OPENAI_API_KEY / GROQ_API_KEY**:
  - `lib/semantic-search.ts:81`: `isSemanticQueryAvailable(): return Boolean(process.env.OPENAI_API_KEY?.trim());`
  - `embedQuery`: if (!key) return null; (search falls back to text ilike).
  - `app/api/jobs/transcribe/route.ts`: `resolveProvider()` returns null if neither → 503 "No transcription provider..."; also uses for LLM chapters/summary (best effort inside try).
  - `app/api/jobs/transcribe/route.ts:160`: `const chatKey = process.env.GROQ... || OPENAI...`

- **UPSTASH_* (rate-limit.ts)**:
  - `upstashLimit`: if (!url || !token) return null; → falls back to in-memory Map (per-instance).
  - Explicit comment: "fallback to per-instance Map — fine for dev and low-traffic".

- **SENTRY_* (multiple)**:
  - `sentry.server.config.ts:5`, `sentry.edge.config.ts:5`: `dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN`
  - `sentry.client.config.ts:6`: only NEXT_PUBLIC_
  - `app/api/csp-report/route.ts:18`: `if (prod && (SENTRY_DSN || NEXT_PUBLIC...)) Sentry.capture...` else dev log.
  - next.config.ts comment: "These are completely optional (no-op without SENTRY_DSN...)". Sentry init is guarded; no withSentryConfig wrapper.

- **Public non-secret fallbacks (SITE_URL, YT, 247, VIDEO_PROVIDER etc.)**:
  - Dozens of `const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";` (pages: app/page.tsx, stories/[slug], podcasts/*, shows/*, contributors/[slug], blog/[slug]; api/newsletter, cron/weekly, stripe/*; sitemap.ts, robots.ts).
  - `lib/video.ts:8,11,37`: YT_CHANNEL_ID / PLACEHOLDER ?? defaults; selfHostPlaybackUrl reads VIDEO_PROVIDER / BUNNY_STREAM_HOST / CLOUDFLARE_STREAM_CODE (returns null if missing — scaffold).
  - `lib/live-247.ts`: full priority chain + null.
  - `app/robots.ts:4`, `app/sitemap.ts:7`: `NEXT_PUBLIC_SITE_URL ?? NEXT_PUBLIC_APP_URL ?? fallback` (sitemap catches fetch errors for dynamic parts).

- **Scripts (non-runtime, exit on missing — expected):**
  - `scripts/apply-migrations.mjs`, `run-seed.mjs`: require DIRECT_URL (pg client), load .env.local shim.
  - `scripts/seed-thecolony.ts`: DIRECT_URL or (SUPABASE_URL + SERVICE_KEY); multiple paths + fallbacks; throws only inside chosen path.
  - `scripts/verify-mux.mjs`, `create-mux-247-stream.mjs`: MUX_TOKEN_* or exit(1).
  - All have .env.local parsers (duplicated code — minor).

- **Misc / dev-only:**
  - `lib/log.ts:6`: `if (NODE_ENV !== "production") console...`
  - Many components: `if (NODE_ENV !== 'production') console.warn(...)` (PWA, EpisodePlayer visualizer, csp-report).
  - `app/api/csp-report/route.ts`, SiteClient.tsx, etc.
  - `instrumentation.ts:12`: `NEXT_RUNTIME` (Next internal).
  - No Clerk runtime usage (example only).
  - No ANTHROPIC runtime usage (example + plan docs only).
  - `NEXT_PUBLIC_APP_NAME` declared in example but never read in active code (layout hardcodes title).

**One stray in docs (non-source):** plans/...md has `createClient(process.env.SUPABASE_URL!, ...` (missing NEXT_PUBLIC_ prefix).

---

## 4. Hard Throws vs Graceful Degradation Matrix

| Key / Group                  | Location of Read/Throw                          | Prod Behavior (original)          | Graceful? | Post-Fix |
|------------------------------|------------------------------------------------|-----------------------------------|-----------|----------|
| NEXT_PUBLIC_SUPABASE_URL + public key (ANON/PUBLISHABLE) | utils/*, auth-client, supabase.ts (now), env.ts | Throw (or later) | Partial (middleware had some) | Core required (correct); public client now has dev placeholder + configured() guard used by LiveChat etc. |
| SUPABASE_SERVICE_ROLE_KEY    | lib/supabase.ts (admin), env.ts (old)         | Hard throw on any admin call or boot | No | Removed from boot required; calls still throw (correct for writes) |
| STRIPE_SECRET_KEY + WEBHOOK_SECRET | lib/stripe.ts, webhooks/stripe/route | Boot throw + fn throw; 400 on webhook | Partial (webhook early return) | Removed from boot; fn/webhook unchanged |
| CRON_SECRET                  | lib/admin-auth (requireCronSecret), env.ts (old), cron routes | Boot throw; 403 if missing in prod | Yes in require (dev allow) | Removed from boot required |
| ADMIN_SERVICE_TOKEN          | lib/admin-auth (requireServiceToken), jobs/transcribe, clips/moderate | return false (grace) | Yes | Was never hard; stays |
| MUX_* (token + signing)      | lib/mux.ts (fns), webhooks/mux (optional verify) | Throw when video feature used | Webhook partial | Unchanged (feature-gated) |
| BLOB_READ_WRITE_TOKEN        | api/clips/upload/route | 503 | Excellent | Unchanged |
| RESEND_API_KEY               | lib/email.ts (getResend) | no-op + warn | Excellent | Unchanged |
| OPENAI/GROQ                    | semantic-search, jobs/transcribe | null / 503 | Excellent | Unchanged |
| UPSTASH_*                    | lib/rate-limit.ts | memory fallback | Excellent | Unchanged |
| SENTRY_*                     | sentry.*.config, csp-report | no-op / log | Excellent | Unchanged |
| SITE_URL + public 247/YT/etc | pages, sitemap, robots, live-247, video | ?? fallback everywhere | Excellent | Unchanged |

**Non-essential that were causing prod boot failures (original):** CRON_SECRET, STRIPE_*, SUPABASE_SERVICE_ROLE (for pure public content deploys).

---

## 5. Mismatches Identified

1. **ANON_KEY vs PUBLISHABLE_KEY**:
   - Runtime code (everywhere): `ANON || PUBLISHABLE` (consistent, prefer either).
   - .env.example (original): Sets PUBLISHABLE + "Legacy name for compatibility: NEXT_PUBLIC_SUPABASE_ANON_KEY=... (same value)".
   - env.ts (original): Comment said "ANON_KEY (primary)", listed neither properly, filter referenced only ANON.
   - Some docs/plans: only mention ANON or use bare SUPABASE_URL.

   **Fix:** Standardized docs + assertion. Primary modern name is PUBLISHABLE in comments.

2. **Bare SUPABASE_URL in plans/docs** (non-code).

3. **STRIPE_PUBLISHABLE_KEY**: In .env.example + legacy, but **no active process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY reads** in app/ or lib/ (all Stripe is server-secret + price envs). Checkout is server-driven.

4. **lib/supabase.ts vs its own docs + imports**: Docs/SITE_AUDIT claimed full singleton public + `export const supabase = ...` + guards. Actual file was a 8-line fragment with undefined vars. (Critical latent bug.)

5. **assertEnv REQUIRED list vs .env.example comment vs actual usage**: Diverged.

---

## 6. Top-Level / Module-Init Reads (Risk of Early Eval)

- Top-level `const X = process.env.Y ?? fallback;` in many page.tsx, api/*, sitemap/robots, utils/supabase/* (safe in Next; evaluated per request or at build for some).
- `PRICING = { ... process.env... }` in lib/stripe.ts (evaluated on first stripe.ts import — no throw).
- `const FROM = process.env.RESEND_FROM || ...` in email.ts (top, but only used inside sends).
- `export const supabase = supabasePublic();` (now in fixed supabase.ts — will trigger the public guard logic on first import of anything pulling supabase).
- Scripts: heavy top-level after loadEnvLocal shim (expected).

No dangerous sync secrets at import in client bundles (all public or guarded).

---

## 7. vercel.json + next.config.ts + Other Config

- `vercel.json`: Only crons (`/api/cron/ingest-rss`, `/poll-feeds`). No envs. Cron protection lives entirely in requireCronSecret + routes.
- `next.config.ts`: No env reads. CSP report-only, images remotePatterns (supabase/mux/yt), TS ignoreBuildErrors (pre-existing).
- `middleware.ts`: Delegates to utils/supabase/middleware (has missing-env guard → continues without Supabase).
- `instrumentation.ts`: assertEnv first, then conditional sentry (by NEXT_RUNTIME).

---

## 8. Fixes Applied (for Consistency + Graceful Degradation)

1. **lib/supabase.ts** — Complete rewrite (proper imports, dual public key support matching all other sites, supabasePublic + supabaseConfigured + supabase singleton, dev placeholder, prod throw only for public core, admin preserved).
2. **lib/env.ts** — Slimmed to true CORE_REQUIRED (URL + public key + SITE_URL). All others FEATURE_RECOMMENDED (warn only, never boot-block). Fixed dual-key logic. Extensive comments.
3. **.env.example** — Updated to match new lists + per-section "optional / degrades" notes + dual-key guidance + full observed vars.

**Recommended follow-ups (not auto-applied):**
- Add `isStripeConfigured()`, `isMuxConfigured()`, `isCronProtected()` etc. helpers for UI (e.g. hide pricing if no prices).
- Centralize public Supabase key getter (optional; dual support already uniform).
- Remove duplicated .env.local parsing in scripts (use a shared util or dotenv).
- Ensure no new top-level unconditional `supabaseAdmin()` or `stripe()` at module scope in future code.
- Update any remaining plan docs that hardcode bare `SUPABASE_URL`.
- Consider making supabaseAdmin also return a stub in dev (like public now does) — but privileged paths should probably stay loud.

---

## 9. Files Read / Attacked (Partial List for Audit Trail)

- lib/env.ts, .env.example, instrumentation.ts, vercel.json, next.config.ts, middleware.ts
- All lib/*.ts (supabase (pre/post), stripe, mux, admin-auth, auth-client, auth-server, email, rate-limit, live-247, semantic-search, video, tiers, search, articles, podcasts, series, contributors, live-events, live-polls, report-card, entitlements, log, safe-compare, jobs, transcripts, viewer, ...)
- All app/api/**/route.ts (cron/* (3), webhooks/stripe+mux, clips/* (upload, moderate, moment, upvote), admin/* (status, articles, clips, contributors/approve+applications, live+start, members, report-card), jobs/transcribe, newsletter/subscribe, stripe/checkout+portal, tips, watchlist, comments, contributors/apply, progress, csp-report)
- utils/supabase/{server,client,middleware}.ts
- scripts/* (all 10: apply-migrations, run-seed, seed-thecolony, verify-mux, create-mux-247, ...)
- sentry.*.config.ts, app/layout.tsx + multiple page.tsx + sitemap/robots (for SITE_URL patterns)
- package.json (no envs), tsconfig, etc.

**No other secret reads found** (no process.env in public/, styles, most _components except dev NODE_ENV guards; no hardcoded keys).

---

## Conclusion

Original state: Overly strict boot validation + broken central Supabase module + naming drift would have caused prod deploys to fail unless *every* optional secret (CRON, full Stripe, Mux, service role, etc.) was present — even for a read-only news/podcast site. Many graceful patterns already existed deeper in the code (503s, no-ops, dev-allow, fallbacks).

**Post-audit:** Core is now minimal + documented. Public Supabase client is actually implemented and matches all call sites. Feature keys degrade as intended. Dual ANON/PUBLISHABLE is explicit and consistent.

All references attacked. Report + source fixes prepared/applied.

(End of audit.)
