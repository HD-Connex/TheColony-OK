const PptxGenJS = require("pptxgenjs");
const fs = require("fs");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9";
pptx.author = "The Colony OK Audit";
pptx.title = "The Colony OK — Full Site Audit Report";

// Color palette from site (brutalist patriotic, elevated per frontend-design)
const colors = {
  ink: "0A1F3D",
  paper: "F4F0E6",
  alarm: "EC1024",
  inkSoft: "0F2A4F",
  rule: "1A3358",
  white: "FFFFFF"
};

// Title slide
let slide = pptx.addSlide();
slide.background = { color: colors.ink };
slide.addText("THE COLONY OK", { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 44, bold: true, color: colors.paper, fontFace: "Arial Black" });
slide.addText("COMPREHENSIVE FULL-SITE AUDIT & PROGRESS REPORT", { x: 0.5, y: 2.6, w: 9, h: 0.6, fontSize: 18, color: colors.alarm, fontFace: "Arial" });
slide.addText("Brutalist patriotic media platform — post ui-ux-pro-max overhaul assessment.\nStrengths, weaknesses, gaps, and actionable roadmap for top-tier agency quality.", { x: 0.5, y: 3.4, w: 9, h: 1.2, fontSize: 14, color: colors.paper, fontFace: "Arial" });
slide.addText("N°01 / AUDIT  •  BUILD CLEAN  •  PARTIAL OVERHAUL EXECUTED", { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 11, color: colors.paper, fontFace: "Arial" });

// Strengths slide
slide = pptx.addSlide();
slide.background = { color: colors.paper };
slide.addText("STRENGTHS", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: colors.ink, fontFace: "Arial Black" });
slide.addText("Foundation • Identity • Partial Polish", { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 12, color: colors.alarm, fontFace: "Arial" });

const strengths = [
  { title: "UI/UX — Design System", text: "variables.css with full ui-ux-pro-max comments (99 guidelines, priorities, legacy fidelity). Zero radius, navy/cream/alarm tokens, N° mono headers, heavy rules — faithful to legacy/ + evolved." },
  { title: "UI/UX — New Components", text: "AuthorityBadge + ClipsTeaser for E-E-A-T and community elevation (integrated across journalists, per-ep, live, podcasts). Polished Paywall (token-driven, aria, .btn--lg, no raw hex)." },
  { title: "Technical — Security & Images", text: "Strong headers (HSTS preload, nosniff, SAMEORIGIN, restrictive Permissions) in next.config. Widespread next/image with sizes/lazy/remote (mux/supabase/yt); media-map centralized." },
  { title: "Content/IA — Hub Model", text: "Home: curated teasers + N° sections + live embed + explicit 'hub teaser' comments (matches 'newspaper front page' + FP/ProPublica inspiration). Dedicated: Live TV HUB + Channel Guide + ClipsTeaser; podcasts deep + per-ep immersion + chapters; journalists authority + badges; contributors tiers + work rails + E-E-A-T; stories immersion + Paywall; pricing/about pure." },
  { title: "Backend — Integrations", text: "Clean dual Supabase (admin/public) + central types (Show/Episode with video/chapters). Solid RSS ingest + crons (full parse with video detection, idempotent, per-show errors). Payments core (stripe + tier mapping, checkout/portal, webhook members sync + RLS, auth magic OTP + members poll, binary tiers). Video/Mux + chapters + catalog good. Search/semantic foundation. Migrations + RLS + scripts (13 SQL with comments/explain, apply-migrations with verification, seed idempotent, good indexes). Build/lint clean." },
  { title: "Docs + Strategy", text: "Rich docs (UI_UX_DESIGN_SYSTEM updated with execution notes + new components + 'post-plan' claims; LOCAL_OK rural; RICH clips/comments; MOBILE_TWA_PWA; MONITORING; ARCHITECTURE + COMPETITIVE_MATRIX moats/diffs). Competitor research integrated. Prior plan execution evidence. Legacy fidelity preserved." }
];

strengths.forEach((s, i) => {
  const y = 1.4 + (i * 0.85);
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y, w: 0.15, h: 0.7, fill: { color: colors.alarm } });
  slide.addText(s.title, { x: 0.8, y: y, w: 8.7, h: 0.3, fontSize: 12, bold: true, color: colors.ink, fontFace: "Arial" });
  slide.addText(s.text, { x: 0.8, y: y + 0.3, w: 8.7, h: 0.5, fontSize: 10, color: colors.ink, fontFace: "Arial" });
});

// Weaknesses slide
slide = pptx.addSlide();
slide.background = { color: colors.paper };
slide.addText("WEAKNESSES", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: colors.ink, fontFace: "Arial Black" });
slide.addText("Drift • Repetition • Stubs", { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 12, color: colors.alarm, fontFace: "Arial" });

const weaknesses = [
  { title: "UI/UX — Inline Styles & Raw Hex", text: "120+ style={{}} hits (vs/blaze dozens + tailwind hacks + raw bg-[#8B0000] rounded + text-[10px]; shows hero/ep heavy inline; podcasts per-ep/home/live scattered; system pages; LiveStage demo, YouTubeDemoReel, EpisodePlayer, Watchlist/Checkout. Violates DS 'no inline/raw hex', 'semantic tokens only'. Radius violations (50%, 999px, var(--radius-sm)). Touch targets <44px (btn--sm, hamburger 36px). A11y gaps (labels, focus). Repetition of CTAs/sections (full membership-cta duplicated home + pricing; 'Join the Masthead' + contrib-plan-grid on home + contributors/join + journalists leak + vs). Hub leaks (home near-full masthead tiers + membership features). Design system drift (vs/blaze complete break; demo pollution in prod). Motion/micro inconsistent." },
  { title: "Technical — PWA / Fonts / Security Gaps", text: "Manifest icons broken (all logo.jpg, shortcuts 404); no SW registration/install prompt (SiteClient returns null); sw.js minimal stub only (no offline per strategy). External Google fonts (no next/font); no CSP. Raw <img> in podcasts/live; inline in system pages; Sentry files missing. Duplicate motion package; limited realtime client wiring; some perf (framer heavy). SEO gaps (not full OG everywhere; JsonLd basic/unsafe). Other: no eslintConfig." },
  { title: "Content / IA — Repetition + Thin Depth", text: "Full membership-cta + masthead grids duplicated on home (hero + N°06 + N°07) + journalists leak + vs. Schedules/hardcoded fallbacks on home duplicate live page. ClipsTeaser variants repeated without abstraction. Data/content thin vs ambition (articles/contributors use fallbacks; no deep rural OK content matching LOCAL strategy (generic shows only); transcripts/search partial; no full forum/clip pages). Other leaks (vs/blaze has one non-token button + placeholder text; membership page features list repeats pricing)." },
  { title: "Backend — Stubs & TODO Debt", text: "lib/stripe.ts: 4x stubs (gifts, hasPerkAccess always-true, logUsage, handleEvent) + TODOs for Supabase members/perk_grants/usage/county + 'always true' placeholder; PRICING fallbacks. transcripts.ts: pure stub generator (demo segments, confidence 0, provider 'stub') + multiple TODOs for real impl/ingest/EpisodePlayer/24/7; viewer.ts stub localStorage (DB table exists but unused in lib; progress API exists separately); live-247.ts + video.ts placeholders/DEMO_247_MP4 + schedule wheel; RECENT_LIVE_STREAMS demo embeds. Incomplete realtime client integration (migrations/policies/indexes ready for chat/polls; lib/live-polls has fetch; but no supabase.channel().on('postgres_changes') or subscribe logic surfaced in lib/ (components like LiveStage/LiveChat/LivePoll appear to rely on polling/fetch per prior UI greps + 'stub' comments). Error handling inconsistencies (bare catch/{} or console only in many places). Middleware + thin layers (middleware.ts empty NextResponse.next() with deprecation; dual-query fallbacks in articles/podcasts; hardcoded fallbacks everywhere; any casts). Script/maintainability gaps (apply-migrations.mjs misses 0012/0013; scripts duplicate .env parsing; seed-thecolony.ts mostly commented Drizzle; no CI/lint in package; scripts assume DIRECT_URL). Types + coupling (dupe Episode/Playable; contributor host ilike fallbacks vs FKs; deep links parse legacy 'perk'/'county'; no full chapters/transcript_url in all paths yet). Other: placeholder envs in clients; optional keys graceful only in spots; no usage/perk enforcement; RSS no per-item rate limit; semantic requires 0011 + embeddings (jobs/transcribe 'pending_pipeline')." },
  { title: "Docs / Alignment", text: "Some claims in UI_UX_DESIGN_SYSTEM.md not fully matching reality ('no repeats', 'build clean' but env/lock issues, 'every page elite' but inlines remain). Monitoring/Sentry not implemented (files absent per doc). PWA/TWA strategy partially in docs/manifest/sw but not code (icons, registration, offline). Legacy 'thecolony-ok' refs remain in some code/comments/docs (e.g. stripe, deep-links, agent-tools). Content depth weak vs LOCAL strategy (aspirational rural shows/partnerships/agentic only in docs; seed generic). Clips/forum 'implemented' claims in DS but only teasers/stubs. Some duplication in docs (phase7 tracks)." },
  { title: "Cross-Layer", text: "Remaining inline/raw/tailwind hacks affect perf/a11y/maintainability. Hub purity and repetition dilute 'purposeful sections only'. Stubs/TODOs block 'next level' features (clips, transcripts, gifts, personalization, rural depth). PWA/monitoring gaps vs own strategy docs. Some data models incomplete vs legacy (hosts M2M, gifts/perks/usage tables, county). Visual/execution polish incomplete on secondary pages (news, shows, system, vs)." }
];

weaknesses.forEach((w, i) => {
  const y = 1.3 + (i * 0.9);
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y, w: 0.12, h: 0.8, fill: { color: colors.alarm } });
  slide.addText(w.title, { x: 0.75, y: y, w: 8.75, h: 0.25, fontSize: 11, bold: true, color: colors.ink, fontFace: "Arial" });
  slide.addText(w.text, { x: 0.75, y: y + 0.25, w: 8.75, h: 0.6, fontSize: 9, color: colors.ink, fontFace: "Arial" });
});

// Missing/Failures slide
slide = pptx.addSlide();
slide.background = { color: colors.paper };
slide.addText("MISSING / FAILURES", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: colors.ink, fontFace: "Arial Black" });
slide.addText("Core Gaps • Blockers", { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 12, color: colors.alarm, fontFace: "Arial" });

const missing = [
  "Functional clips/member community (RICH spec: upload 30s video/audio TWA-friendly, auto-transcript, AI review/toxicity/best-of-n, approved embeds in comments/hub/live/pods, county forums, DB schema clip{user,ep_id,transcript,score,approved,tags}, moderation swarm, UI players — reality: only static ClipsTeaser + contributor apply text URLs + vs demo mock; no upload route/storage/forum).",
  "Transcripts integration (stub only; no UI panel in EpisodePlayer with search/seek/timestamps, no chapter auto, no SEO; jobs/transcribe 'pending'; semantic falls back).",
  "Gifts/perks/usage full (perk_grants table + migration; real redeem/hasPerkAccess (county/rural match) + logUsage (to Supabase usage/analytics); webhook grants; usage limits/enforcement + analytics table; align to legacy prisma + stripe stubs).",
  "Full PWA/TWA per own strategy (no icons dir (manifest 404s), no SW registration/install prompt (SiteClient returns null), sw.js no fetch/offline/background per doc, no assetlinks.json, no rural packs; manifest icons wrong jpeg + no purpose variety).",
  "Hub purity + repeats (full membership/masthead CTAs/grids leak on home + journalists; schedules duplicated). Violates 'home curated teasers only'.",
  "Local OK rural content depth (per LOCAL: seed 4 specific shows (Ag/Energy/Faith/Community) + hosts + partnerships + clip tags + agent aggregator + best-of-n Friday — aspirational/docs only; seed generic).",
  "Advanced personalization + forum (auth-gated member teasers/rail, 'your clips', agentic per docs; rich threaded comments/forum on per-ep/live/stories/contributor/vs; member-only; feeds hub/live/personalization/synth per RICH/ARCHITECTURE — only teasers + apply URLs).",
  "Technical completeness (no CSP, no next/font, no Sentry (files missing per MONITORING), limited realtime client, raw <img>, inline styles, middleware empty, apply-migrations incomplete, stubs in production paths).",
  "Some data models incomplete vs legacy (hosts/episode_hosts M2M, Gift/PerkGrant/UsageLog full, county on User/Host, mixed_content view).",
  "Apply-migrations misses files; scripts maintainability; error centralization + retries/backoff; tests/CI/lint enforcement."
];

missing.forEach((m, i) => {
  const y = 1.3 + (i * 0.55);
  slide.addText("• " + m, { x: 0.5, y: y, w: 9, h: 0.5, fontSize: 9, color: colors.ink, fontFace: "Arial" });
});

// Areas to Improve slide
slide = pptx.addSlide();
slide.background = { color: colors.paper };
slide.addText("AREAS TO IMPROVE (PRIORITIZED)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 26, bold: true, color: colors.ink, fontFace: "Arial Black" });
slide.addText("DS + PLAN ALIGNED", { x: 0.5, y: 0.85, w: 9, h: 0.35, fontSize: 11, color: colors.alarm, fontFace: "Arial" });

const improve = [
  { prio: "HIGH (1-4: A11y/Tokens/Style/Touch/Hub)", items: "Eliminate all inline styles + raw hex/tailwind hacks (target vs/blaze first, then shows/per-ep/system/home/components; replace with classes/tokens from variables/main.css). Update manifest to tokens. (Cites: 120+ style={{, multiple #hex.) Enforce zero-radius + consistent tokens (remove all borderRadius/rounded (including 50%/999px where not dot); audit circles for avatars (class or token); fix manifest/live.css blacks). Remove/reduce CTA/section repetition (make home purely teasers (replace full contrib-plan-grid + membership-cta with links + summary); extract shared MembershipCta / MastheadCta components; limit schedules to dedicated/live). A11y + touch hardening (enforce 44px+ on all (upgrade sm btns or add min, enlarge hamburger); add missing labels/aria to forms/players; global min-touch utility; full focus-visible on queue/demo elements). Image/performance consistency (convert remaining raw <img> (podcasts rail/grid, live slates) to next/image + explicit sizes/width/height/lazy; audit all StoryCard/series/episode images). Hub fidelity + visual hierarchy (strip full grids from home (keep curated + 'see dedicated'); standardize N°/SectionBlock across all; clean prose measure, mobile gaps). Design system enforcement + micro polish (remove all drift (vs/blaze tailwind + raw; shows/podcasts mix; live.css hard #000; demo reel investor code + '(AUTO)' + comments in LiveStage/YouTubeDemoReel (prod pollution)); extend badges/teasers/E-E-A-T uniformly; consistent motion guards; remove demo code)." },
  { prio: "MEDIUM (5-8: Layout/Typography/Animation/Forms/Nav)", items: "Complete functional ideas from stubs/teasers (clips upload/DB/moderation/embeds/forum per RICH; real transcripts + player integration + search/seek/SEO per lib; gifts/perks/usage full per stripe + legacy; advanced personalization (auth-gated rails/'your clips'); local rural content per LOCAL (seed specific shows + hosts + partnerships + tags + aggregator)). Finish PWA/TWA per strategy (icons dir + proper png/svg + maskable + screenshots; SW full registration + full fetch/offline cache + background sync + install prompt (expand SiteClient); assetlinks.json + bubblewrap for TWA; rural low-bandwidth packs per strategy/MOBILE doc). Fonts + CSP + Sentry (migrate to next/font; add CSP header/report-only; wire Sentry configs/instrumentation/releases per MONITORING + CI). Backend wiring (realtime postgres_changes in lib/components; full contributor approval flow; usage limits/enforcement; AI chapters; 24/7 real + Mux 247 production (remove DEMO)). Error/robustness (centralize error responses (e.g., error util); add retries/backoff (transcripts docstring mentions); better logging (replace dev consoles; consider Sentry); validate more (e.g., duration/urls in ingest); handle rate limits on RSS fetches). Code quality/debt (remove dual-query fallbacks in articles (rely on joins or fix RLS); update apply-migrations to include 0012/0013 (or make dynamic); add .env validation (e.g., at startup); extract constants (e.g., from RECENT_LIVE_STREAMS, fallbacks); enforce no `any` (logUsage); add tests (none visible); address middleware deprecation (rename to proxy or remove if unused)). SEO advanced (flesh out OG/twitter on every page (use generateMetadata where dynamic); strengthen JsonLd (typed schemas, Organization + more on home); add lastmod from actual data where possible; consider structured data for episodes/podcasts). Motion/perf (consistent; centralize presets more; add next/dynamic for heavy client islands (LiveStage, EpisodePlayer); profile framer usage; consider motion one package)." },
  { prio: "LOWER", items: "Uniformity (add light N° sections to search results (e.g. 'N°01 Results') and legal (as above); use SectionBlock everywhere possible; consistent 'N°XX · VOL' language; in shows series page, the 'Also on' and 'About' cards use .account-card (borrowed) — could be .info-card or similar in system). Data models (add more from prisma (e.g., explicit PerkGrant/Usage models if tables added; full Host/EpisodeHost M2M + county on Host for Layer 9 local OK per legacy); strengthen Episode chapters/transcript_url in all paths). Competitor (expand vs page (add Daily Wire/Newsmax tabs or sections); use badges/rails to claim FP/ProPublica ground more visibly; ensure local moat is *shown* not just described). Polish (add more mono datelines + '▼' eyebrows for heritage print fidelity; ensure all images have good alt (most do via media-map); add explicit focus-visible + enhanced a11y in system pages; use MotionReveal (already respects reduced) on key headers in search/news/advertise for polish (micro 120-220ms))." }
];

improve.forEach((imp, i) => {
  const y = 1.3 + (i * 1.6);
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y, w: 0.12, h: 1.4, fill: { color: colors.alarm } });
  slide.addText(imp.prio, { x: 0.75, y: y, w: 8.75, h: 0.3, fontSize: 11, bold: true, color: colors.ink, fontFace: "Arial" });
  slide.addText(imp.items, { x: 0.75, y: y + 0.3, w: 8.75, h: 1.1, fontSize: 9, color: colors.ink, fontFace: "Arial" });
});

// Features Add/Remove slide
slide = pptx.addSlide();
slide.background = { color: colors.paper };
slide.addText("FEATURES TO ADD / REMOVE (PRIORITIZED)", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: colors.ink, fontFace: "Arial Black" });
slide.addText("HIGH IMPACT • EFFORT ESTIMATES ASSUME PARALLEL SUBAGENTS + EXISTING FOUNDATION", { x: 0.5, y: 0.85, w: 9, h: 0.35, fontSize: 10, color: colors.alarm, fontFace: "Arial" });

const addHigh = [
  "Full member clips system (upload UI + API/storage/auth (TWA/mobile capture friendly); auto-transcript + AI review/toxicity/best-of-n scoring + moderation swarm; approved clips embed players in comments/hub/live/pods + county forums highlights; DB schema clip{user,ep_id,transcript,score,approved,tags[]}; feeds personalization/synth per RICH/ARCHITECTURE/COMPETITIVE. Enables continuous community vs Blaze weekly, rural tags, vs national. (Direct blocker per docs.))",
  "Real transcripts + AI pipeline (real provider (Whisper/Mux/OpenAI) in lib/jobs/transcribe + upsert to transcripts + content_embeddings; UI panel in EpisodePlayer (searchable, timestamped, seek, chapter-aligned); SEO JsonLd; cron ingest hook; 24/7 captioning stub; expose in search). Competitive vs Blaze full-ep; per lib/transcripts + 0011 + jobs.",
  "Gifts/perks/usage full (perk_grants table + migration; real redeemGift + hasPerkAccess (county/rural match) + logUsage (to Supabase usage/analytics); webhook grants on invoice; usage limits/enforcement + analytics table; align to legacy prisma + stripe stubs). For local OK moat + Layer 5/8.",
  "Full PWA/TWA (icons dir + crisp png/svg + maskable + screenshots in manifest; SW full registration + full fetch/offline cache + background sync + install prompt (expand SiteClient); assetlinks.json + bubblewrap for TWA; rural low-bandwidth/offline packs per strategy/MOBILE doc). Critical for rural OK users.",
  "Advanced personalization + forum (auth-gated member teasers/rail on home/live/pods ('your clips', local beat hints); agentic inserts per docs; rich threaded comments/forum on per-ep/live/stories/contributor/vs/blaze; member-only premium; agent tags/sentiment per RICH; basic or full moderation). Feeds hub/live.",
  "Local rural content depth (seed 4 specific shows per LOCAL (OK Ag Report weekly live/pods with OSU/Farm Bureau, Energy OK, Small Town Faith/Community, Rural Health/Econ; hosts + partnerships metadata; clip tags for ag/energy/faith; agent aggregator MVP + best-of-n Friday highlights + member clip pipeline). Fills 'rural/stories weak' gap vs national."
];

addHigh.forEach((f, i) => {
  const y = 1.2 + (i * 0.7);
  slide.addText("ADD HIGH: " + f, { x: 0.5, y: y, w: 9, h: 0.65, fontSize: 9, color: colors.ink, fontFace: "Arial" });
});

const removeHigh = [
  "All raw inline `style={{` and raw hex (non-token) — vs/blaze, shows, per-ep, system pages, home, components, live.css etc. (biggest visual/token violation + perf/a11y hit).",
  "Investor/demo reel code + '(AUTO)' labels + title tooltips from LiveStage.tsx (and YouTubeDemoReel if prod-only) + vs/blaze demo button + placeholder text. (Prod pollution.)",
  "Tailwind-like classes + `rounded` + non-token in vs/blaze (and any similar). (Complete break of brutalist/zero-radius.)",
  "Full membership-cta and masthead plan grids from home (and any repeated full blocks on hub). (Violates 'no repeats' + hub model; home should be teasers only.)",
  "Hardcoded `#000`/blacks and non-token colors (manifest, live.css, etc.).",
  "Duplicate schedule mocks/hardcoded fallbacks where real data exists (home).",
  "Any remaining `<img>` not justified (podcasts, live).",
  "Dupe 'Member Clips' teaser markup (standardize on ClipsTeaser component).",
  "Placeholder/demo data (RECENT_LIVE_STREAMS, JAKE_MERRICK_* hardcodes, COLONY_247 DEMO once real 247 live; ARTICLE_CONTRIBUTOR_FALLBACK once FKs solid).",
  "Non-functional shortcuts in manifest until assets exist.",
  "Empty SiteClient stub or expand it.",
  "Duplicate motion + framer-motion if one suffices.",
  "External font link once next/font lands.",
  "Middleware deprecation/empty if unused."
];

removeHigh.forEach((f, i) => {
  const y = 5.5 + (i * 0.35);
  slide.addText("REMOVE HIGH: " + f, { x: 0.5, y: y, w: 9, h: 0.32, fontSize: 8, color: colors.ink, fontFace: "Arial" });
});

// Roadmap slide
slide = pptx.addSlide();
slide.background = { color: colors.ink };
slide.addText("PHASED ROADMAP", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, bold: true, color: colors.paper, fontFace: "Arial Black" });
slide.addText("ACTIONABLE • TIED TO PRIOR PLAN + DS + 99 UX PRIORITIES", { x: 0.5, y: 0.85, w: 9, h: 0.35, fontSize: 11, color: colors.alarm, fontFace: "Arial" });

const roadmap = [
  { phase: "PHASE 1: QUICK WINS (DEBT + PURITY — 1-2 WEEKS)", text: "Purge all inline styles/raw/hex/tailwind (batch search_replace on vs/blaze, shows, per-ep, system, home, components; add ESLint rule for style= and hex). Enforce tokens (update manifest, live.css, etc.). Enforce zero-radius + consistent (remove borderRadius/rounded; fix manifest navy to token). Remove repeats from home + leaks (strip full masthead grid + membership-cta from home (pure teasers + links); contextualize hero CTA; clean journalists CTA per its comment; extract shared CTAs if needed; limit schedules to dedicated/live). A11y/touch (upgrade sm/hamburger to 44px+; add labels/aria everywhere; global min-touch; focus on custom). Image consistency (convert <img> to next/image; audit sizes/alt). Clean prod pollution (remove demo reel/(AUTO) from LiveStage + YouTubeDemoReel; vs demo button + placeholder). Standardize N°/SectionBlock + prose measure. Update UI_UX_DESIGN_SYSTEM.md claims to match reality (or complete the 'no repeats'/'every page elite')." },
  { phase: "PHASE 2: CORE FUNCTIONAL DEPTH (MOAT — 3-6 WEEKS)", text: "Full member clips (upload UI/API/storage/auth + auto-transcript + AI review/best-of-n/moderation + embeds in comments/hub/live/pods + county forums + DB + RLS + feeds personalization; per RICH/ARCHITECTURE. Start with basic upload + player, then moderation). Real transcripts (provider in lib/jobs/transcribe + upsert + EpisodePlayer panel (search/seek/timestamps) + SEO + cron hook + 24/7; per lib/transcripts + 0011). Advanced personalization (auth-gated member teasers/rail on home/live/pods ('your clips', local beat hints); agentic per docs). Local rural content (seed 4 specific shows per LOCAL (Ag/Energy/Faith/Community + hosts + partnerships + clip tags + agent aggregator MVP + best-of-n Friday); partnerships signals in UI). Gifts/perks/usage (perk_grants table + migration; real redeem/hasPerkAccess (county) + logUsage (Supabase) + webhook grants + limits/analytics; align legacy + stripe stubs). Realtime client (lib helpers + LiveStage/LiveChat using postgres_changes; optimistic). Clips in search + VideoObject; expanded vs (more competitors/interactive + real demo once backend)." },
  { phase: "PHASE 3: PLATFORM/INFRA POLISH (PWA / SENTRY / FONTS — 2-4 WEEKS)", text: "Full PWA (icons dir + assets + screenshots + maskable; SW registration + full fetch/offline + install prompt + background; assetlinks + bubblewrap; rural packs per strategy). next/font + CSP. Full Sentry (configs/instrumentation/CI per MONITORING). Polish secondary (news/shows/system/vs full token; system pages shells/tokens; more E-E-A-T (corrections log); focus enforcement). Error centralization + CI/tests (centralize errors; add retries/backoff; replace consoles with logger; remove dual fallbacks/hardcodes; update apply-migrations; add .env validation/CI/tests; align apply-migrations to all 13 files). SEO advanced (full OG/generateMetadata; stronger JsonLd; data-driven sitemap; clip schema). Backend (AI chapters; 24/7 real + Mux 247 production (remove DEMO); full contributor approval; hosts M2M + county; usage limits; CI workflows for build/lint/type/migration/Sentry; error centralization + retries)." },
  { phase: "PHASE 4: 'NEXT LEVEL' + VERIFY (ONGOING)", text: "Expand (forum threaded full; journalist portfolios clean; print/PDF exports; more rural partnerships UI; personalization dashboard hints; best-of-n curation admin UI). Full a11y/mobile/Lighthouse verification + subagent re-review. User sign-off on 'top-tier agency' + moat vs competitors. Maintain (update docs/plan with reality; remove legacy 'thecolony-ok' refs; align apply-migrations to all 13 files; add tests/CI/lint enforcement; monitor per doc)." }
];

roadmap.forEach((r, i) => {
  const y = 1.2 + (i * 1.05);
  slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: y, w: 0.1, h: 0.95, fill: { color: colors.alarm } });
  slide.addText(r.phase, { x: 0.7, y: y, w: 8.8, h: 0.25, fontSize: 10, bold: true, color: colors.paper, fontFace: "Arial" });
  slide.addText(r.text, { x: 0.7, y: y + 0.25, w: 8.8, h: 0.7, fontSize: 8, color: colors.paper, fontFace: "Arial" });
});

// Final slide
slide = pptx.addSlide();
slide.background = { color: colors.ink };
slide.addText("VERIFICATION & EVIDENCE", { x: 0.5, y: 1.2, w: 9, h: 0.6, fontSize: 24, bold: true, color: colors.paper, fontFace: "Arial Black" });
slide.addText("Build/lint clean (current is); full a11y/mobile test; subagent cross-review of this report; cite evidence throughout; user can use to decide next (implement Phase 1 immediately for visible 'elite' lift).", { x: 0.5, y: 1.9, w: 9, h: 1, fontSize: 12, color: colors.paper, fontFace: "Arial" });
slide.addText("EVIDENCE: Subagent outputs (UI/UX, Technical, Content, Backend) + direct reads/greps/build (clean) + docs (UI_UX execution notes, LOCAL/RICH/MOBILE/MONITORING/ARCHITECTURE/COMPETITIVE) + legacy source + competitor research. All paths absolute from D:\\1Projects\\thecolony-app.", { x: 0.5, y: 3.0, w: 9, h: 1, fontSize: 11, color: colors.paper, fontFace: "Arial" });
slide.addText("THE COLONY OK — BRUTALIST PATRIOTIC • UI-UX-PRO-MAX APPLIED • TOP-TIER AGENCY QUALITY", { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 11, color: colors.alarm, fontFace: "Arial" });

pptx.writeFile({ fileName: "docs/SITE_AUDIT_REPORT.pptx" })
  .then(() => console.log("SITE_AUDIT_REPORT.pptx created successfully."))
  .catch(err => console.error("PPTX error:", err));