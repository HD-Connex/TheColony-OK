-- Phase 1 1.2: Topics feature
-- topics table + article_topics join table (many-to-many tagging for articles).
-- Idempotent: IF NOT EXISTS + DROP POLICY IF EXISTS for safe re-runs.
-- Public read RLS (like counties, categories). Writes via admin/future CMS only.
-- Falls back gracefully; content breadth via seed categories/counties in lib.

-- Topics (canonical list; slugs for URLs)
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int default 100,
  created_at timestamptz default now()
);

-- Join: link articles to one or more topics (extends single category/county on articles)
create table if not exists public.article_topics (
  article_id uuid not null references public.articles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (article_id, topic_id)
);

-- Indexes for common queries (list topics, articles by topic, reverse lookup)
create index if not exists topics_slug_idx on public.topics (slug);
create index if not exists article_topics_topic_idx on public.article_topics (topic_id);
create index if not exists article_topics_article_idx on public.article_topics (article_id);

-- RLS: public read for discovery/browsing (anyone can list topics and see which articles tagged)
alter table public.topics enable row level security;
alter table public.article_topics enable row level security;

-- Idempotent policy drops (prevents duplicate policy errors on re-apply)
DROP POLICY IF EXISTS "topics_public_read" ON public.topics;
DROP POLICY IF EXISTS "article_topics_public_read" ON public.article_topics;

create policy "topics_public_read" on public.topics for select using (true);
create policy "article_topics_public_read" on public.article_topics for select using (true);

-- No public write policies (admin/service role only, consistent with articles admin flows).

comment on table public.topics is 'Phase 1 1.2: Topics for curated browsing (broader than single category/county). Public read.';
comment on table public.article_topics is 'Phase 1 1.2: Many-to-many join linking articles to topics. Public read.';

-- Optional core topics seed (idempotent; extend via future admin or seed-content.sql)
-- These align with common categories in seed data for smooth demo/transition.
insert into public.topics (slug, name, description, sort_order) values
  ('economy', 'Economy', 'Energy, ag, jobs, and Oklahoma business beats.', 10),
  ('investigations', 'Investigations', 'Deep reporting and accountability stories.', 20),
  ('politics', 'Politics', 'Statehouse, policy, and elections coverage.', 30),
  ('culture', 'Culture', 'Faith, family, community, and rural heritage.', 40),
  ('state', 'Statewide', 'Oklahoma-wide issues and trends.', 50)
on conflict (slug) do nothing;

-- Example linkage to seed articles (safe no-op if articles or topics missing; uses fixed seed IDs)
-- These demonstrate join usage; lib/topics will still fallback broadly for breadth.
insert into public.article_topics (article_id, topic_id)
select a.id, t.id
from public.articles a
join public.topics t on (
  (a.category ilike '%economy%' and t.slug = 'economy') or
  (a.category ilike '%investigations%' and t.slug = 'investigations') or
  (a.category ilike '%politics%' and t.slug = 'politics') or
  (a.category ilike '%culture%' and t.slug = 'culture') or
  (a.category ilike '%state%' and t.slug = 'state')
)
on conflict (article_id, topic_id) do nothing;

-- Also link a few known county-heavy articles to a demo "rural" topic if present (extendable)
insert into public.topics (slug, name, description, sort_order)
values ('rural', 'Rural Oklahoma', 'County-level stories from farms, patches, and small towns.', 60)
on conflict (slug) do nothing;

insert into public.article_topics (article_id, topic_id)
select a.id, t.id
from public.articles a, public.topics t
where t.slug = 'rural'
  and (a.slug in ('ag-report-harvest-2026', 'harvest-reality-2026', 'patch-reality-energy', 'heritage-4h-counties', 'energy-sector-green-mandates') or a.county is not null)
on conflict (article_id, topic_id) do nothing;
