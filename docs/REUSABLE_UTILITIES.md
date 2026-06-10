# Reusable Utilities Map (The Colony OK)

This document captures the core shared libraries that were introduced or hardened across phases. These form the foundation for consistent security, rate limiting, auth, entitlements, email, and background jobs.

## Core Utilities

| Utility              | Phase Introduced | Key Exports                          | Reused By (examples) |
|----------------------|------------------|--------------------------------------|----------------------|
| `lib/sanitize.ts`    | P0              | `sanitizeHtml`, `stripHtml`         | Podcast pages, articles, threaded comments, newsletter forms, tip submissions, admin CMS |
| `lib/rate-limit.ts`  | P0              | `rateLimit`, `keyFromRequest`, `tooManyRequests` | All public APIs (tips, newsletter/subscribe, comments, contributor apply, clip moment, upvote), crons |
| `lib/admin-auth.ts`  | P0              | `requireAdmin`, `requireServiceToken`, `requireCronSecret`, `safeCompare`, `getUserRole`, `roleAtLeast` | /admin pages & APIs, clips/moderate, jobs/transcribe, crons (ingest/poll), contributor approve workflow, service tokens |
| `lib/entitlements.ts`| P0              | `getMembership`, `isActiveMember`   | Clip uploads, paywalls, comments gating, perk access (`hasPerkAccess`), member-only features, LiveChat |
| `lib/email.ts`       | P1              | `sendWelcomeEmail`, `sendReceiptEmail`, `sendCancelEmail`, `sendContributorApprovedEmail`, `sendTipAckEmail`, `sendNewsletterConfirmEmail`, `sendNewsletterDigest` | Stripe webhook (receipts/welcome/cancel), tips, contributor approvals, newsletter double-opt-in + weekly digest |
| `lib/jobs.ts`        | P0              | `withRetry`                         | rss-ingest, transcribe job, email sends (future), embedding backfills |

## Design Principles
- All utilities are "server-only" where appropriate (import "server-only").
- Prefer composition over duplication (e.g. entitlements is the single source for membership truth, delegated to from Stripe perks and auth-client).
- Rate limiting and sanitization are applied at every untrusted input boundary.
- Admin and service auth are **never** trusted from middleware alone — every privileged route re-validates with `requireAdmin` / `requireServiceToken`.
- Background jobs use `withRetry` for resilience.

## Usage Notes
- New public-facing POST routes should import and use `rateLimit` + `keyFromRequest` + `tooManyRequests`.
- Any HTML from user/RSS input must pass `sanitizeHtml`.
- Membership checks should go through `isActiveMember(userId)` (or full `getMembership` when tier/role needed).
- Cron-protected routes use `requireCronSecret`.
- When adding new transactional email, add a template under `emails/` and a sender in `lib/email.ts`.

## Related
- See Phase 0/1 infra work for initial creation.
- Phase 2/3 extended usage (newsletter, clips community, admin CMS, P3 transcript search).
