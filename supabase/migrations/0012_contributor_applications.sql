-- Contributor masthead applications (intake before Stripe + editorial activation).

CREATE TABLE IF NOT EXISTS public.contributor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('contributor', 'featured', 'headliner')),
  tier TEXT NOT NULL CHECK (tier IN ('contributor', 'featured', 'headliner')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  slug TEXT,
  role TEXT,
  bio TEXT,
  website TEXT,
  x_handle TEXT,
  clips JSONB NOT NULL DEFAULT '[]'::jsonb,
  headshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributor_applications_status
  ON public.contributor_applications(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contributor_applications_email
  ON public.contributor_applications(email);

ALTER TABLE public.contributor_applications ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.contributor_applications IS
  'Masthead signup intake. Editorial review before contributors row is activated.';