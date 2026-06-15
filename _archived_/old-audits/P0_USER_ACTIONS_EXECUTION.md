# P0 — MUST-HAVE Execution (User Actions + Verification)

**Branch:** feat/elite-platform-build  
**Date:** 2026-06-15 (post-audit)  
**Goal:** Close 88% → ~98% must-have for safe/legal/paid prod launch. Code-complete; blocked on env + seed + smoke.

## 1. Provision Prod Env in Vercel (P0-1)
Set these in Vercel Project > Settings > Environment Variables (Production + Preview + Development as appropriate). Redeploy after.

Required (from audit + code):
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (unblocks distributed rate limiting; without = fail-closed 429s on checkout/tips/comments/etc in prod)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` (multiple tiers if any; see lib/stripe.ts)
- `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, `MUX_SIGNING_KEY`? (for sig + asset mgmt)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob for UGC clips)
- `RESEND_API_KEY` (emails: receipts, welcome, newsletter, tips)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable), `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (for /api/cron/* protection)
- `ADMIN_SERVICE_TOKEN` (for jobs/transcribe machine calls + admin APIs)
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (optional for now; errors + later source maps)
- `OPENAI_API_KEY` or `GROQ_API_KEY` (transcription + semantic recs/embeddings; Groq preferred for speed/cost)
- `NEXT_PUBLIC_SITE_URL` = "https://thecolonyok.com"

Optional but recommended: DIRECT_URL (for scripts/apply + seed with pg).

After set: `vercel --prod` or dashboard redeploy.

## 2. Apply Migrations + Seed (P0-4)
**CRITICAL ORDER:** Migrations BEFORE seed.

### Apply migrations (0030 included; run after any prior)
Preferred (if DIRECT_URL in Vercel env or .env.local for local script):
```
node scripts/apply-migrations.mjs
```
- Dynamic, scans supabase/migrations/*.sql lexical, records to schema_migrations.
- Safe re-runs (many use IF NOT EXISTS, idempotent policies).

Alt: Supabase Dashboard > SQL Editor > paste files in order (or `supabase db push` if linked locally).

Verify key tables exist + RLS (see SEED_APPLY_CHECKLIST.md for full queries).

### Apply seed (populates 5 shows, 11 eps, 8 veps, 11 articles, 5 contribs, 3 live, etc.)
After migrations:
- **Prod recommended:** Supabase SQL Editor (service role context)
  - Open `supabase/seed-content.sql` (full file)
  - Paste + Run (BEGIN/COMMIT wrapped, idempotent INSERT ... WHERE NOT EXISTS)
- Alt script (DIRECT_URL needed):
  ```
  node scripts/run-seed.mjs
  ```
  or `npx tsx scripts/seed-thecolony.ts`

Post-apply verification queries (run in SQL editor):
```sql
SELECT 'shows', count(*) FROM public.shows;
SELECT 'episodes', count(*) FROM public.episodes;
SELECT 'articles', count(*) FROM public.articles WHERE status='published';
-- + live_events, contributors, video_episodes, series (expect ~5/11/11/5/8/3/5)
```
Visit pages post-deploy: / (hero+rails populated), /podcasts/colony-report/real-video-ep (chapters+video player), /stories, /watch, /live, /contributors, /clips (graceful for clips).

See full SEED_APPLY_CHECKLIST.md for exact expected counts, gaps notes (cosmetic 0002/25/27 missing files ok), and rural content suggestions.

## 3. Smoke / Load Tests (P0-5)
- **Hot paths:** homepage (/), /api/stripe/checkout (mock in test), clips upload (/clips + /api/clips/upload), /live, member checkout flows, transcribe job (with keys), comments post.
- **Rate limit verify (needs Upstash live in prod):** From one IP hit /api/tips or /api/comments 6x → 6th must 429 + Retry-After. (In dev memory fallback allows.)
- **Mux sig (prod):** POST unsigned to /api/webhooks/mux → 400/401.
- **RLS:** Anon key query for draft article → 0 rows (enforced in 0009).
- **Transcribe persist:** Trigger job (admin or service token) on episode → confirm episodes.summary populated + transcripts row.
- **Load:** Adapt + run `node load-test-500.js` (currently hardcoded prod /live; edit TARGET= http://localhost:3000/live or prod URL for 500-concurrent sim). Expect >95% 200s on YT-offload path. Re-run against / , checkout etc after env.
- Local dev smoke: `npm run dev` then manual browse key routes + forms. With placeholder Supabase = degraded (lists empty or errors graceful).

Run `npm test` (always 13 pass baseline) + `npm run build` (should succeed; will clean after p2-15).

## 4. Post-P0 Scorecard Target
- MUST-HAVE: 88% → ~98% (only minor config left)
- COMPLETE: 85% → 90%+
- ELITE: 70% → 75%+ (more after P1/P2 swarms)

## 5. Commit / Deploy Notes
- Session fixes for P0-2/P1-7 already committed (f5687d5): mux sig, transcribe summary persist + 0030.
- After env + seed + smokes green: deploy to prod, re-verify webhooks/rate/RLS in real prod (unsigned mux, rate 6x, anon draft query).
- Update this file or PHASE5_LAUNCH_READINESS.md with results.
- Next: P1 features (swarm in progress), then P2.

**User action checklist:**
- [ ] Set all Vercel envs + redeploy
- [ ] Apply migrations + seed (SQL editor or scripts)
- [ ] Run/adapt smokes + load (post-deploy preferred)
- [ ] Verify 4 checks (rate, mux, RLS, transcribe)
- [ ] Report back results; swarms continue on code P1/P2

(End P0 user exec doc. See original audit in prompt history + SEED_APPLY_CHECKLIST.md for details.)
