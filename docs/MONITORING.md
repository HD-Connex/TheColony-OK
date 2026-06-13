# MONITORING.md

**Phase 7 D+15+ Monitoring Setup (Sentry) for Layers 10-14 Ops/Perf/Testing/Deploy/Agentic**

**Setup:** Full Sentry integration for error tracking, perf (web vitals, agent calls, payments, realtime), releases. Ties to CI (sourcemaps on deploy). Custom for agentic (trace swarms, best-of-n runs, competitive monitors). OK-local tagging.

## Files Created (proxies)
- sentry.client.config.ts (browser: sessions, routing, tags for local content)
- sentry.server.config.ts (Node: API, webhooks, agent endpoints)
- instrumentation.ts (Next.js edge/server tracing for L14 hub, L1 live, L11 agents)

## Key Monitored Surfaces (per Layers)
- Layer 10: Funding dashboards, Stripe webhooks, allocation reports, member input agents.
- Layer 11: All agent calls (latency, errors, best-of-n scores, competitive pulls), personal Colony Agent sessions.
- Layer 12: Image gen/variant pipelines (if server), visual loads.
- Layer 13: SEO agents, sitemap builds, schema validation.
- Layer 14: Hub nav, unified search/synth, context passing, auth, deploy canaries.
- Layer 15+: Comments/clips uploads + agent review, TWA/PWA loads, vs-blaze page interactions, local content renders.
- Realtime/Live: queue updates, viz, chats, clip injections.
- Cross: CWV (LCP/CLS via Sentry perf), mobile (TWA metrics).

## Alerts + Dashboards
- Error rate >1% on agentic paths -> page team + auto best-of-n fix proposal.
- Perf regression (agent >300ms or LCP>2.5) -> CI gate fail + swarm review.
- Competitive: monitor external via separate agents + log anomalies to Sentry (e.g. Blaze price change).
- Releases: auto on CI deploy with SHA + matrix version.

## Integration with CI/Workflows
See .github/workflows/ci.yml (Sentry release step). PR review workflow tags traces.

## Rural/Agentic Perf Notes
- Tag events with 'ok_rural' for low-connectivity offline pack metrics.
- Agent swarm traces for self-imp visibility.

**Next:** Add DSN to .env (prod), init in root layout/app. Run `npx @sentry/wizard` in capable env. Full prod dashboards for D+15+ perfection.

## Phase 7 Additions (Monitoring Basics + RUM per docs + PERF_AUDIT.md recs)
- **Sentry:** Pre-existing guarded wiring (sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, instrumentation.ts + onRequestError; lib/env.ts FEATURE_RECOMMENDED for SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN; used in error.tsx + /api/csp-report). No-op safe without DSN (see ENV_AUDIT_AND_FIXES.md + .env.example). Client init runs early; server/edge via register().
- **RUM / Web Vitals:** Added basic native PerformanceObserver reporting (LCP, INP approx via event entries, CLS) in app/_components/SiteClient.tsx (reuses existing client bootstrap + 'use client' effect pattern for PWA/theme/observers). 
  - Console only in !prod (dev-friendly).
  - Sentry.captureMessage with tags {vital, page, source: 'rum-siteclient'} + extra (value, url, ts) — surfaces directly in Sentry perf/errors dashboards (leverages @sentry/nextjs; graceful try/catch degrade if DSN absent).
  - No new dependencies (Sentry already present; native Performance API). Complements layout preconnects + next/font + Motion reduced + PWA. See PERF_AUDIT rec #8: "Monitor with field data (add web-vitals)".
  - INP/LCP targets in code comments; future: can add custom Sentry metrics or sampling.
- **Uptime / Health:** Added public stub at app/api/health/route.ts (GET + HEAD).
  - Returns {status:'ok', timestamp, env, uptime, runtime, note}.
  - Reuses NextResponse + api/ patterns (cf. csp-report GET for manual testing/health).
  - No auth (for external monitors); cache-control no-store. For deeper: combine with Sentry 5xx + RUM.
  - Vercel crons (vercel.json) and admin/status remain separate.
- **Alerts / 7pm Monitoring:** Basic via Sentry (errors auto + RUM metrics). Rec: configure Sentry alerts for error rate >1%, LCP p75 >2500ms, INP p75 >200ms, 5xx on key paths (/live, /stories/*, /api/*). Tag rural/OK events. Monitor prod during soft-launch windows ("7pm" YT etc.).
- **Env / Deploy:** SENTRY_* listed in lib/env.ts FEATURE_RECOMMENDED (warn only, graceful). User action: set NEXT_PUBLIC_SENTRY_DSN (client) + SENTRY_DSN (server) + optional SENTRY_AUTH_TOKEN in Vercel Project > Settings > Environment Variables (Production + Preview scopes). No build impact. See .env.example.
- **Reuse/Clean:** Follows Phase 1 subagent style (ops/monitoring as breadth), existing Sentry/env/log patterns, self-contained, build-clean.

**Phase 7 Monitoring: Sentry + RUM + /api/health enabled (guarded). Ready for prod dashboards + 7pm observability.**

---
**MONITORING SETUP COMPLETE - Ops/Perf for TRACK D+15+.**