-- Foundational contributors directory (profiles shown on /journalists and /contributors/[slug]).

CREATE TABLE IF NOT EXISTS public.contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'contributor'
    CHECK (tier IN ('contributor', 'featured', 'headliner')),
  role TEXT,
  headshot_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  email TEXT,
  x_handle TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'inactive')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributors_tier_status
  ON public.contributors(tier, status)
  WHERE status = 'active';

ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contributors_public_read_active" ON public.contributors
  FOR SELECT USING (status = 'active');

COMMENT ON TABLE public.contributors IS
  'Active masthead profiles. Tier controls card size and sort priority across the site.';

-- Seed core staff if table is empty
INSERT INTO public.contributors (slug, name, tier, role, bio, location, email, x_handle, status)
SELECT * FROM (VALUES
  (
    'sarah-mitchell',
    'Sarah Mitchell',
    'headliner',
    'Investigations Editor',
    'Twelve years on the politics beat. Focus: campaign finance, public records, statehouse accountability.',
    'Oklahoma City, OK',
    'sarah@thecolonyok.com',
    '@sarahm_ok',
    'active'
  ),
  (
    'marcus-webb',
    'Marcus Webb',
    'featured',
    'Host · Patriot Hour',
    'Former Marine officer. Talk radio veteran. Focus: federal/state tension, constitutional law.',
    'Oklahoma City, OK',
    'marcus@thecolonyok.com',
    '@marcuswebb',
    'active'
  ),
  (
    'rachel-torres',
    'Rachel Torres',
    'featured',
    'Host · OK Underground',
    'Field reporter, formerly with KFOR. Rural Oklahoma and on-the-ground government reporting.',
    'Lawton, OK',
    'rachel@thecolonyok.com',
    '@rachel_ok',
    'active'
  ),
  (
    'dan-hollis',
    'Pastor Dan Hollis',
    'contributor',
    'Host · Faith & Freedom',
    'Pastor of First Baptist Lawton, 22 years. Faith in public life and religious liberty.',
    'Lawton, OK',
    'dan@thecolonyok.com',
    NULL,
    'active'
  )
) AS v(slug, name, tier, role, bio, location, email, x_handle, status)
WHERE NOT EXISTS (SELECT 1 FROM public.contributors LIMIT 1);