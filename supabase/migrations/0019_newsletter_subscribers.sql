-- Newsletter pipeline (double opt-in + weekly digest).
-- Subscribers are public-facing; confirmed only receive digests.
-- Unsubscribe uses a hard-to-guess token (uuid).
-- Idempotent: CREATE TABLE IF NOT EXISTS creates minimal stub; ALTER TABLE ADD COLUMN IF NOT EXISTS
-- handles schema drift regardless of which migration (0018 or 0019) ran first.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS newsletter_email_idx ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_confirmed_idx ON public.newsletter_subscribers(confirmed_at) WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS newsletter_token_idx ON public.newsletter_subscribers(token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No public select/write policies. All access via server (rate-limited API + cron service role).
-- Inserts happen via /api/newsletter/subscribe (sanitized + rate limited).

COMMENT ON TABLE public.newsletter_subscribers IS 'Double opt-in newsletter subs. Weekly digest cron sends to confirmed non-unsubbed rows. Token for confirm/unsub actions.';
