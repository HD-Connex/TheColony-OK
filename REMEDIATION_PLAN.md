# The Colony OK — Remediation Plan (Solutions for All 102 Findings)

**Generated:** 2026-06-30 · Companion to `AUDIT_REPORT.md` / `findings.json`
**Approach:** Safe fixes applied now; everything else has a concrete, verified solution below.

> ⚠️ **Read this first — the audit has a real false-positive rate.** Several
> "blocker"/"critical" findings are outdated, architecturally wrong, or already
> handled in code. Those are corrected in §B so nobody wastes effort "fixing"
> working code. Verify against the live tree before acting on any line number —
> the audit's line numbers drifted between `findings.json` and `AUDIT_REPORT.md`.

---

## A. Applied this session (safe set — already committed to working tree)

| # | Finding | File(s) | Change |
|---|---------|---------|--------|
| 1 | LICENSE attributed to Expo | `LICENSE` | Replaced with `Copyright (c) 2026 The Colony OK` |
| 2 | Unprofessional README ("Drive Malfunction" notes, phase artifacts) | `README.md` | Rewrote as standard project README |
| 3 | Real Supabase project ref + publishable key in example | `.env.example` | Replaced project ref → `YOUR_PROJECT_REF`, key → placeholder |
| 4 | Dead Clerk docs in env example | `.env.example` | Removed Clerk block (app uses Supabase auth) |
| 5 | Missing mobile env example | `mobile/.env.example` | Created (Supabase URL/anon/publishable + site URL) |
| 6 | Sentry `tracesSampleRate: 1` (100% in prod) ×3 | `sentry.{server,edge,client}.config.ts` | `NODE_ENV === "production" ? 0.2 : 1` |
| 7 | EAS profiles force Supabase env to empty string | `mobile/eas.json` | Removed the empty `env` blocks (dev/preview/production) so EAS-dashboard env/secrets apply. **You must now set them via `eas env` / EAS dashboard.** |
| 8 | Stale `temp-scaffold` Expo config at root | `app.json` | Deleted (Next.js doesn't read it; real config is `mobile/app.json`) |
| 9 | MiniPlayer cover art empty `alt=""` | `app/_components/MiniPlayer.tsx` | `alt={track.title ? \`Cover art for ${track.title}\` : "Cover art"}` |
| 10 | ContinueRail async effect with no unmount guard | `app/_components/ContinueRail.tsx` | Added `cancelled` flag + cleanup return |

**Verification before pushing:** run `pnpm build` (or let CI run) — all 10 changes
are config/docs/one-liners and type-safe by inspection, but confirm the green build.

---

## B. Audit corrections — DO NOT "fix" these (false positives / outdated)

| Audit claim | Reality | Action |
|-------------|---------|--------|
| 🔴 `pnpm-workspace.yaml` "`allowBuilds` blocks sharp; flip `sharp:false`→`true`" | `allowBuilds:` is **not a valid pnpm key** — it's inert. pnpm 10 uses `onlyBuiltDependencies`. Vercel also provides `sharp` to `next/image` automatically. Flipping it does nothing. | If you want local sharp builds, replace `allowBuilds` with `onlyBuiltDependencies: [sharp, esbuild, '@sentry/cli']`. Test on a **preview deploy** first — the prod build currently works. Not a blocker. |
| 🔴 `pnpm-workspace.yaml` "workspace doesn't include root; add `'.'`" | In pnpm the **root is implicitly the workspace root** — you never list `'.'` in `packages`. Adding it can break resolution. | Leave `packages: ['mobile']` as-is. Not a bug. |
| 🔴 CI "Node v24 is unstable; pin to v22" | Node **24 is now LTS** and the **Vercel default**. Keeping 24 matches prod. | Optional: keep 24 (recommended, matches Vercel) **or** pin 22 for conservatism. Not a blocker. |
| 🟠 `SiteClient.tsx` "console.log unguarded in prod" | Already wrapped in `process.env.NODE_ENV !== 'production'` (lines 28, 32, 68). | No change needed. |
| 🟠 `ProgramCard.tsx` "Image missing accessibilityLabel" | Parent `Pressable` already has `accessibilityLabel` + `accessibilityRole="button"` (line ~74). Adding a label to the inner image causes **double announcements**. | No change needed (optionally `importantForAccessibility="no"` on the image). |
| 🟠 "wire `test` → `vitest run`" | **`vitest` is not in `package.json`** — wiring it makes CI fail with `vitest: command not found`. | Must add `vitest` as devDep first (see §D-7). |

---

## C. Real blockers — concrete fixes (need decisions/secrets, so not auto-applied)

### C-1. CI runs `npm install` but local/Vercel use pnpm (genuine drift)
`.github/workflows/ci.yml` uses `npm i -g npm@9` + `npm install` against
`package-lock.json`, while `package.json` declares `packageManager: pnpm@9.12.3`
and Vercel builds from `pnpm-lock.yaml`. CI is testing a **different dependency
tree** than prod.

**Fix (do after confirming `pnpm-lock.yaml` is committed and current):**
```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with: { version: 9.12.3 }
      - name: Setup Node.js
        uses: actions/setup-node@v5
        with:
          node-version: "22"          # or 24 to match Vercel
          cache: "pnpm"
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      # replace all later `npm`/`npx` calls with `pnpm`/`pnpm exec`
```
Then delete `package-lock.json` and the "Pin npm to v9" step. **Risk:** last
session fought lockfile drift — do this on a branch and watch the CI run before merging.

### C-2. Mobile EAS env (partially done)
§A-7 removed the harmful empty strings. Finish by provisioning the real values:
```bash
cd mobile
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co --environment production preview development
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <publishable_key> --environment production preview development
```
Without this the built app boots with no Supabase config.

### C-3. No mobile CI job
Add a second job to `ci.yml` (minimum: typecheck + lint; ideal: EAS build on tags):
```yaml
  mobile:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: mobile } }
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.3 }
      - uses: actions/setup-node@v5
        with: { node-version: "22", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec tsc --noEmit
      - run: pnpm lint
```

---

## D. Critical — remaining (concrete solutions)

> **Applied 2026-06-30 (observability phase, tsc clean):** D-1 ✅, D-2 ✅ (API
> routes: tips, contributors/apply, articles, admin/report-card, newsletter), D-3 ✅
> (empty catches in webhooks/stripe, cron/weekly-digest, jobs/transcribe), D-4 ✅
> (public routes: progress, watchlist, contributors/follow now log + return generic
> bodies). **Still open:** D-4 for *admin-gated* routes (admin/episodes, admin/live/start,
> admin/contributors/applications, admin/articles — leak only to authenticated admins,
> low risk), plus D-5..D-9 below.

- **D-1. No `Sentry.captureException` anywhere.** Enhance `lib/log.ts` `error()` to
  also call `Sentry.captureException` when a DSN is set, then every existing
  `log.error(...)` becomes a capture site. One change, broad coverage:
  ```ts
  import * as Sentry from "@sentry/nextjs";
  error(...args: unknown[]) {
    console.error(...args);
    const err = args.find((a) => a instanceof Error);
    if (err && process.env.NEXT_PUBLIC_SENTRY_DSN) Sentry.captureException(err);
  }
  ```
- **D-2. `console.error()` in ~6 routes** → replace with `log.error()` from
  `@/lib/log`. Grep: `rg "console\.error" app/api`. Mechanical; pairs with D-1.
- **D-3. Empty catch blocks** in `webhooks/stripe`, `webhooks/mux`, cron/transcribe
  jobs → replace `catch {}` with `catch (err) { log.warn("<context>", err); }`.
  Grep: `rg "catch\s*(\(\w+\))?\s*\{\s*\}" app`.
- **D-4. Raw `error.message` leaked** in API responses (`progress`, `watchlist`,
  etc.) → return a generic body, log the real error server-side:
  ```ts
  catch (err) { log.error("progress save failed", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 }); }
  ```
  Grep: `rg "error\.message|err\.message" app/api`.
- **D-5. ✅ `analytics/end-session`** — switched raw `createClient()` + non-null
  assertions to env-guarded `supabaseAdmin()`, added `log.error` on failure, and
  **whitelisted the 6 updatable columns** (was spreading raw body into a
  service-role update keyed only by `sessionId` — a mass-assignment hole any
  caller could exploit).
- **D-6. Stripe webhook idempotency** — add a `processed_stripe_events(event_id pk)`
  table; `insert ... on conflict do nothing`; skip if already processed. Prevents
  double membership grants on Stripe retries.
- **D-7. Tests don't run.** Add `vitest` devDep, set `"test": "vitest run"`, then
  un-exclude route tests in `vitest.config.ts` only **after** adding `vi.mock()`
  for Supabase/Blob/Mux. (Until mocks exist, leave them excluded — running them
  against real services is worse than not running them.)
- **D-8. Rate limiter falls back to in-memory Map** (ineffective on serverless) →
  require Upstash in production: throw from `lib/rate-limit.ts` if
  `UPSTASH_REDIS_REST_URL` is unset and `NODE_ENV === 'production'`.
- **D-9. Mobile a11y label** `ScheduleList.tsx` image → add
  `accessibilityLabel={item.title}` (verify the row isn't already wrapped in a
  labeled Pressable, like ProgramCard was).

---

## E. Major — remaining (sprint work, concrete approach)

- **E-1. TypeScript `strict: true`** — do **not** flip blindly (build will go red).
  Migrate incrementally: enable `"strict": true` locally, run `tsc --noEmit`, fix
  per-file, or stage via `"noImplicitAny"`/`"strictNullChecks"` one at a time.
  Mobile is already strict; align root TS to one version (`~6.0.3`) too (E-6).
- **E-2. React Query unused** (web + mobile both ship the provider, no hooks use it)
  — migrate data hooks (`use24x7Schedule`, `LiveClient`'s 8 `useState`,
  `ContinueRail`, `ThreadedComments`) to `useQuery`/`useMutation`. Start with one
  high-traffic hook, measure, then roll out. Not a correctness bug; perf/caching.
- **E-3. framer-motion not code-split** — wrap heavy motion components in
  `next/dynamic(() => import(...), { ssr: false })`; add `useReducedMotion()`
  guards (`StoryCard` etc.) for WCAG 2.3.3.
- **E-4. Oversized components** (`LiveStage` ~650, `EliteMux24x7Player`/page ~540,
  `EpisodePlayer` ~504, `AdminDashboard` ~650) — split by concern (controls /
  overlay / timeline / data-fetch). Mechanical but large; do one per PR.
- **E-5. Mobile token-refresh** — add `supabase.auth.onAuthStateChange` listener in
  `useAuth.ts` handling `TOKEN_REFRESH_FAILED`/`SIGNED_OUT` with a user prompt.
- **E-6. Version alignment** — RN `0.85.3` (root) vs `^0.86.0` (mobile); TS
  `~6.0.3` vs `~5.7.3`. Pin both to the Expo-SDK-56-compatible versions; verify
  with `expo-doctor`.
- **E-7. Mobile network detection** — replace AppState+Supabase ping with
  `@react-native-community/netinfo`.
- **E-8. `withSentryConfig`** in `next.config.ts` is commented out → uncomment once
  `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` are set in Vercel (enables
  source maps; otherwise prod stack traces are minified).
- **E-9. Governance docs** — add `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `CHANGELOG.md`.
- **E-10. Mobile build metadata** — add `ios.buildNumber` / `android.versionCode`
  to `mobile/app.json` (stores reject submissions without them).
- **E-11. ESLint hardening** — add `@typescript-eslint`, `eslint-plugin-security`,
  `eslint-plugin-import`, `unused-imports`; add a lint step to CI.
- **E-12. Shared-lib platform leaks** — `lib/theme.ts`, `lib/viewer.ts`,
  `lib/mux-247/*` use browser APIs in shared `lib/`. They're web-only today
  (mobile has its own copies), so the *risk* is future import, not a live crash.
  Either move web-only modules under `app/` or document `lib/` as web-scoped.
- **E-13. Auth/schedule/analytics duplicated** web↔mobile (~80% same) — extract a
  platform-agnostic `core/` with storage/redirect/admin adapters. Large; track as
  its own epic. Note mobile `useAuth` lacks the admin-status fetch web has.

---

## F. Minor — remaining (batch when convenient)

- `Header.tsx` ticker keys → unique key `\`${item.href}-${i}\``.
- `LiveChat.tsx` send button → disable + spinner while `sending`.
- `ScheduleList.tsx` FlashList `keyExtractor` → `item.programId` if unique.
- `mobile usePlaybackAnalytics` / web silent catches → `if (__DEV__) console.warn(...)`, never throw.
- `vitest.config.ts` → add coverage provider + low initial threshold (after D-7).
- `tests/e2e/mobile.spec.ts` conditional `test.skip` → split into per-platform `describe` blocks.
- `next.config.ts` CSP `report-uri` → `report-to` (cosmetic; `report-uri` still works).
- `PlayerControls.tsx` touch targets → `minWidth: 44, minHeight: 44`.
- Hardcoded `https://thecolonyok.com` fallback in ~15 files → derive from `VERCEL_URL` for correct preview canonicals.
- `lib/env.ts` → add `EXPO_PUBLIC_*` to documented/validated set; consider promoting Stripe/Mux to required when those features are enabled.
- `app/layout.tsx` inline theme script → move to nonce'd `next/script` for strict CSP.
- `eas.json` submit + i18n → fill Apple credentials when ready; add i18n lib only if multi-language is planned.

---

## G. Suggested execution order

1. **Now / this branch:** §A (done) → verify `pnpm build` green → C-2 (set EAS env).
2. **Next PR (CI correctness):** C-1 (pnpm in CI) → C-3 (mobile job) → E-11 lint step → D-7 (vitest dep + `test` script).
3. **Observability PR:** D-1 → D-2 → D-3 → D-4 → D-5 → E-8.
4. **Payments hardening:** D-6 → D-8.
5. **Sprint backlog:** E-1 (strict), E-2 (React Query), E-4 (component splits), E-13 (shared core), plus the §F batch.
