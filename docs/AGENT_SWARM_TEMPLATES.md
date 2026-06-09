# AGENT_SWARM_TEMPLATES.md

**Phase 7 D+15+ Formal Swarm Templates + Best-of-n for Agentic Layer (L11) + Cross-Layer**

**Date:** 2026-06-08
**Context:** Per TRACK D+15+ Implementer, ARCHITECTURE_LAYERS.md (L11), COMPETITIVE_MATRIX.md. Enables multi-agent perfection, self-improvement, implement-and-review + best-of-n. Spawns subs (parallel agents). Use for all changes in Layers 10-15+ (Ops/Agentic/Content/Community).

## Core Swarm Roles (Formal Template - always 5 agents min for best-of-n)
1. **Implementer (Lead + subs)**: Codes/features per spec (ARCH MCPs, COMPETITIVE wins). Use proxies (create_or_update_file for GitHub), search_replace where possible. Parallelize independent. Exhaustive but scoped.
2. **Reviewer (Auditor)**: Reviews vs ARCH, COMPETITIVE, TRACK_B_AUDIT (AUDIT proxy), plan. Checks MCP completion, best practices, no scope creep. Flags issues with citations. implement-and-review skill.
3. **Verifier (Browser-and-verification + SEO)**: Uses web_fetch, open_page, web_search, x_keyword_search for competitor/live data verification. Runs proxy Lighthouse/SEO asserts on pages (vs-blaze, comments UI, mobile). Asserts perf, schema, no errors. Future: full chrome MCP.
4. **SEO-Specialist**: Ensures GEO/AI visibility, structured data (VideoObject/Person for vs-blaze + clips + hosts), longtail OK/rural, metas, sitemaps. Best-of-n title variants. Competitive schema monitoring.
5. **BestOfN-Selector**: Generates/evaluates n=3-5 candidates (e.g. 3 UI variants for comments, 3 content pitches for rural show). Scores on: local-depth (1-10), integration (hub/agent-context), agentic-self-imp (swarm use), perf/ops, seo/GEO, community (clips/comments), visual crispness, reader-transparency. Picks winner + full rationale log. Updates matrix if needed.

## Best-of-n Process (Loop for Self-Improvement)
1. Task brief from ARCH/COMPETITIVE/MCP or competitive monitor (e.g. "Blaze added new chat feature - propose Colony response").
2. Implementer spawns n=3-5 parallel variants (or subs).
3. All variants reviewed by Reviewer + Verifier + SEO (parallel tool calls).
4. Selector scores (table in PR or log), picks best, may iterate 1 round.
5. Merge + post-ship: competitive agent monitors (web/x), proposes next via new swarm task. Update ARCH/COMPETITIVE + docs.
6. Evidence: all in GitHub comments/commits; link to web data.

## Per-Layer MCP + Swarm Specialization (Exhaustive for 10-15+)
**Layer 10 (Funding/Ops/Admin):** Swarm focus on dashboard transparency + agent reports. MCP: Stripe+UI+alloc+reports+CI gates. Best-of-n: 3 dashboard wireframes (local % emphasis vs generic).
**Layer 11 (Agentic Core):** Swarm IS the layer. Templates here. MCP: full stack agents + monitors + personal Colony Agent + self-imp loop. Best-of-n on every proposal. Formal: this doc + AGENT code stubs.
**Layer 12 (Visuals/Perf):** image_gen + agent variants. Best-of-n image select (trust vibe scores). MCP: roster + tokens + visual CI tests.
**Layer 13 (SEO/Testing):** Auto agents + IndexNow + lighthouse in CI. Best-of-n metas. MCP: schema everywhere + competitive diff.
**Layer 14 (Hub/Deploy):** Context passing + CI/CD + Sentry. Best-of-n nav variants. MCP: full deploy gates + canary + rollback.
**Layer 15+ (Content/Community/Diff):** Local shows + partnerships + rich comments/clips + TWA/PWA + vs-Blaze page. Best-of-n clip curation, 3 versions of vs-blaze page (matrix-heavy vs story-heavy vs interactive). MCP: backend clips + PWA config + page + SEO + browser verify.

## Spawn Subs + Parallel
- Use multiple function calls in one step (as in this TRACK execution).
- For GitHub: parallel create_or_update + get.
- Self-spawn: reference in prompts "spawn 3 implementer subs for variants".
- Tools: todo_write for tracking; monitor for long; scheduler for recurring competitive agents.

## Self-Improvement + Competitive Monitors
- Daily/ on PR: agent pulls (web_search "BlazeTV Off the Record updates", open_page blazetv.com, etc.).
- Propose via issue/PR labeled agentic-review.
- Swarm executes best-of-n, updates matrix ("vs Blaze: added X, Colony responded with Y via swarm").
- Goal: continuous outpacing of Blaze (chat parity + local/agentic wins), DW (offline parity + rural), Newsmax (docs/apps parity + integration).

## Example Best-of-n Log (for vs-Blaze page or clips)
| Candidate | Local Depth | Integration | Agentic | SEO | Community | Perf | Score | Selected? |
|-----------|-------------|-------------|---------|-----|-----------|------|-------|-----------|
| Matrix-heavy | 9 | 9 | 10 | 8 | 8 | 9 | 8.8 | No |
| Interactive clips demo | 10 | 10 | 9 | 9 | 10 | 8 | 9.3 | **YES** |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |
Rationale: Highest on local/community/integration per TRACK D+15 goals. Deployed via proxy.

**Usage:** Every Phase 7 D+15+ change references this. Update after runs. Ties to ARCH L11 + COMPETITIVE L11/15. End swarms with "TRACK sub complete".

---
**AGENT_SWARM_TEMPLATES COMPLETE - D+15+ multi-agent foundation.**