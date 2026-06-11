-- 0022_member_live.sql
-- Phase 2: "Off the Record" Member Live + The Backroom
-- Adds visibility gating to live_events ('public' | 'members')
-- Introduces private backroom_threads + backroom_posts for members-only community (heirloom elite plate).
-- RLS: active members only via members.is_member (per Phase 1 county + entitlements).

-- 1. Visibility on live events (default public to preserve existing behavior)
alter table public.live_events
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public','members'));

-- 2. Backroom private club tables
create table if not exists public.backroom_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.backroom_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.backroom_threads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz default now()
);

-- Indexes for perf (threads list + posts thread)
create index if not exists backroom_threads_created_idx on public.backroom_threads (created_at desc);
create index if not exists backroom_posts_thread_idx on public.backroom_posts (thread_id, created_at asc);
create index if not exists backroom_posts_user_idx on public.backroom_posts (user_id);

-- 3. RLS enable
alter table public.backroom_threads enable row level security;
alter table public.backroom_posts enable row level security;

-- 4. Policies: select + insert ONLY for active members (is_member=true in members table)
-- Matches plan spec + reuse of existing members.is_member pattern from 0006/0015/0018/ entitlements.

create policy "backroom_threads_member_select" on public.backroom_threads
  for select
  using (
    exists (
      select 1 from public.members
      where user_id = auth.uid()
        and is_member = true
    )
  );

create policy "backroom_threads_member_insert" on public.backroom_threads
  for insert
  with check (
    auth.uid() = created_by and
    exists (
      select 1 from public.members
      where user_id = auth.uid()
        and is_member = true
    )
  );

create policy "backroom_posts_member_select" on public.backroom_posts
  for select
  using (
    exists (
      select 1 from public.members
      where user_id = auth.uid()
        and is_member = true
    )
  );

create policy "backroom_posts_member_insert" on public.backroom_posts
  for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.members
      where user_id = auth.uid()
        and is_member = true
    )
  );

-- No update/delete for now (append-only club log; admin can via service role if needed)

comment on table public.backroom_threads is 'The Backroom — members-only threaded discussion (Off the Record elite community). Gated by RLS on is_member.';
comment on table public.backroom_posts is 'Posts within Backroom threads. Realtime capable. Member insert/select only.';
comment on column public.live_events.visibility is '"public" (default) or "members" (Off the Record). Gates player + LiveStage with Paywall brass.';
