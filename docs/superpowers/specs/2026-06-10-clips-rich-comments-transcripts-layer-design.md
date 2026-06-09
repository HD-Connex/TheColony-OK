# Member Clips + Rich Comments + Transcripts/PWA/Rural/Personalization Layer Design

**Date**: 2026-06-10
**Layer**: Phase 2 Core Functional (entry point per audit + user skill directive)
**Related Audit Items**: High Add - Full member clips system (RICH spec), real transcripts, gifts/perks/usage, PWA/TWA full, advanced personalization, local rural depth. Ties to Layer 12 Testing/Deploy, Layer 13 Agentic.
**Skills Mandate**: /superpowers:brainstorming (this doc), /superpowers:writing-plans + executing-plans (per-layer), TDD + ruflo-testgen, systematic-debugging, verification-before-completion + run/verify, code-review + requesting, using-git-worktrees + finishing-a-development-branch, vercel:nextjs/react-best-practices (App Router/RSC/player), vercel:vercel-functions (webhooks/signed/clip upload/moderation/comments), claude-api + vercel:ai-sdk/gateway (transcribe/summarize/chapters/stream), frontend-design (EpisodePlayer/LiveStage polish + imagery), seo + technical + schema + geo + local + content (VideoObject/OG/GEO/rural), vercel:vercel-storage (Blob for upload), ruflo-aidefence (safety/pii for moderation), ruflo-migrations (clips/comments + RLS), vercel:auth (Supabase + entitlements), ruflo-observability, vercel:vercel-firewall + ruflo-security-audit, vercel:deployments-cicd + env + cli, vercel:vercel-sandbox, ruflo-docs, etc.

## 1. Goals and Success Criteria
- Deliver the "full member clips system" as the flagship Phase 2 feature per RICH_COMMENTS_MEMBER_CLIPS.md and SITE_AUDIT_REPORT (upload 30s video/audio TWA-friendly, auto-transcript + AI review/toxicity/best-of-n/score, approved embeds in comments/hub/live/pods + county forums, DB + RLS, moderation swarm, best-of-n curation, feeds personalization/synth).
- Integrate real transcripts (enhance /api/jobs/transcribe stub with Claude for summarization/chapters; wire to EpisodePlayer).
- Extend to PWA/TWA (clip capture/upload cache, offline), rural (tie clips to LOCAL 4 shows + tags + aggregator), personalization (auth-gated "your clips" rails), gifts/perks (use clips as perk?).
- Ensure production-grade: App Router/RSC correctness (per vercel react-best-practices), Vercel Functions for upload/moderation/webhooks/signed Mux tokens, SEO (VideoObject schema, OG, GEO citability, local rural, content quality for bylines), security (safety-scan/pii, rate limits, firewall), observability, TDD + browser verification, isolated deploy with worktrees.
- Competitive moat: Continuous clips vs Blaze weekly chats; rural OK depth vs national; agentic moderation/curation.
- Metrics: Build/lint clean, full a11y/mobile/Lighthouse (INP/CWV), end-to-end gates pass (upload -> approve -> embed -> play), SEO schema valid, no PII leaks, tests cover happy/edge/error.

## 2. Architecture Overview (per listed skills)
- **DB Layer**: Ruflo migrations (new 0014_clips_comments_rls.sql sequential). Tables: clips (id, user_id, ep_id/show_id, storage_path or blob_url, transcript, ai_score, approved, tags[], created_at, county?, duration_s), threaded_comments (id, parent_id, user_id, target_type (ep/live/contributor/story), target_id, content, agent_tags jsonb, created_at). RLS: owner write, public read for approved, member for premium.
- **Backend/API (Vercel Functions + Storage)**: Node.js runtime (full for auth/storage/AI; not edge for DB/Blob). 
  - Upload: POST /api/clips/upload (auth via Supabase, use @vercel/blob for upload, TWA friendly 30s limit, trigger transcribe job).
  - Moderation: Internal or /api/clips/moderate (ruflo-aidefence:safety-scan + pii-detect for toxicity/PII, best-of-n via Claude, approve/flag).
  - Threaded comments: /api/comments (create/reply with agent tags).
  - Transcribe job: Enhance /api/jobs/transcribe (claude-api for summary/chapters, vercel:ai-sdk/gateway for orchestration if streaming; upsert to transcripts + embeddings).
  - Webhooks: Mux for video ready (signed tokens per vercel-functions), Supabase for realtime.
  - Entitlements: vercel:auth confirm with Supabase + gift/perks stub (clips as perk?).
- **Frontend (App Router / RSC + frontend-design)**: 
  - EpisodePlayer/LiveStage polish (frontend-design: bold typography, OK motifs, zero-radius, spatial asymmetry for clip embeds/players; support clip queue, PiP, viz).
  - New ClipUploader (TWA capture, preview, progress; member gate).
  - Embeds in comments/hub/live/pods (rich player with host style overlays).
  - Personalization rails (auth-gated "your clips" + local rural hints).
  - Contributor byline/spotlight content quality (seo-content).
- **AI/Agentic (Layer 13)**: Claude for transcribe/summarize/chapters/best-of-n curation. Formalize swarm (per AGENT_SWARM_TEMPLATES): moderation (safety + policy + verifier + seo + bestofn-selector), rural aggregator, personalization synth. Ruflo-rag-memory for clip knowledge (optional).
- **SEO (multi-skill)**: JSON-LD VideoObject for clips/episodes/podcasts (vercel:nextjs generateMetadata + seo-schema), OG/meta, GEO (seo-geo for AI Overviews citability), local (seo-local for rural OK modules + partnerships), content-brief for contributor pages.
- **PWA/TWA + Rural/Personalization**: Extend sw/manifest for clip upload cache (per MOBILE + vercel guidance). Tie clips to LOCAL 4 shows (Ag/Energy/Faith/Community) + tags + aggregator MVP.
- **Security/Observability**: Ruflo-aidefence for clip/comment, vercel:vercel-firewall + ruflo-security-audit for rate limits/hardening, ruflo-observability:observe + Sentry (vercel:nextjs wiring), PII detect.
- **Testing/Deploy (Layer 12)**: TDD (superpowers:test-driven-development + ruflo-testgen:test-gaps/testgen for all backend/logic), ruflo-browser for upload/embed flows, superpowers:verification-before-completion + run/verify end-to-end gates (build, Lighthouse via seo-unlighthouse, browser, real app). Isolation: superpowers:using-git-worktrees (this worktree), vercel:vercel-sandbox. Deploy: vercel:deployments-cicd (preview->prod, rollback), vercel:env-vars + cli for sync, cicd gates. Code-review before merge.
- **Docs**: ruflo-docs for records, update SITE_AUDIT_REPORT + RICH/LOCAL/MOBILE/ARCHITECTURE.

**Tech Stack**: Next.js 16 App Router (RSC where possible per vercel:react-best-practices - no waterfalls in players, parallel fetches), Supabase (auth/realtime/RLS), @vercel/blob (upload per skill), Claude (via API or vercel:ai-sdk + gateway for streaming), Vercel Functions (nodejs for heavy, Fluid for concurrency per skill), existing DS (brutalist patriotic, zero-radius from Phase 1).

## 3. Data Flow (High Level)
1. Member (auth) -> ClipUploader (TWA) -> /api/clips/upload (Blob, trigger job) -> transcribe (Claude) -> AI review (safety + best-of-n) -> moderation queue or auto-approve (score > threshold).
2. Approved clip -> embed in EpisodePlayer (chapter-like), LiveStage queue (realtime), comments thread, hub panel, personalization rail, rural show inserts.
3. Search/SEO: VideoObject schema, GEO citability for "OK rural clips".
4. Background: waitUntil/after for post-upload processing (per vercel-functions).

Error handling: Graceful fallbacks (stub transcript if AI down), Sentry traces, rate limits.

## 4. Key Risks & Tradeoffs (per skills)
- Storage: Vercel Blob (skill mandate, global edge) vs Supabase (existing) — use Blob for clips per directive; hybrid if needed.
- Moderation: Full agent swarm (best for scale per audit) vs hybrid human — start with safety-scan + Claude best-of-n, escalate.
- Scope: MVP (upload + basic embed + transcript) vs full (county forums, PWA cache, rural aggregator, gifts) — per audit "start with basic upload + player, then moderation".
- AI cost/latency: Gateway for orchestration (skill) to control.
- RSC vs client for players: RSC for metadata/SEO, client for interactive (per vercel best practices).
- Testing: Full browser + TDD required; use worktree + sandbox for isolation.

## 5. Success Verification (per verification + listed)
- Build/lint clean, RSC/player correct (react-best-practices).
- Upload -> approve -> embed -> play works in real app (verification-before-completion + run).
- SEO: Valid schema (unlighthouse + manual), GEO/local content.
- Security: No PII leaks (safety-scan), rate limits, audit clean.
- Tests: TDD coverage for backend/logic, browser flows (ruflo), end-to-end gates.
- Deploy: Isolated in worktree, preview->prod with cicd, rollback ready.
- Agentic: Swarm formalized for moderation/curation.
- Update audit report + docs.

This design follows all mandated skills and the audit/RICH/LOCAL specs. Incremental: MVP first, then expand.

**Next**: User approval per section or overall. Then invoke writing-plans for the detailed TDD plan. Work in the feature/clips-layer worktree for isolation.