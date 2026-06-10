-- Roles + usage events.
-- members.role powers admin/editor/contributor gating (lib/admin-auth.ts).
-- usage_events backs logUsage() in lib/stripe.ts (analytics, limits).

alter table public.members
  add column if not exists role text not null default 'member'
  check (role in ('admin', 'editor', 'contributor', 'member'));

create index if not exists members_role_idx on public.members (role) where role <> 'member';

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Allow clip transcripts alongside episode/video_episode.
alter table public.transcripts drop constraint if exists transcripts_content_type_check;
alter table public.transcripts
  add constraint transcripts_content_type_check
  check (content_type in ('episode', 'video_episode', 'clip'));

alter table public.content_embeddings drop constraint if exists content_embeddings_content_type_check;
alter table public.content_embeddings
  add constraint content_embeddings_content_type_check
  check (content_type in ('episode', 'video_episode', 'clip'));

create index if not exists usage_events_user_idx on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_type_idx on public.usage_events (event_type, created_at desc);

alter table public.usage_events enable row level security;

-- Service role only — no public read/write policies. Inserts happen server-side.
