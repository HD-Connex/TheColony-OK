-- Tips / newsletter signups / lead submissions table.
-- Replaces mailto flows for tip + newsletter with server-stored + rate-limited + ack email.
-- Inserts are server-only (via /api/tips using service role). No public read.

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('tip', 'newsletter')),
  email text,
  body text not null,
  contact text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tips_kind_created_idx on public.tips (kind, created_at desc);
create index if not exists tips_email_idx on public.tips (email) where email is not null;

alter table public.tips enable row level security;

-- No SELECT/UPDATE/DELETE policies for anon/authenticated. Service role bypasses RLS.
-- If you need an admin view later, add a policy using requireAdmin pattern or a view.

comment on table public.tips is 'Anonymous tips + newsletter signups. Body is sanitized on ingest. Ack emails sent via Resend after insert.';