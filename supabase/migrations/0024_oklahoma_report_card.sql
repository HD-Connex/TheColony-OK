-- Phase 4: Oklahoma Report Card
-- Public civic accountability layer for The Colony (heirloom press elite transparency).
-- Officials (scoped by county for Phase 1 moat) + curated issues + grades (A-F + evidence/sources).
-- Public read (anyone can view the "letterpress of record").
-- Writes only via admin-gated API routes (supabaseAdmin + requireAdmin, never client).
-- Ties into existing counties from articles + getCountiesWithCounts.

-- 1. Officials (elected/appointed key figures per county)
create table if not exists public.officials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office text not null,
  county text,
  party text,
  photo_url text,
  bio text,
  term_start date,
  term_end date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Curated scorecard issues (stable reference set; extend over time)
create table if not exists public.scorecard_issues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  sort_order int default 100
);

-- 3. Grades (the actual report card entries; one per official+issue)
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  official_id uuid not null references public.officials(id) on delete cascade,
  issue_id uuid not null references public.scorecard_issues(id) on delete cascade,
  grade text not null check (grade in ('A','B','C','D','F','N/A')),
  notes text,
  evidence_url text,
  source text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now(),
  unique (official_id, issue_id)
);

-- Indexes for common queries (county list, per-official, top grades)
create index if not exists officials_county_idx on public.officials (county) where county is not null;
create index if not exists grades_official_idx on public.grades (official_id);
create index if not exists grades_issue_idx on public.grades (issue_id);
create index if not exists grades_updated_idx on public.grades (updated_at desc);

-- RLS: public transparency (read for all), writes service/admin only
alter table public.officials enable row level security;
alter table public.scorecard_issues enable row level security;
alter table public.grades enable row level security;

-- Public read policies (civic tool — anyone can see the grades)
create policy "officials_public_read" on public.officials for select using (true);
create policy "scorecard_issues_public_read" on public.scorecard_issues for select using (true);
create policy "grades_public_read" on public.grades for select using (true);

-- No public insert/update/delete policies (writes go through admin API using service role).
-- Admin routes will use supabaseAdmin (bypasses RLS) after requireAdmin check.

comment on table public.officials is 'Phase 4: Officials for Oklahoma Report Card (county-scoped per Phase 1). Public read only.';
comment on table public.scorecard_issues is 'Phase 4: Stable set of issues graded in the Report Card. Public read only.';
comment on table public.grades is 'Phase 4: Letterpress grades + evidence. Public read; admin writes via gated routes only.';

-- Seed core issues (idempotent via on conflict do nothing on slug)
insert into public.scorecard_issues (slug, title, description, sort_order) values
  ('education', 'Education', 'K-12 and higher ed outcomes, funding, choice, and results.', 10),
  ('economy', 'Economy & Jobs', 'Business climate, wages, unemployment, and growth policies.', 20),
  ('public-safety', 'Public Safety', 'Crime, policing, courts, and community safety.', 30),
  ('fiscal', 'Fiscal Responsibility', 'Budgeting, taxes, debt, and spending transparency.', 40),
  ('energy-infra', 'Energy & Infrastructure', 'Roads, energy production, utilities, and rural access.', 50),
  ('transparency', 'Government Transparency', 'Open records, ethics, lobbying, and public data access.', 60)
on conflict (slug) do nothing;