# The Colony OK

Production web + mobile app for **The Colony OK** — Oklahoma's reader-funded conservative press (stories, podcasts, 24/7 live, membership). Deployed at [thecolonyok.com](https://thecolonyok.com).

- **Web:** Next.js 15 (App Router, React 19), deployed on Vercel.
- **Mobile:** Expo / React Native (SDK 56) in [`mobile/`](./mobile).
- **Backend:** Supabase (Postgres + Auth + Realtime), Stripe (membership), Mux (video/live), Resend (email), Sentry (errors).

## Repository layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js App Router routes, API routes, and components |
| `lib/` | Shared server/client utilities (auth, supabase, env, logging) |
| `mobile/` | Expo / React Native app |
| `supabase/` | Database migrations and edge functions |
| `tests/` | Playwright E2E tests |

## Getting started (web)

```bash
pnpm install
cp .env.example .env.local   # then fill in your own values
pnpm dev                     # http://localhost:3000
```

### Useful scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests |

## Getting started (mobile)

See [`mobile/README.md`](./mobile/README.md). In short:

```bash
cd mobile
pnpm install
cp .env.example .env.local   # fill in EXPO_PUBLIC_* values
pnpm start
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in your own values. Never commit
real secrets. For production/preview, configure variables in **Vercel → Project
→ Environment Variables**. Boot-time validation lives in `lib/env.ts`.

## Deployment

The web app deploys to Vercel from `main`. CI (`.github/workflows/ci.yml`) runs
type-check, tests, build, and E2E on every push and pull request.

## License

MIT — see [LICENSE](./LICENSE).
