-- Members + Stripe entitlement (ported from TheColony users/subscriptions model).
-- thecolony-app uses Supabase auth (auth.users) instead of Clerk + users table.
-- lib/auth-client.ts reads is_member + status; Stripe webhook will upsert stripe_* fields.

CREATE TABLE IF NOT EXISTS public.members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_member BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN (
      'active', 'trialing', 'past_due', 'canceled',
      'incomplete', 'paused', 'inactive'
    )),
  tier TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_stripe_customer
  ON public.members(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_stripe_subscription
  ON public.members(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status) WHERE is_member = true;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_own" ON public.members;
CREATE POLICY "members_read_own" ON public.members
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.members IS
  'Stripe-synced membership entitlements. is_member && status=active gates content; webhook is source of truth.';
