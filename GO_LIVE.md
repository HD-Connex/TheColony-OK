# The Colony OK — Go-Live Checklist (path to 100%)

Canonical = this repo, branch `main` (elite platform). Live targets:
- GitHub: `HD-Connex/TheColony-OK` (`main`)
- Vercel: `hd-connex/thecolony-app` → alias https://thecolony-app.vercel.app
- Supabase: project `jwqgirmxoksxhevjnnwm`

> Note: Vercel is **not** auto-deploying from GitHub pushes here — deploys are manual
> via `npx vercel --prod --yes` from the repo root (builds the local tree on Vercel
> using the project's env vars).

## 1. Database (Supabase) — owner handling
Paste in the SQL editor for `jwqgirmxoksxhevjnnwm`, in order:
1. `_APPLY_DB.sql` — 28 migrations (0001–0031) + `seed-content.sql`, idempotent.
2. `_APPLY_DB_VERIFY.sql` — expect series 5 / episodes 11 / video_episodes 8 /
   articles 11 / contributors 5 / live_events 3; `vector`+`pgcrypto` present.

## 2. Vercel env (Production scope) — set the MISSING keys
Already set: Supabase (URL/anon/publishable/service-role), DATABASE_URL/DIRECT_URL,
SITE_URL, Mux token+webhook+signing-key-id, AI (Anthropic/OpenAI/Groq), Resend
api+from, Upstash, Sentry, CRON_SECRET, ADMIN_SERVICE_TOKEN, Blob.

Still missing (features dark until set):
- **Stripe (all):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*` (or `STRIPE_PRICE_MEMBER`)
  → without these, checkout/billing/membership is disabled.
- `RESEND_WEBHOOK_SECRET` — required by `/api/webhooks/resend` (else 500 in prod when called).
- `SUPABASE_WEBHOOK_SECRET` — required by `/api/webhooks/supabase`.
- `MUX_SIGNING_PRIVATE_KEY` — only KEY_ID is set; needed for signed (member) playback.
- `BLOB_READ_WRITE_TOKEN` (UPPERCASE) — only a lowercase `blob_` variant is present; clip uploads.

Set via `vercel env add <NAME> production` or the dashboard.

## 3. Register webhook endpoints (point at the prod domain)
- Stripe → `/api/webhooks/stripe`  (secret `STRIPE_WEBHOOK_SECRET`)
- Mux → `/api/webhooks/mux` (asset + live) and `/api/webhooks/mux-live` (encoder lifecycle) (secret `MUX_WEBHOOK_SECRET`)
- Resend → `/api/webhooks/resend` (Svix; secret `RESEND_WEBHOOK_SECRET`)
- Supabase → Database/Auth webhook → `/api/webhooks/supabase` (HMAC; secret `SUPABASE_WEBHOOK_SECRET`)
Crons (`vercel.json`): `/api/cron/ingest-rss`, `/api/cron/poll-feeds` — need `CRON_SECRET`.

## 4. Deploy
From repo root: `npx vercel --prod --yes`. This ships the current tree (incl. the
`images.pexels.com` fix that resolves the `/stories/*` RSC 500s, the 3 webhooks, and
the public `/api/articles`).

## 5. Post-deploy smoke
- `/api/health` → 200
- `/stories/oklahoma-budget-crisis` and `/stories/lobbyist-network-silence` → **200** (were 500)
- `/`, `/live`, `/watch`, `/topics`, `/pricing`, `/contributors` → 200
- Stripe test subscription → `members.is_member` flips
- Resend bounce → `newsletter_subscribers.unsubscribed_at` set

## Status (code)
Local `npm ci` + `tsc` + 14/14 vitest + `next build` all green. Bug fixes landed on `main`.
