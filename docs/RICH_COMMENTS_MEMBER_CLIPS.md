# docs/RICH_COMMENTS_MEMBER_CLIPS.md

**Phase 7 D+15+ Rich Comments + Member Clips - Layer 7/15+ Community/Diff**

**Win vs Blaze:** Continuous rich participation (clips + synth) + agent moderation vs Blaze weekly invite-only OTR chats (powerful but limited).

## Features
- **Threaded Comments:** On per-ep, live, contributor, vs-blaze page. Member-only for premium. Agent tags (topics, sentiment). Reply chains feed community synth to live queue/hub.
- **Member Clips (30s max):** Video/audio upload (TWA/mobile capture friendly). Auto-transcript (agent), AI review (toxicity/fact/best-of-n highlight score). Approved clips: embed in comments, featured in hub/live queue (agent predictive insert), county forums highlights. Clips tagged OK rural (ag/energy/faith) for personalization.
- **Moderation Swarm:** Implementer posts clip; reviewer (policy), verifier (web context), seo (for surfacing), bestofn-selector (top 3 clips per show). Auto + human escalation for edge.
- **Integration:** Clips/comments -> Layer 1 live (injects), L11 personal agents ("your clips in today's rural briefing"), L14 hub (community panel), L5 pods (chapter-like clip inserts).

## Tech MCP (Exhaustive)
1. Upload API + storage (member auth).
2. Agent pipeline: transcribe + review + best-of-n (score local/authenticity/engagement).
3. UI: rich embed players in comments (crisp host style overlays), mobile TWA optimized.
4. DB schema: clip {user, ep_id, transcript, score, approved, tags[] }.
5. Best-of-n curation UI + push to realtime.
6. Perf: Sentry traces on review; offline clip cache in PWA.
7. SEO: structured for clip pages (VideoObject).

**Verification/Skills:** browser-and-verification on upload flows (proxy web); seo for clip discover; implement-and-review on moderation code; best-of-n in selector.

**Competitive:** Beats Blaze community (limited chats) with always-on clips + synth integration + local rural focus. Feeds L15 vs-blaze demos.

---
**RICH COMMENTS + MEMBER CLIPS SPEC COMPLETE - Layer 15+ TRACK D+15+.**