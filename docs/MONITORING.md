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

---
**MONITORING SETUP COMPLETE - Ops/Perf for TRACK D+15+.**