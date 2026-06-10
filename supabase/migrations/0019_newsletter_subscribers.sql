-- Newsletter pipeline (double opt-in + weekly digest).
-- Subscribers are public-facing; confirmed only receive digests.
-- Unsubscribe uses a hard-to-guess token (uuid).

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  token UUID NOT NULL DEFAULT gen_random_uuid(), -- for confirm + unsubscribe links (not secret but hard to enumerate)
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT, -- e.g. 'homepage', 'live', 'footer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_email_idx ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_confirmed_idx ON public.newsletter_subscribers(confirmed_at) WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;
CREATE INDEX IF NOT EXISTS newsletter_token_idx ON public.newsletter_subscribers(token);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No public select/write policies. All access via server (rate-limited API + cron service role).
-- Inserts happen via /api/newsletter/subscribe (sanitized + rate limited).

COMMENT ON TABLE public.newsletter_subscribers IS 'Double opt-in newsletter subs. Weekly digest cron sends to confirmed non-unsubbed rows. Token for confirm/unsub actions.';