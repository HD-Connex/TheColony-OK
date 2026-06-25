-- Articles stub for news/home surfaces (lib/articles.ts).
-- Full editorial workflow (contributor FKs, body HTML, paywall) can extend this later.

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  dek TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  tier_required TEXT NOT NULL DEFAULT 'free',
  hero_url TEXT,
  hero_alt TEXT,
  category TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(published_at DESC)
  WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category) WHERE category IS NOT NULL;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_public_read" ON public.articles;
CREATE POLICY "articles_public_read" ON public.articles
  FOR SELECT USING (status = 'published');

COMMENT ON TABLE public.articles IS
  'News/article catalog stub. Home + /news query published rows; member gating via tier_required in app layer.';
