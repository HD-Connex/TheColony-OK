-- 0021_county_feeds.sql
-- Add county to articles (for local moat) if not present
alter table public.articles add column if not exists county text;

-- For newsletter, to allow county prefs; simple text[] for list of counties
alter table public.newsletter_subscribers add column if not exists counties text[];

create index if not exists articles_county_idx on public.articles (county) where county is not null;

-- Optional: index for newsletter counties (GIN for array)
create index if not exists newsletter_subscribers_counties_gin on public.newsletter_subscribers using gin (counties);