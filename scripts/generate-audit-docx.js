const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "1A3358" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Arial", color: "0A1F3D" }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial", color: "EC1024" }, paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true, font: "Arial", color: "0A1F3D" }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "THE COLONY OK — SITE AUDIT REPORT", font: "Arial", size: 18, color: "0A1F3D" })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 })] })] })
    },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("THE COLONY OK")] }),
      new Paragraph({ children: [new TextRun({ text: "COMPREHENSIVE FULL-SITE AUDIT & PROGRESS REPORT", bold: true, size: 28 })] }),
      new Paragraph({ children: [new TextRun("Brutalist patriotic media platform — post ui-ux-pro-max overhaul assessment.")] }),
      new Paragraph({ children: [new TextRun("")] }),
      
      // STRENGTHS
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("STRENGTHS")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("UI/UX Layer")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Strong core tokens and brutalist patriotic identity (variables.css with ui-ux-pro-max comments, zero radius, navy/cream/alarm, N° sections, legacy fidelity).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hub model with explicit comments (home curated teasers + 'full depth on dedicated'; matches FP/ProPublica front-page inspiration).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("New/reused components: AuthorityBadge, ClipsTeaser, polished Paywall (token-driven, aria, no raw hex).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("A11y baseline (global focus-visible, skip, aria, reduced-motion). Dedicated pages purposeful/immersive (Live TV HUB, podcasts deep, journalists authority + badges, stories E-E-A-T).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("E-E-A-T + competitor signals (named + badges, work rails, clips vs Blaze, immersion). Visual hierarchy consistent where followed.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Technical / Frontend / Perf / Security / SEO / PWA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Security headers solid (HSTS preload, nosniff, SAMEORIGIN, restrictive Permissions-Policy in next.config).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Images mostly optimized (widespread next/image with sizes/lazy/remote for mux/supabase/yt; media-map centralized).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("SEO foundation (metadata + template, per-page canonicals/OG in most, dynamic sitemap, robots, JsonLd, preconnects).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Performance hybrid (ISR/SSG mix per artifacts; revalidate; container/grid CSS responsive). Motion + reduced-motion respect.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("PWA basics (manifest standalone + theme per strategy, sw push stub + deep link, crons in vercel.json). Build success.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Content / Features / IA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hub model executed (home curated teasers + N° sections + live embed + explicit comments; links to dedicated).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Dedicated differentiated (Live TV HUB + Channel Guide + ClipsTeaser; podcasts deep + per-ep immersion + chapters; journalists authority + badges; contributors tiers + work rails + E-E-A-T; stories immersion + Paywall; pricing/about pure).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Implemented ideas present (clips teasers, AuthorityBadge, E-E-A-T visuals, live polish, personalization hints via member teasers). Competitive signals (vs page + local moat vs Blaze; clips vs weekly; badges/immersion for FP/ProPublica).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Backend / Data / Integrations + Code Quality")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clean dual Supabase (admin/public) + central types (Show/Episode with video/chapters).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Solid RSS ingest + crons (full parse with video detection, idempotent, per-show errors, video podcasts support).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Payments/auth core (stripe + tier mapping, checkout/portal, webhook members sync + RLS, auth magic OTP + members poll, binary tiers).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Video/Mux + chapters + catalog (Mux client + signed tokens, resolveVideo multi-provider, chapters JSONB, Mux webhook, video_episodes/series RLS/indexes).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Search/semantic foundation (text ilike + semantic embeddings RPC + graceful fallback + transcript support). Migrations + RLS + scripts (13 SQL with comments/explain, apply-migrations with verification, seed idempotent, good indexes). Build/lint clean.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Docs / Strategy / Process + Competitor")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Rich docs (UI_UX_DESIGN_SYSTEM updated with execution notes + new components + 'post-plan' claims; LOCAL_OK rural; RICH clips/comments; MOBILE_TWA_PWA; MONITORING; ARCHITECTURE + COMPETITIVE_MATRIX moats/diffs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Competitor research integrated (FP community/excellence, ProPublica trust/depth, premium hubs immersion, front-page priority, vs Blaze local/continuous). Prior plan execution evidence (new components, hub comments, dedicated polish, design system fidelity). Legacy fidelity preserved.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Cross-Layer")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Build clean + hybrid rendering (SSG/ISR/dynamic per artifacts). Identity preserved (brutalist patriotic + rural OK moat). Partial 'next level' progress (badges, clips teasers, immersion, E-E-A-T, purposeful sections).")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // WEAKNESSES
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("WEAKNESSES")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("UI/UX")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Inline styles + raw hex proliferation (120+ hits; vs/blaze dozens + tailwind hacks + raw bg-[#8B0000] rounded + text-[10px]; shows hero/ep heavy inline; podcasts per-ep/home/live scattered; system pages; LiveStage demo, YouTubeDemoReel, EpisodePlayer, Watchlist/Checkout. Violates DS 'no inline/raw hex', 'semantic tokens only'.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Radius violations (50% dots, 999px, var(--radius-sm) where zero expected; vs/blaze rounded; manifest etc.). Breaks 'zero radius everywhere'.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Touch targets <44px (btn--sm in header/podcasts/search, hamburger 36px). Priority 2 violation.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("A11y gaps (sm/hamburger targets, incomplete form labels (Newsletter, players), focus on queue/demo, occasional missing alt/context, no min-height enforcement).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Repetition of CTAs/sections (full membership-cta duplicated home + pricing with inline override; 'Join the Masthead' + contrib-plan-grid on home + contributors/join + journalists leak + vs; schedules duplicated home/live + mocks; clips teaser variants repeated). Violates 'no repeats', 'home owns hub value, pricing owns conversion'.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hub leaks + visual hierarchy inconsistencies (home near-full masthead tiers + membership features; some pages inline flex vs classes; <img> leakage; hero bg not next/image; prose not 65ch capped).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Design system drift (vs/blaze complete break with tailwind + raw; shows/podcasts mix naming; live.css hard #000; demo reel investor code + '(AUTO)' + comments in LiveStage/YouTubeDemoReel (prod pollution); manifest navy drift).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Motion/micro inconsistent (some always-on whileHover; dev notes visible; badges/teasers/E-E-A-T not uniform across news/shows).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Missing uniformity (N° skips on home/pricing; <img> vs next/image; prose measure; E-E-A-T lighter on news lists).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Technical / Frontend / Perf / Security / SEO / PWA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Fonts external (layout preconnect + Google CSS; no next/font for self-host/optimization/swap/LS elimination). Variables map but external load.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("PWA incomplete vs strategy (manifest icons all logo.jpg wrong format/sizes/purpose; shortcuts reference non-existent /assets/icons/*.png 404; 'icons' in public is SVG file not dir; no screenshots; no SW registration/install prompt (SiteClient returns null); sw.js minimal stub only (no fetch/offline cache per MOBILE_TWA_PWA, no background sync); no assetlinks.json for TWA; no rural low-bandwidth/offline packs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Raw <img> leakage + inconsistent optimization (podcasts/page + PodcastSearchGrid, live off-air use plain img; some Image lack explicit alt/sizes; hero CSS bg-image for LCP).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Inline styles & system pages a11y/perf gaps (error/loading/not-found + scattered use large style={{flex/gap/padding/fontFamily}} blocks; affect render, harder purge, inconsistent with CSS var system; system pages have aria but minimal focus/reduced-motion, raw styles).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Limited/no advanced security (no CSP in next.config or middleware (legacy HTML had one); middleware empty pass-through; no COOP/COEP or stricter).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Motion/Perf (framer + 'motion' both in deps (dupe); heavy client in LiveStage; no next/dynamic or Suspense beyond loading; scroll-behavior smooth minor hit).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("SEO gaps (not every page full OG/Twitter (news/search/some legal minimal); JsonLd basic/unsafe; sitemap contributor fetch can fail silently; no hreflang/advanced on all).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Other: Duplicate motion package; @sentry/nextjs in devDeps but no configs/instrumentation (contradicts MONITORING.md); no eslintConfig; plausible defer but not fully Next-optimized; limited realtime client wiring.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Content / Features / IA")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Repetition of membership CTAs/grids on hub (home hero CTA + full contrib-plan-grid N°06 + full membership-cta N°07 with identical perks; journalists leaks 'Join the Masthead' + tier examples despite comment; home live schedule hardcoded fallbacks; footer always 'Join $4.99' + 'Masthead'; membership page upsell repeats pricing).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips/community elevation surface-only/teaser-only (ClipsTeaser static count/desc/pricing link repeated; vs page demo mock + hardcoded raw button; contributor apply text URLs only — no functional member clips upload/embed/forum/moderation per RICH spec).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Inconsistent/purposeful-section drift (home numbering skips N°05; some pages rely on inline flex instead of classes; dupe 'Member Clips' teaser markup).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Data/content thin vs ambition (articles/contributors use fallbacks; no deep rural OK content matching LOCAL strategy (generic shows only); transcripts/search partial; no full forum/clip pages).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Other leaks (vs/blaze has one non-token button + placeholder text; membership page features list repeats pricing).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Backend / Data / Integrations + Code Quality")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Heavy legacy port stubs + TODO debt (lib/stripe.ts: 4x stubs (gifts, hasPerkAccess always-true, logUsage, handleEvent) + TODOs for Supabase members/perk_grants/usage/county + 'always true' placeholder; PRICING fallbacks; transcripts.ts: pure stub generator (demo segments, confidence 0, provider 'stub') + multiple TODOs for real impl/ingest/EpisodePlayer/24/7; viewer.ts stub localStorage (DB table exists but unused in lib; progress API exists separately); live-247.ts + video.ts placeholders/DEMO_247_MP4 + schedule wheel; RECENT_LIVE_STREAMS demo embeds).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Incomplete realtime client integration (migrations + policies + indexes + comments (0004/0005) for live_chat_messages/live_polls/live_poll_votes + postgres_changes; lib/live-polls has server + client fetch wrappers; but no supabase.channel().on('postgres_changes') or subscribe logic surfaced in lib/ (components like LiveStage/LiveChat/LivePoll appear to rely on polling/fetch per prior UI greps + 'stub' comments). live-events.ts bundles for 'realtime or direct queries'.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Error handling inconsistencies (many bare catch (err) { ... } or catch {} (rss-ingest per-show reporting is good; auth-client, live-247, semantic-search, contributors article join, progress/watchlist just swallow or return message); some console.error only in apply; no centralized error logger/Sentry (devDep only).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Middleware + thin layers (middleware.ts is literally 'return NextResponse.next();' (no auth, redirects, etc.; deprecation warning in build); no inline SQL but several fallback/dual-query patterns (articles.ts joined vs. plain on error; podcasts getEpisodeBy* tries slug then id); hardcoded fallbacks (ARTICLE_CONTRIBUTOR_FALLBACK, JAKE_MERRICK_* IDs/URLs, COLONY_247 schedule, RECENT_LIVE_STREAMS with YouTube links, media-map.ts); any in stripe logUsage + a few casts).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Script/maintainability gaps (apply-migrations.mjs MIGRATION_FILES lists only 11 (0001 + 0003-0011); 0012_contributor_applications.sql + 0013_contributors_table.sql exist on disk (and are used by apply route + seed) but skipped; scripts duplicate .env.local parsing (no dotenv); seed-thecolony.ts is mostly commented Drizzle reference (not wired); no CI/lint in package (just 'next lint'); scripts assume DIRECT_URL).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Types + coupling (good central types but some duplication (Episode vs. PlayableEpisode/RecentEpisode); Contributor episodes/videos/lives use string host ilike fallbacks (comment notes missing FKs: 'suggest adding host_id/appearance FKs'); articles.ts contributor join fallback map; deep links parse 'perk'/'county' (legacy); no full Episode chapters or transcript_url in all paths yet).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Other: Placeholder envs in clients (build-time); OpenAI/Mux/Stripe optional but graceful only in spots; no usage/perk enforcement in hasPerkAccess; RSS max 120s but no per-item rate limiting; Semantic requires 0011 applied + embeddings populated (jobs/transcribe route explicitly returns 'pending_pipeline').")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Docs / Strategy / Process + Competitor Alignment")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Some claims in UI_UX_DESIGN_SYSTEM.md not fully matching reality ('no repeats', 'build clean' but env/lock issues, 'every page elite' but inlines remain).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Monitoring/Sentry not implemented (files absent per doc).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("PWA/TWA strategy partially in docs/manifest/sw but not code (icons, registration, offline).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Legacy 'thecolony-ok' refs remain in some code/comments/docs (e.g. stripe, deep-links, agent-tools).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Content depth weak vs LOCAL strategy (aspirational rural shows/partnerships/agentic only in docs; seed generic).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips/forum 'implemented' claims in DS but only teasers/stubs.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Some duplication in docs (phase7 tracks).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Cross-Layer")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Remaining inline/raw/tailwind hacks affect perf/a11y/maintainability.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hub purity and repetition dilute 'purposeful sections only'.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Stubs/TODOs block 'next level' features (clips, transcripts, gifts, personalization, rural depth).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("PWA/monitoring gaps vs own strategy docs.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Some data models incomplete vs legacy (hosts M2M, gifts/perks/usage tables, county).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Visual/execution polish incomplete on secondary pages (news, shows, system, vs).")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // MISSING / FAILURES
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("MISSING / FAILURES")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("UI/UX")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Functional clips/member community (RICH spec: upload 30s video/audio TWA-friendly, auto-transcript, AI review/toxicity/best-of-n, approved embeds in comments/hub/live/pods, county forums, DB schema clip{user,ep_id,transcript,score,approved,tags}, moderation swarm, UI players — reality: only static ClipsTeaser + contributor apply text URLs + vs demo mock; no upload route/storage/forum).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Transcripts integration (stub only; no UI panel in EpisodePlayer with search/seek/timestamps, no chapter auto, no SEO; jobs/transcribe 'pending'; semantic falls back).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Advanced personalization ('My Colony' rails, 'your clips in briefing', agentic inserts per ARCHITECTURE).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full hub purity + no repeats (membership/masthead CTAs/grids leak on home + journalists; schedules duplicated).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("A11y/touch completeness (form labels incomplete, 44px on sm/hamburger, focus on custom elements, system pages raw).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Design system enforcement (inlines/raw/radius drift everywhere; vs/blaze full break; demo pollution in prod).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Uniformity (N° skips, <img> vs next/image, prose measure, E-E-A-T lighter on some lists).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Technical")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full PWA/TWA per own strategy (no icons dir (manifest 404s), no SW registration/install prompt (SiteClient returns null), sw.js no fetch/offline/background per doc, no assetlinks.json, no rural packs; manifest icons wrong jpeg + no purpose variety).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("next/font + CSP (external fonts; no CSP in config/middleware).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Sentry/monitoring (configs/instrumentation absent per MONITORING.md).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Image consistency (raw <img> in podcasts/live; some missing sizes/alt).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Realtime client wiring (DB ready, app limited).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Advanced SEO (full OG everywhere, hreflang, advanced schema on all).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Perf (external fonts, inline styles, dupe motion, heavy framer, no dynamic for islands).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Content / Features")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full clips DB/UI + forum (per RICH: upload, moderation, embeds, threaded comments on per-ep/live/stories/contributor/vs; member-only; feeds hub/live/personalization/synth — only teasers + apply URLs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Transcripts + AI pipeline full (real provider, player integration, search/seek, SEO, chapter auto; per lib + jobs + 0011).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Advanced personalization (auth-gated member teasers/rail, 'your clips', agentic per docs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Journalist portfolios full + clean separation (deeper mixed-work hub on /journalists without repeating masthead grid; portfolio export/SEO).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Local OK rural content depth (per LOCAL: seed 4 specific shows (Ag/Energy/Faith/Community) + hosts + partnerships + clip tags + agent aggregator + best-of-n Friday — aspirational/docs only; seed generic).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips in search + structured data (VideoObject for clips).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Expanded vs (more competitors or interactive; real clip demo once backend).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Forum/community threaded surfaces (basic or rich per spec).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Backend")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Gifts/perks/usage full (perk_grants table + migration; real redeem/hasPerkAccess (county/rural match) + logUsage (to Supabase usage/analytics); webhook grants; usage limits/enforcement + analytics table; align to legacy prisma + stripe stubs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Real transcripts (Whisper/Mux/OpenAI impl + upsert + EpisodePlayer hook + cron ingest + 24/7 captioning per lib/transcripts + jobs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Member clips DB + UI (dedicated table or type; rich comments integration; upload + player per RICH/ARCHITECTURE).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Realtime client subscriptions (lib helpers + LiveStage/LiveChat using postgres_changes; optimistic UI).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("AI chapters from transcripts (auto on generate).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full contributor approval (admin route promote application → contributors row + activation).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hosts M2M + county (for deeper local OK + knowledge graph per legacy).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("24/7 real ingest/captioning + Mux 247 production (remove DEMO/placeholders; use scripts).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Usage limits/enforcement + full analytics table.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CI (github workflows for build/lint/type/migration check + Sentry release); better monitoring (Sentry per doc).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Other")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CSP, next/font, full Sentry, TWA verification, rural offline packs.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Some data models incomplete vs legacy (hosts/episode_hosts M2M, Gift/PerkGrant/UsageLog full, county on User/Host, mixed_content view).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Apply-migrations misses files; scripts maintainability.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Error centralization + retries/backoff.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Tests/CI/lint enforcement.")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // AREAS TO IMPROVE
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("AREAS TO IMPROVE (PRIORITIZED)")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("High (Priority 1-4: A11y, Tokens, Style, Touch, Hub Fidelity)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Eliminate all inline styles + raw hex/tailwind hacks (target vs/blaze first, then shows/per-ep/system/home/components; replace with classes/tokens from variables/main.css). Update manifest to tokens. (Cites: 120+ style={{, multiple #hex.)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Enforce zero-radius + consistent tokens (remove all borderRadius/rounded (including 50%/999px where not dot); audit circles for avatars (class or token); fix manifest/live.css blacks).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Remove/reduce CTA/section repetition (hub model + anti): Make home purely teasers (replace full contrib-plan-grid + membership-cta with links + summary); extract shared MembershipCta / MastheadCta components; limit schedules to dedicated/live.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("A11y + touch hardening (priority 1/2): Enforce 44px+ on all (upgrade sm btns or add min, enlarge hamburger); add missing labels/aria to forms/players; global min-touch utility; full focus-visible on queue/demo elements.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Image/performance consistency (priority 3): Convert remaining raw <img> (podcasts rail/grid, live slates) to next/image + explicit sizes/width/height/lazy; audit all StoryCard/series/episode images.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hub fidelity + visual hierarchy (priority 5/8/9): Strip full grids from home (keep curated + 'see dedicated'); standardize N°/SectionBlock across all; clean prose measure, mobile gaps.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Design system enforcement + micro polish (priority 4/anti + 7): Remove all drift (vs/blaze tailwind + raw; shows/podcasts mix; live.css hard #000; demo reel investor code + '(AUTO)' + comments in LiveStage/YouTubeDemoReel (prod pollution)); extend badges/teasers/E-E-A-T uniformly; consistent motion guards; remove demo code.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Medium (Priority 5-8: Layout, Typography, Animation, Forms, Nav)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Complete functional ideas from stubs/teasers (clips upload/DB/moderation/embeds/forum per RICH; real transcripts + player integration + search/seek/SEO per lib; gifts/perks/usage full per stripe + legacy; advanced personalization (auth-gated rails/'your clips'); local rural content per LOCAL (seed specific shows + hosts + partnerships + tags + aggregator)).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Finish PWA/TWA per strategy (icons dir + proper png/svg + maskable + screenshots; SW full registration + full fetch/offline cache + background sync + install prompt (expand SiteClient); assetlinks.json + bubblewrap for TWA; rural low-bandwidth packs per strategy/MOBILE doc).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Fonts + CSP + Sentry (migrate to next/font; add CSP header/report-only; wire Sentry configs/instrumentation/releases per MONITORING + CI).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Backend wiring (realtime postgres_changes in lib/components; full contributor approval flow; usage limits/enforcement; AI chapters; 24/7 real + Mux 247 production (remove DEMO)).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Error/robustness (centralize error responses (e.g., error util); add retries/backoff (transcripts docstring mentions); better logging (replace dev consoles; consider Sentry); validate more (e.g., duration/urls in ingest); handle rate limits on RSS fetches).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Code quality/debt (remove dual-query fallbacks in articles (rely on joins or fix RLS); update apply-migrations to include 0012/0013 (or make dynamic); add .env validation (e.g., at startup); extract constants (e.g., from RECENT_LIVE_STREAMS, fallbacks); enforce no `any` (logUsage); add tests (none visible); address middleware deprecation (rename to proxy or remove if unused)).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("SEO advanced (flesh out OG/twitter on every page (use generateMetadata where dynamic); strengthen JsonLd (typed schemas, Organization + more on home); add lastmod from actual data where possible; consider structured data for episodes/podcasts).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Motion/perf (consistent; centralize presets more; add next/dynamic for heavy client islands (LiveStage, EpisodePlayer); profile framer usage; consider motion one package).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Lower")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Uniformity (add light N° sections to search results (e.g. 'N°01 Results') and legal (as above); use SectionBlock everywhere possible; consistent 'N°XX · VOL' language; in shows series page, the 'Also on' and 'About' cards use .account-card (borrowed) — could be .info-card or similar in system).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Data models (add more from prisma (e.g., explicit PerkGrant/Usage models if tables added; full Host/EpisodeHost M2M + county on Host for Layer 9 local OK per legacy); strengthen Episode chapters/transcript_url in all paths).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Competitor (expand vs page (add Daily Wire/Newsmax tabs or sections); use badges/rails to claim FP/ProPublica ground more visibly; ensure local moat is *shown* not just described).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Polish (add more mono datelines + '▼' eyebrows for heritage print fidelity; ensure all images have good alt (most do via media-map); add explicit focus-visible + enhanced a11y in system pages; use MotionReveal (already respects reduced) on key headers in search/news/advertise for polish (micro 120-220ms)).")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // FEATURES TO ADD/REMOVE
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("FEATURES TO ADD / REMOVE")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Add (High Priority — Core Blockers per Plan/Docs/Competitors; High Impact on 'Next Level'/Moat)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full member clips system (upload UI + API/storage/auth (TWA/mobile capture friendly); auto-transcript + AI review/toxicity/best-of-n scoring + moderation swarm; approved clips embed players in comments/hub/live/pods + county forums highlights; DB schema clip{user,ep_id,transcript,score,approved,tags[]}; feeds personalization/synth per RICH/ARCHITECTURE/COMPETITIVE. Enables continuous community vs Blaze weekly, rural tags, vs national. (Direct blocker per docs.)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Real transcripts + AI pipeline (real provider (Whisper/Mux/OpenAI) in lib/jobs/transcribe + upsert to transcripts + content_embeddings; UI panel in EpisodePlayer (searchable, timestamped, seek, chapter-aligned); SEO JsonLd; cron ingest hook; 24/7 captioning stub; expose in search). Competitive vs Blaze full-ep; per lib/transcripts + 0011 + jobs.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Gifts/perks/usage full (perk_grants table + migration; real redeemGift + hasPerkAccess (county/rural match) + logUsage (to Supabase usage/analytics); webhook grants on invoice; usage limits/enforcement + analytics table; align to legacy prisma + stripe stubs). For local OK moat + Layer 5/8.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full PWA/TWA (icons dir + crisp png/svg + maskable + screenshots in manifest; SW full registration + full fetch/offline cache + background sync + install prompt (expand SiteClient); assetlinks.json + bubblewrap for TWA; rural low-bandwidth/offline packs per strategy/MOBILE doc). Critical for rural OK users.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Rich threaded comments + forum surfaces (on per-ep/live/stories/contributor/vs/blaze; member-only premium; agent tags/sentiment per RICH; basic or full moderation). Feeds hub/live.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Advanced personalization (auth-gated member teasers/rail on home/live/pods ('your clips', local beat hints); agentic inserts per docs; 'My Colony' dashboard hints). Per ARCHITECTURE Layer 11/14.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Local rural content depth (seed 4 specific shows per LOCAL (OK Ag Report weekly live/pods with OSU/Farm Bureau, Energy OK, Small Town Faith/Community, Rural Health/Econ; hosts + partnerships metadata; clip tags for ag/energy/faith; agent aggregator MVP + best-of-n Friday highlights + member clip pipeline). Fills 'rural/stories weak' gap vs national.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Add (Medium Priority)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Journalist full portfolios + clean separation (deeper mixed-work hub on /journalists without repeating masthead grid; portfolio export/SEO; full authority focus).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips in search + structured data (VideoObject for clips; best-of-n curation admin UI).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Expanded vs (more competitors (Daily Wire/Newsmax) or interactive matrix; real clip demo once backend).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("AI chapters from transcripts (auto on generate; integrate to player/rail).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full contributor approval workflow (admin route to promote application → contributors row + activation).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hosts M2M + county (for deeper local OK + knowledge graph per legacy).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("24/7 real ingest/captioning + Mux 247 production (remove DEMO/placeholders; use scripts).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Usage limits/enforcement + full analytics.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CI/github workflows (build/lint/type/migration check + Sentry release); better monitoring (Sentry per doc).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("CSP header + next/font migration + full Sentry wiring.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Focus enforcement + system page polish (use shells/tokens; keyboard/focus/reduced-motion).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("More E-E-A-T (explicit corrections log page/link; source count).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips/forum basic threaded (even before full).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Add (Low Priority)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Offline/PWA clip cache + TWA capture.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Expanded rural partnerships signals in UI.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Print/PDF story exports for members.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("More competitor tabs in vs.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Remove (High Priority — Debt, Drift, Repetition; High Impact on Maintainability/Purity)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("All raw inline `style={{` and raw hex (non-token) — vs/blaze, shows, per-ep, system pages, home, components, live.css etc. (biggest visual/token violation + perf/a11y hit).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Investor/demo reel code + '(AUTO)' labels + title tooltips from LiveStage.tsx (and YouTubeDemoReel if prod-only) + vs/blaze demo button + placeholder text. (Prod pollution.)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Tailwind-like classes + `rounded` + non-token in vs/blaze (and any similar). (Complete break of brutalist/zero-radius.)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full membership-cta and masthead plan grids from home (and any repeated full blocks on hub). (Violates 'no repeats' + hub model; home should be teasers only.)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hardcoded `#000`/blacks and non-token colors (manifest, live.css, etc.).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Duplicate schedule mocks/hardcoded fallbacks where real data exists (home).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Any remaining `<img>` not justified (podcasts, live).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Dupe 'Member Clips' teaser markup (standardize on ClipsTeaser component).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Placeholder/demo data (RECENT_LIVE_STREAMS, JAKE_MERRICK_* hardcodes, COLONY_247 DEMO once real 247 live; ARTICLE_CONTRIBUTOR_FALLBACK once FKs solid).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Non-functional shortcuts in manifest until assets exist.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Empty SiteClient stub or expand it.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Duplicate motion + framer-motion if one suffices.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("External font link once next/font lands.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Middleware deprecation/empty if unused.")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Remove (Medium/Low Priority)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Minor numbering gaps (home skips N°05; standardize).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Redundant crons (ingest-rss vs poll-feeds identical).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Commented Drizzle/legacy seed code in seed-thecolony.ts (or finish).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Hardcoded fallbacks in general (JAKE, RECENT, etc. once real data).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Any remaining non-token or drift.")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // RECOMMENDATIONS
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("RECOMMENDATIONS & PHASED ROADMAP")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Phase 1: Quick Wins (Debt + Purity — 1-2 weeks, high impact on 'elite agency' feel)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Purge all inline styles/raw/hex/tailwind (batch search_replace on vs/blaze, shows, per-ep, system, home, components; add ESLint rule for style= and hex). Enforce tokens (update manifest, live.css, etc.).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Enforce zero-radius + consistent (remove borderRadius/rounded; fix manifest navy to token).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Remove repeats from home + leaks (strip full masthead grid + membership-cta from home (pure teasers + links); contextualize hero CTA; clean journalists CTA per its comment; extract shared CTAs if needed; limit schedules to dedicated/live).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("A11y/touch (upgrade sm/hamburger to 44px+; add labels/aria everywhere; global min-touch; focus on custom).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Image consistency (convert <img> to next/image; audit sizes/alt).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clean prod pollution (remove demo reel/(AUTO) from LiveStage + YouTubeDemoReel; vs demo button + placeholder).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Standardize N°/SectionBlock + prose measure.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Update UI_UX_DESIGN_SYSTEM.md claims to match reality (or complete the 'no repeats'/'every page elite').")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Phase 2: Core Functional Depth (Moat — 3-6 weeks, high competitive moat)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full member clips (upload UI/API/storage/auth + auto-transcript + AI review/best-of-n/moderation + embeds in comments/hub/live/pods + county forums + DB + RLS + feeds personalization; per RICH/ARCHITECTURE. Start with basic upload + player, then moderation).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Real transcripts (provider in lib/jobs/transcribe + upsert + EpisodePlayer panel (search/seek/timestamps) + SEO + cron hook + 24/7; per lib/transcripts + 0011).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Advanced personalization (auth-gated member teasers/rail on home/live/pods ('your clips', local beat hints); agentic per docs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Local rural content (seed 4 specific shows per LOCAL (Ag/Energy/Faith/Community + hosts + partnerships + clip tags + agent aggregator MVP + best-of-n Friday); partnerships signals in UI).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Gifts/perks/usage (perk_grants table + migration; real redeem/hasPerkAccess (county) + logUsage (Supabase) + webhook grants + limits/analytics; align legacy + stripe stubs).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Realtime client (lib helpers + LiveStage/LiveChat using postgres_changes; optimistic).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Clips in search + VideoObject; expanded vs (more competitors/interactive + real demo once backend).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Phase 3: Platform/Infra Polish (PWA / Sentry / Fonts — 2-4 weeks)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full PWA (icons dir + assets + screenshots + maskable; SW registration + full fetch/offline + install prompt + background; assetlinks + bubblewrap; rural packs per strategy).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("next/font + CSP.")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Full Sentry (configs/instrumentation/CI per MONITORING).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Polish secondary (news/shows/system/vs full token; system pages shells/tokens; more E-E-A-T (corrections log); focus enforcement).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Error centralization + CI/tests (centralize errors; add retries/backoff; replace consoles with logger; remove dual fallbacks/hardcodes; update apply-migrations; add .env validation/CI/tests; align apply-migrations to all 13 files).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("SEO advanced (full OG/generateMetadata; stronger JsonLd; data-driven sitemap; clip schema).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Backend (AI chapters; 24/7 real + Mux 247 production (remove DEMO); full contributor approval; hosts M2M + county; usage limits; CI workflows for build/lint/type/migration/Sentry; error centralization + retries).")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Phase 4: 'Next Level' + Verify (Ongoing)")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Expand (forum threaded full; journalist portfolios clean; print/PDF exports; more rural partnerships UI; personalization dashboard hints; best-of-n curation admin UI).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Verify (full a11y pass + reduced-motion + touch testing (leverage reset); mobile Lighthouse + 375 viewport; build/CI gates; subagent re-review; user sign-off on 'top-tier agency' + moat vs competitors).")] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun("Maintain (update docs/plan with reality; remove legacy 'thecolony-ok' refs; align apply-migrations to all 13 files; add tests/CI/lint enforcement; monitor per doc).")] }),
      
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Prioritization Rationale", bold: true })] }),
      new Paragraph({ children: [new TextRun("High = fidelity to UI_UX plan + 'elite agency' (tokens/radius/hub purity/inlines/a11y) + competitive moat (clips/rural/transcripts/PWA/personalization vs Blaze/FP/ProPublica). Medium = platform completeness (PWA/Sentry/fonts per own docs). Low = polish/expansion. Ties directly to 99 UX priorities (a11y/touch first), DS anti-patterns, and 'features to add/remove' from subagents. Effort estimates assume parallel subagents + existing foundation (build clean, partial polish already).")] }),
      
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Verification", bold: true })] }),
      new Paragraph({ children: [new TextRun("Build/lint clean (current is); full a11y/mobile test; subagent cross-review of this report; cite evidence throughout; user can use to decide next (implement Phase 1 immediately for visible 'elite' lift).")] }),
      
      new Paragraph({ children: [new TextRun("")] }),
      new Paragraph({ children: [new TextRun({ text: "Evidence", bold: true })] }),
      new Paragraph({ children: [new TextRun("Subagent outputs (UI/UX, Technical, Content, Backend) + direct reads/greps/build (clean) + docs (UI_UX execution notes, LOCAL/RICH/MOBILE/MONITORING/ARCHITECTURE/COMPETITIVE) + legacy source + competitor research. All paths absolute from D:\\1Projects\\thecolony-app.")] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("docs/SITE_AUDIT_REPORT.docx", buffer);
  console.log("SITE_AUDIT_REPORT.docx created successfully.");
});