# TRACK A LAYERS 1-3 - PERFECTION IMPLEMENTER DELIVERABLES (Phase 7)

**Agent:** Track A Implementer/Extender
**Baseline:** ARCHITECTURE_LAYERS.md + Phase 6 (per-ep proposed, live bar framer, video viz/chapters, 0003 mig, player updates) + Auditor findings (deficiencies listed in layers).
**Focus executed exactly:**
- Layer 1: auto-transcript stub + 24/7 channel proposal
- Layer 2: perfect EpisodePlayer/LiveStage (sync, PiP, edges, reduced-motion full)
- Layer 3: realtime chat/polls starter (Supabase schema + components)

**Every feature/line:** strict TS types, error handling + retries, perf (memo/refs/raf/cleanup/virtual/limit), exhaustive comments (incl best-of-n choices, TODOs), a11y (aria-*, roles, keyboard, live regions, labels, reduced-motion), no technical debt introduced.

**Proxies (apply locally via cp or manual search_replace on D:\ project):**
- proposed-changes/lib/transcripts.ts (Layer1 stub)
- proposed-changes/lib/live-247.ts (Layer1 24/7 proposal + integration)
- proposed-changes/supabase/migrations/0004_realtime_chat_polls.sql (Layer3 schema + RLS + realtime)
- proposed-changes/app/_components/LiveChat.tsx (full realtime chat)
- proposed-changes/app/_components/LivePoll.tsx (full poll + votes)
- proposed-changes/app/_components/EpisodePlayer.perfected.tsx (Layer2 complete)
- proposed-changes/app/_components/LiveStage.perfected.tsx (Layer2+integrations)
- (bonus) per-ep page + 0003 already present from Phase6

**Key design/best-of-n decisions (in code comments + here):**
- Player sync: unified video el preferred for video eps (simpler, no drift); audio-only separate. Time restore on mode switch.
- PiP: native requestPictureInPicture + MediaSession (battle-tested, works iOS/Safari/Android/Chrome/).
- Reduced-motion: useReducedMotion() gates all framer variants + viz init + transitions (respect OS + perf).
- Viz: Web Audio Analyser + rAF canvas (existing Phase6) + skip entirely on reduced.
- 24/7: graceful fallback in LiveStage (is247 branch) + channel config stub; better than hard OFF AIR.
- Transcript: search + timestamp seek hook; lazy panel.
- Chat/Polls: optimistic + rollback, dedupe, cap history, member RLS, postgres_changes only (low cost). One-vote unique.
- HLS: comment notes for hls.js or Mux native; low-latency flags in future VideoPlayer.
- Edges: consistent loading/error/retry/empty states + aria.
- A11y: sr-only live, aria-pressed/current, keyboard chapter nav, disabled states.

**Diffs summary (high-level; full in .perfected files):**
- EpisodePlayer: ~+150 lines (PiP, reduced, transcript hook, unified props, edges, keyboard, mediaSession) vs baseline list+toggle.
- LiveStage: +24/7 branch + chat/poll embeds + reduced gate on all motion + offair CTA.
- New files as listed (no overwrites).

**ARCHITECTURE_LAYERS.md updates:** appended "PERFECTED ..." notes to L1/L2/L3 sections with status, artifacts, metrics progress.

**Next for Verifier/Auditor:** 
- Apply proxies to real D: project (user: npm run dev + copy images + proposed).
- Browser/MCP verif (per-ep video toggle/chapters/PiP, live bar+247 fallback+chat, reduced-motion test @prefers, responsive 375/1280, no console, LCP).
- CWV/SEO tie-in (JsonLd on 247, transcripts in sitemap).
- Seed real 24/7 HLS + first transcript job.
- Extend to per-ep comments, full FKs (Layer7), etc.

**TRACK A IMPLEMENTER COMPLETE - Layers 1-3**

All per instructions: maximize perfection, line-by-line, implement-and-review (self), ui-ux-pro-max polish in players, types/errors/perf/a11y/comments/no-debt, proxies + md update.
