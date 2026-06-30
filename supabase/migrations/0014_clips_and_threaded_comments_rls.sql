-- 0014_clips_and_threaded_comments_rls.sql
-- Ruflo-style sequential migration for Phase 2 clips layer (per ruflo-migrations skill + RICH spec + audit).
-- Enables full member clips (upload, transcript, AI review, moderation, embeds) + rich threaded comments.
-- RLS: owner writes, public reads approved, members for premium.

create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ep_id uuid references episodes(id) on delete set null,
  show_id uuid references shows(id) on delete set null,
  storage_path text, -- vercel blob url per vercel:vercel-storage
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
drop policy if exists "clips_owner_all" on clips;
create policy "clips_owner_all" on clips for all using (auth.uid() = user_id);
drop policy if exists "clips_public_approved_read" on clips;
create policy "clips_public_approved_read" on clips for select using (approved = true);
drop policy if exists "comments_owner_all" on threaded_comments;
create policy "comments_owner_all" on threaded_comments for all using (auth.uid() = user_id);
drop policy if exists "comments_public_read" on threaded_comments;
create policy "comments_public_read" on threaded_comments for select using (true); -- tighten with member check via entitlements later

-- Note: For premium member comments, integrate with existing members table or gift/perks (per vercel:auth + audit stubs).
-- Run after previous migrations; use apply-migrations.mjs or supabase db push.