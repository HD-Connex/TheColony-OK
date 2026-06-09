-- Link articles to contributors for bylines + profile rails.

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS contributor_id UUID REFERENCES public.contributors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_articles_contributor ON public.articles(contributor_id)
  WHERE contributor_id IS NOT NULL;

COMMENT ON COLUMN public.articles.contributor_id IS 'FK to contributors for byline and /contributors/[slug] story rails.';