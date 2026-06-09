# 🐝 The Colony

> **Truth. Faith. Freedom.** — the elite, AI-native successor to BlazeTV, grown from the
> [thecolonyok.com](https://thecolonyok.com) foundation and expanded for the nation.

An uncensored, ad-free, **privacy-first** streaming platform for premium conservative & Christian
media: live broadcasts, on-demand shows & documentaries, and the Oklahoma-rooted podcast network
that started it all — with a buttery video experience and AI superpowers grounded in a biblical
worldview.

---

## 1 · Stack

| Layer        | Tech                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Framework    | **Next.js 15** (App Router, RSC, Turbopack) · **React 19** · TS strict |
| Styling      | **Tailwind v4** + **shadcn/ui** (new-york) · "Premium Hive" design system |
| Auth         | **Clerk** (secure, privacy-focused)                                  |
| Database     | **Supabase Postgres** + **Drizzle ORM** + **pgvector**               |
| Payments     | **Stripe** (subscriptions, billing portal, gifting)                  |
| Video        | **Mux** (HLS VOD, live, signed playback, thumbnails)                  |
| AI           | **Vercel AI SDK** + Claude (summaries/clips) + OpenAI (embeddings)   |
| PWA          | Web manifest, offline-ready, installable, WCAG AA+                   |

## 1 · Folder structure

```
src/
├─ app/
│  ├─ layout.tsx              # Fonts (Fraunces+Geist), Clerk, theme, header/footer
│  ├─ globals.css             # "Premium Hive" design system (honey-gold, honeycomb)
│  ├─ page.tsx                # Home feed (hero + content rows + value band)
│  ├─ shows/                  # Catalog · [slug] detail · [slug]/[episode] watch page
│  ├─ podcasts/ live/ news/   # Network, live broadcasts, daily news feed
│  ├─ pricing/                # Membership tiers + FAQ (Stripe checkout)
│  ├─ search/                 # Semantic (meaning-aware) search
│  ├─ profile/ account/ welcome/   # Member hub, billing, post-checkout
│  ├─ sign-in/ sign-up/       # Clerk catch-all routes
│  ├─ actions.ts              # Server actions: checkout, billing portal, watchlist
│  ├─ manifest.ts robots.ts sitemap.ts
│  └─ api/
│     ├─ progress/            # Player heartbeat → watch progress
│     ├─ ai/clips/            # Patriot+ AI clip generator
│     └─ webhooks/{clerk,stripe,mux}/   # Identity, entitlement, asset sync
├─ components/
│  ├─ ui/                     # shadcn primitives
│  ├─ layout/                 # header, footer, mobile nav
│  ├─ brand/                  # hive mark + foil wordmark
│  ├─ content/                # hero, series card, content row, member wall
│  ├─ player/                 # ColonyPlayer, transcript panel, watch experience
│  └─ pricing/                # checkout button
├─ db/
│  ├─ schema.ts               # Full Drizzle schema (users…embeddings)
│  ├─ queries.ts              # Typed data access + entitlement helpers
│  ├─ index.ts                # Pooled connection
│  ├─ seed.ts                 # Colony OK + national catalog seed
│  └─ extensions.sql          # pgcrypto + pgvector (run once)
├─ lib/                       # utils, tiers, auth, mux, stripe, ai
└─ middleware.ts              # Clerk (protects /profile, /account, /welcome)
```

> The original static site (`index.html`, `css/`, `js/`, `pages/`) is kept as **design
> reference** only — the platform is the Next.js app under `src/`.

---

## 2 · Local setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local        # fill in Clerk, Supabase, Stripe, Mux, AI keys

# 3. Database — enable extensions ONCE (Supabase SQL editor or psql)
#    paste the contents of src/db/extensions.sql, then:
DATABASE_URL="postgresql://…" npm run db:push     # create tables from schema
npm run db:seed                                    # load demo catalog

# 4. Run
npm run dev                       # http://localhost:3000 (Turbopack)
```

Useful scripts: `db:generate` (SQL migrations), `db:migrate`, `db:studio` (Drizzle Studio),
`typecheck`, `lint`.

### Webhooks (local)

```bash
# Stripe — forwards events to the entitlement sync
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Clerk & Mux: use a tunnel (e.g. `ngrok http 3000`) and register the URL in each dashboard.
```

---

## 3 · Membership tiers (Stripe)

| Tier        | Price     | Notes                                          |
| ----------- | --------- | ---------------------------------------------- |
| Neighbor    | Free      | Previews, daily news, free podcasts            |
| **Settler** | $4.99/mo  | Founding price — full ad-free library          |
| **Patriot** | $9.99/mo  | + Live HD, exclusives, AI clips & smart search |
| **Founder** | $19.99/mo | + Early access, gifting, priority Q&A          |

Create three recurring Prices in Stripe and set `STRIPE_PRICE_SETTLER|PATRIOT|FOUNDER`.
Entitlement is denormalized onto `users.tier` by the Stripe webhook for single-lookup reads.

---

## 4 · Deployment (Vercel + Supabase + Mux)

1. **Supabase** — create a project. Run `src/db/extensions.sql`, then `npm run db:push`.
   Use the **transaction pooler** URL (port 6543) for `DATABASE_URL`.
2. **Vercel** — import the repo. Add every var from `.env.example` (Production + Preview).
   Set `NEXT_PUBLIC_APP_URL` to your domain.
3. **Clerk** — add a webhook → `https://<domain>/api/webhooks/clerk`
   (events: `user.created`, `user.updated`, `user.deleted`). Copy the signing secret.
4. **Stripe** — add a webhook → `https://<domain>/api/webhooks/stripe`
   (events: `customer.subscription.*`). Copy the signing secret. Create the three Prices.
5. **Mux** — create an access token + a signing key (for members-only playback). Add a webhook
   → `https://<domain>/api/webhooks/mux` (`video.asset.ready`). Set `passthrough` = episode id
   on upload so the webhook backfills `muxPlaybackId`.
6. **Deploy.** `git push` → Vercel builds on the Edge. Add custom domain `thecolonyok.com`.

### Security & performance posture

- Security headers (HSTS, nosniff, frame, permissions-policy) set in `next.config.ts`.
- **Privacy-first:** no behavioral ad tracking, no data selling; Clerk handles auth securely.
- Members-only video uses **short-lived signed Mux JWTs** — paid URLs can't be shared.
- Edge-cached pages (`revalidate`), AVIF/WebP images, `prefers-reduced-motion` honored,
  visible focus states, skip-link, semantic landmarks → targets Lighthouse 95+ / WCAG AA+.

---

## 5 · TODО before production

- Add real `public/` assets: `icon-192.png`, `icon-512.png`, `icon-maskable.png`, `og.png`.
- Wire the Mux **live player** on `/live` and a transcript-generation job (Mux → Whisper/Deepgram
  → `transcripts` + `summarizeTranscript` + `embedText`).
- Add the RSS auto-ingest cron for Colony OK podcasts (`series.rssUrl` → `episodes`).

Built on the Colony OK foundation. **Truth. Faith. Freedom.**
