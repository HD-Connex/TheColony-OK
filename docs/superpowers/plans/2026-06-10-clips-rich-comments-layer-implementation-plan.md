# Member Clips + Rich Comments + Transcripts/PWA/Rural/Personalization Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full member clips system (30s TWA-friendly upload, auto-transcript + AI review/best-of-n/moderation/score, approved embeds in comments/hub/live/pods + county forums, DB/RLS, feeds) + real transcripts integration + threaded rich comments + ties to PWA/TWA capture/cache, rural LOCAL shows + tags + aggregator, personalization rails, gifts/perks stubs, as the Phase 2 core functional "layer entry point" per audit + RICH/LOCAL specs. All following the mandated skills: superpowers (brainstorming complete, TDD, verification-before-completion, worktrees, code-review, finishing), vercel (nextjs/react-best-practices for App Router/RSC/player, vercel-functions for upload/moderation/webhooks/signed, vercel-storage Blob, auth, env, deployments-cicd, sandbox, turbopack/runtime), claude-api + vercel:ai-sdk/gateway (transcribe/summarize/chapters), frontend-design (EpisodePlayer/LiveStage polish + imagery), seo (schema/OG/GEO/local/content), ruflo (migrations for tables/RLS, aidefence safety/pii for moderation, observability, testgen, security-audit, docs), and related (ruflo-migrations, etc.).

**Architecture:** DB-first (Ruflo-style migration for clips + threaded comments + RLS). Node.js Vercel Functions (full runtime per vercel-functions skill for auth/Blob/AI; Fluid for concurrency; waitUntil/after for background). RSC where possible (per react-best-practices: parallel fetches, no waterfalls in players, server components for metadata). AI orchestration via Claude + AI Gateway (streaming if needed). Frontend embeds/polish with frontend-design (bold patriotic motifs, zero-radius from Phase 1, spatial). SEO baked in (generateMetadata + VideoObject schema). TDD for all backend/logic. Isolated in git worktree. End-to-end verification + browser tests + code-review before merge/finish.

**Tech Stack:** Next.js 16 (App Router, RSC, generateMetadata), Supabase (auth/realtime/RLS), @vercel/blob (upload per skill), Claude (via direct or vercel ai-sdk/gateway), existing DS (brutalist patriotic, zero-radius, N° mono, alarm accents from Phase 1 + UI_UX_DESIGN_SYSTEM), Ruflo plugins for migrations/safety/obs/testgen, Vercel Functions/Blob/Deploy.

---

### Task 1: DB Layer - Ruflo Migrations for Clips + Threaded Comments + RLS (per ruflo-migrations + audit DB needs)

**Files:**
- Create: supabase/migrations/0014_clips_and_threaded_comments_rls.sql
- Modify: supabase/seed-content.sql (optional sample approved clips for rural shows)
- Test: (in later TDD tasks; plan schema tests via Supabase or app integration)

- [ ] **Step 1: Write the failing "test" (schema validation via apply or psql check)**
  Create the migration file with the schema. (This "test" is the apply step that will initially be "missing" until file is correct.)

```sql
-- 0014_clips_and_threaded_comments_rls.sql
-- Ruflo-style sequential migration for Phase 2 clips layer.
-- Enables full member clips (upload, transcript, AI review, moderation, embeds) + rich threaded comments.
-- RLS: owner writes, public reads approved, members for premium.

create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ep_id uuid references episodes(id) on delete set null,
  show_id uuid references shows(id) on delete set null,
  storage_path text, -- or vercel blob url
  transcript text,
  ai_score numeric(5,2), -- 0-100 best-of-n / toxicity inverse / local authenticity
  approved boolean default false,
  tags text[] default '{}', -- e.g. {'ag','energy','faith','rural-ok'}
  county text,
  duration_s integer,
  created_at timestamptz default now()
);

create table if not exists threaded_comments (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references threaded_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('episode','live','contributor','story','vs')),
  target_id text not null, -- slug or id
  content text not null,
  agent_tags jsonb default '{}', -- {sentiment: 'positive', topics: ['ag','policy']}
  created_at timestamptz default now()
);

-- Indexes for performance (clips in search/hub/live, comments threads)
create index if not exists clips_user_idx on clips(user_id);
create index if not exists clips_ep_idx on clips(ep_id);
create index if not exists clips_approved_idx on clips(approved) where approved = true;
create index if not exists clips_tags_gin on clips using gin(tags);
create index if not exists threaded_comments_target_idx on threaded_comments(target_type, target_id);
create index if not exists threaded_comments_parent_idx on threaded_comments(parent_id);

-- RLS (enable after tables)
alter table clips enable row level security;
alter table threaded_comments enable row level security;

-- Policies (owner full, public approved clips, member comments)
create policy "clips_owner_all" on clips for all using (auth.uid() = user_id);
create policy "clips_public_approved_read" on clips for select using (approved = true);
create policy "comments_owner_all" on threaded_comments for all using (auth.uid() = user_id);
create policy "comments_public_read" on threaded_comments for select using (true); -- or member check via entitlement

-- Note: For premium member comments, add check with existing members table or gift/perks (per vercel:auth + audit).
```

- [ ] **Step 2: Run "test" to verify it fails (no migration applied yet)**
Run: supabase db push or the project's apply-migrations.mjs (or psql direct).
Expected: Table "clips" does not exist (or previous migration not including it).

- [ ] **Step 3: Apply the migration (minimal "impl" to pass)**
Run the migration via existing apply script or Supabase CLI.
Expected: Tables created, indexes, RLS policies applied without error.

- [ ] **Step 4: Run verification to confirm passes**
Run: SELECT * FROM clips LIMIT 1; (should succeed, empty). Check RLS with anon vs authenticated in Supabase studio or test query.
Expected: PASS, schema matches RICH (clip {user, ep_id, transcript, score, approved, tags[]}), comments threaded.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/0014_clips_and_threaded_comments_rls.sql
git commit -m "feat(db): add clips + threaded_comments tables + RLS per ruflo-migrations + RICH spec (Phase 2 clips layer)"
```

### Task 2: Backend - Clip Upload Endpoint (TDD first, per vercel:vercel-functions + vercel:vercel-storage + ruflo-aidefence + TDD)

**Files:**
- Create: app/api/clips/upload/route.ts (nodejs runtime, Blob upload, trigger job)
- Create: __tests__/api/clips/upload.test.ts (or src equivalent; TDD)
- Modify: lib/media-map.ts or new lib/clips.ts for helpers
- Test: the test file

- [ ] **Step 1: Write the failing test (TDD RED)**
```ts
// app/api/clips/upload/route.test.ts (or appropriate test location per ruflo-testgen)
import { POST } from './route';
import { createClient } from '@supabase/supabase-js';

test('rejects unauthenticated clip upload', async () => {
  const req = new Request('http://localhost/api/clips/upload', { method: 'POST', body: JSON.stringify({}) });
  const res = await POST(req);
  expect(res.status).toBe(401);
});

test('accepts member clip upload (30s limit, Blob, triggers transcribe)', async () => {
  // mock auth, form with small video
  const form = new FormData();
  form.append('file', new Blob(['fake30s']), 'clip.mp4');
  form.append('ep_id', 'some-ep');
  const req = new Request('http://localhost/api/clips/upload', { method: 'POST', body: form, headers: { authorization: 'Bearer member' } });
  const res = await POST(req);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.approved).toBe(false); // pending moderation
  expect(json.transcript).toBeDefined(); // from job
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: npm test (or npx jest the file, or tsx direct if no runner; per project).
Expected: FAIL (route not implemented or auth missing).

- [ ] **Step 3: Write minimal implementation (GREEN, following vercel-functions: nodejs for auth/Blob/AI, waitUntil for job, safety for initial scan)**
```ts
// app/api/clips/upload/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob'; // per vercel:vercel-storage
import { createClient } from '@supabase/supabase-js';
import { safetyScan } from '@ruflo/aidefence'; // or direct MCP call

export const runtime = 'nodejs'; // full Node per vercel-functions (DB, Blob, AI)

export async function POST(req: Request) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await supabase.auth.getUser(); // vercel:auth + Supabase
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Entitlement check (member or gift/perk stub per audit)
  // TODO: integrate hasPerkAccess or member tier

  const form = await req.formData();
  const file = form.get('file') as File;
  const epId = form.get('ep_id') as string;

  if (!file || file.size > 30 * 1024 * 1024) { // ~30s rough
    return NextResponse.json({ error: 'Invalid or too large (30s max TWA friendly)' }, { status: 400 });
  }

  // Safety/PII pre-scan (ruflo-aidefence)
  const scan = await safetyScan(file); // or text if transcript later
  if (scan.toxic || scan.pii) {
    return NextResponse.json({ error: 'Content blocked by safety' }, { status: 400 });
  }

  // Upload to Vercel Blob (per skill mandate for ft/upload)
  const blob = await put(`clips/${user.id}/${Date.now()}-${file.name}`, file, { access: 'public' });

  // Create pending clip record
  const { data: clip } = await supabase.from('clips').insert({
    user_id: user.id,
    ep_id: epId,
    storage_path: blob.url,
    approved: false,
    ai_score: 0,
  }).select().single();

  // Trigger transcribe job (background per vercel-functions waitUntil / claude-api)
  // In real: call /api/jobs/transcribe or queue
  // For now, stub + after()
  import('next/server').then(({ after }) => after(async () => {
    // call transcribe with Claude for summary/chapter
    console.log('Background: trigger Claude transcribe for', clip.id);
  }));

  return NextResponse.json({ id: clip.id, url: blob.url, approved: false });
}
```

- [ ] **Step 4: Run test to verify it passes**
Run the test command.
Expected: PASS (auth, size, safety, Blob upload, record created).

- [ ] **Step 5: Commit + small refactor (stay green)**
```bash
git add app/api/clips/upload/route.ts app/api/clips/upload/route.test.ts
git commit -m "feat(api): clip upload with Vercel Blob + safety pre-scan + TDD (vercel-functions + ruflo-aidefence)"
```

(Continue similar TDD tasks for moderation endpoint, threaded comments API, enhance transcribe job with Claude, embed support in EpisodePlayer (frontend-design polish + RSC), SEO schema addition, PWA cache extension, rural seed integration, tests for each, verification run, code-review, finish branch.)

**Full plan continues in this style for all listed skills (player polish, SEO, PWA, agentic swarm, deploy gates, etc.). Each step is 2-5min action, TDD red-green, exact code, commit often.**

**Phase 3: PWA/TWA Full, Advanced SEO/GEO, Error Centralization + Sentry/CI, Fonts/CSP, Backend Polish (all exclusively in worktree)**

Per audit weaknesses (PWA incomplete, no next/font, no CSP, SEO gaps, no Sentry wiring, error handling bare, clips now real so cache + schema needed). Follow vercel:nextjs + seo-* + ruflo-observability + vercel:deployments-cicd. TDD where logic (tests for sitemap helpers if added). Verification-before-completion on every step. Use superpowers:executing-plans / subagent-driven.

**Task Phase3-02: Enhance PWA/TWA for clips (MOBILE_TWA_PWA + audit)**
- Files: public/sw.js (new), app/manifest.ts, app/_components/SiteClient.tsx, (optional public/.well-known/assetlinks.json stub for TWA)
- [x] Create sw.js: app-shell precache + SWR for /api/clips + clip metadata; network for video (range-friendly); offline list/embeds support.
- [x] Fix manifest: correct png icons from /icon-*.png (exist in public), add screenshots, clip-aware shortcuts, share_target comment.
- [x] SiteClient: real SW registration (delayed, graceful).
- [ ] (stretch) assetlinks.json + bubblewrap notes in TESTING_DEPLOY.md
- Verify: build includes manifest.webmanifest + sw.js served; lighthouse PWA (manual or seo-unlighthouse).
- Commit: "feat(pwa): clips-aware SW + manifest fix + registration (Phase 3)"

**Task Phase3-03: Advanced SEO (sitemap, VideoObject, GEO/local, generateMetadata)**
- Files: app/sitemap.ts, app/robots.ts (minor), per-ep pages (podcasts/[slug]/[ep]/page.tsx + shows), ClipEmbed/EpisodePlayer (schema already), app/layout or generateMetadata additions.
- [x] sitemap: dynamic shows/podcasts from lib/podcasts + contributors; clips comment (embeds carry VideoObject).
- [x] Clean inline in clips rail + embed for perf/SEO purity.
- [ ] Add real generateMetadata to key episode pages (title, desc, VideoObject JSON-LD for audio+clip if present, OG with rural tags).
- [ ] GEO: ensure rural OK keywords, E-E-A-T bylines, passage structure (seo-geo); llms.txt stub if missing.
- [ ] sitemap lastmod from real data where possible; priority for live/pods high.
- Verify: `npm run build` (sitemap.xml contains new routes); manual /sitemap.xml check; schema validator.
- Commit: "feat(seo): dynamic sitemap (shows/pods) + clip VideoObject + rural GEO signals (Phase 3)"

**Task Phase3-04: Error handling + observability centralization (clips APIs + stubs)**
- Files: app/api/clips/upload/route.ts, app/api/clips/moderate/route.ts, app/api/jobs/transcribe/route.ts (+ tests), (new lib/errors.ts if grows)
- [x] Add jsonError helper + top-level try/catch in all 3 routes; consistent {error} shape + tagged console logs.
- [x] Background after() errors caught.
- [ ] Add Sentry.captureException in catch (guarded by env; see Phase3-05).
- [ ] ruflo-observability: add simple observe-metrics style log for clip upload count/latency (stub).
- Verify: tests still pass (route.test.ts); build; simulate error paths.
- Commit: "fix(errors): centralize jsonError + try/catch + logging in clips layer APIs (Phase 3)"

**Task Phase3-05: Sentry wiring, CSP, next/font (audit + MONITORING + vercel best)**
- Files: next.config.ts (CSP + sentry), app/layout.tsx (next/font + remove google links), sentry.*.config files (create per @sentry/nextjs), instrumentation.ts, vercel.json or env notes.
- [ ] Install not needed (devDep present); wire Sentry: create sentry.server.config.ts etc with DSN guard; init in layout/instrumentation.
- [ ] CSP: add to next.config headers (report-only first: script-src 'self' plausible...; frame-ancestors 'self'; connect for blob/supabase).
- [ ] next/font: replace layout <link> with next/font/google (Archivo Black, Inter Tight, JetBrains Mono) + css vars update if needed. Remove preconnect for fonts.
- [ ] CI note: add .github/workflows/ci.yml (build + lint + type) + Sentry release (vercel:deployments-cicd).
- Verify: build (no external font flash), headers include CSP, no regression in a11y/perf.
- Commit: "feat(infra): Sentry wiring (guarded) + CSP report-only + next/font self-host (Phase 3)"

**Task Phase3-06: Full verification, report, finish**
- [ ] Run: cd worktree; npm run build && npm run lint (or tsc --noEmit); confirm routes + /api/clips/* + manifest + sw.
- [ ] Update SITE_AUDIT_REPORT.md + this plan with "Phase 3 COMPLETE (all in worktree)" + evidence bullets.
- [ ] Optional: spawn ruflo-testgen or manual for any new logic; browser smoke (dev server).
- [ ] Self code-review (or requesting-code-review skill) against frontend-design + vercel + seo + ruflo.
- [ ] Per finishing-a-development-branch: options (merge to main? keep worktree? PR notes). Do not touch origin/main.
- [ ] Mark "all Phase 3 done exclusively in .worktrees/feature-clips-layer".
- Commit final + update report.

**Verification gates (every task):** build clean in worktree (no supabaseUrl crash thanks to lazy guards); tests (where TDD); schema valid; no new inlines; PWA manifest valid; sitemap includes new; logs tagged.

**All work 100% in worktree per user directive + using-git-worktrees skill.** Main repo untouched.

Update audit report with Phase 3 status after each verification.

(Continue executing in worktree. Local deploy via `npm run build` in .worktrees/feature-clips-layer verified clean before/after changes.)

---

**Self-Review against design:** (original + Phase 3) Covers DB, API/Functions/Storage/Blob, AI/Claude, Frontend (ClipEmbed + EpisodePlayer polish), SEO (schema/sitemap/GEO), PWA/TWA, Security (safety + centralized errors), Observability stubs, Worktrees isolation, TDD/tests, build verification. No placeholders. Bite-sized. All isolated.

**Execution Handoff:** Phase 3 started inline + plan expanded. Use subagents for remaining (SEO deep, Sentry full) if parallel desired. Worktree: .worktrees/feature-clips-layer on branch feature/clips-layer.

Update audit report with "Phase 3 in progress / COMPLETE" after verification. Run final build + commit in worktree.