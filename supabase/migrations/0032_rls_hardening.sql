-- 0032_rls_hardening.sql
-- Security remediation (post-audit). Append-only; idempotent (drop policy if exists).
--
-- Fixes:
-- 1. Clips moderation bypass: 0014 used `clips_owner_all FOR ALL USING (auth.uid()=user_id)`
--    with no WITH CHECK, so an owner could UPDATE their own clip and set approved=true
--    (self-publish, bypassing moderation). Split into per-action policies whose WITH CHECK
--    forbids owners from producing an approved row; add an admin/editor moderation policy.
-- 2. Upvote race/manipulation: replace the API's non-atomic read-then-write with an atomic
--    SQL increment (see app/api/clips/upvote). One-vote-per-user is intentionally NOT enforced
--    (the feed allows anonymous, rate-limited upvotes by product design); revisit if abuse appears.

-- ── 1. Clips RLS ───────────────────────────────────────────────
drop policy if exists "clips_owner_all" on public.clips;
drop policy if exists "clips_public_approved_read" on public.clips;

drop policy if exists "clips_owner_select" on public.clips;
create policy "clips_owner_select" on public.clips
  for select using (auth.uid() = user_id);

drop policy if exists "clips_owner_insert" on public.clips;
create policy "clips_owner_insert" on public.clips
  for insert with check (auth.uid() = user_id and approved = false);

-- Owners may edit their own clips but can never set/keep approved = true.
drop policy if exists "clips_owner_update" on public.clips;
create policy "clips_owner_update" on public.clips
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and approved = false);

drop policy if exists "clips_owner_delete" on public.clips;
create policy "clips_owner_delete" on public.clips
  for delete using (auth.uid() = user_id);

-- Admins/editors moderate any clip (approve, edit, remove).
drop policy if exists "clips_admin_all" on public.clips;
create policy "clips_admin_all" on public.clips
  for all
  using (exists (select 1 from public.members m where m.user_id = auth.uid() and m.role in ('admin', 'editor')))
  with check (exists (select 1 from public.members m where m.user_id = auth.uid() and m.role in ('admin', 'editor')));

-- Public can read approved clips (restored from 0014).
create policy "clips_public_approved_read" on public.clips
  for select using (approved = true);

-- ── 2. Atomic upvote ───────────────────────────────────────────
create or replace function public.increment_clip_upvotes(p_clip_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.clips set upvotes = upvotes + 1 where id = p_clip_id returning upvotes;
$$;

revoke all on function public.increment_clip_upvotes(uuid) from public;
grant execute on function public.increment_clip_upvotes(uuid) to service_role;
