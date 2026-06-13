/** Founder / build updates — separate from investigative stories in Supabase. */

export interface BlogPost {
  slug: string;
  title: string;
  dek: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  category: string;
  featured: boolean;
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "building-the-colony-news-hub",
    title: "We're Building Oklahoma's Independent News Media Hub",
    dek: "The Colony OK is under active construction — stories, podcasts, live broadcasts, county desks, and a reader-funded model designed for Oklahoma, not coastal algorithms.",
    author: "Jake Merrick",
    authorRole: "Founding Publisher",
    publishedAt: "2026-06-10T12:00:00.000Z",
    readTime: "4 MIN READ",
    category: "From the Publisher",
    featured: true,
    body: `If you landed here today, you may notice something unusual: a news site that is honest about still being built.

That is intentional. The Colony OK is not a template with filler copy. We are assembling an independent Oklahoma news media hub — investigative stories, a podcast network, live programming, county-level reporting, and membership tools that keep the press accountable to readers instead of advertisers.

**What you are seeing right now**

The homepage, story pages, podcast network, live schedule, and journalist masthead are live in development. Some rails are populated with seed reporting so designers, engineers, and contributors can stress-test the product before launch week. Other sections will fill in as our newsroom pipeline goes live.

**What we are building toward**

1. **Investigations desk** — Long-form accountability reporting with named bylines, public-records rigor, and corrections displayed prominently.
2. **Podcast network** — Flagship shows plus field-report audio from counties the legacy press ignores.
3. **Live broadcast hub** — Scheduled and breaking coverage with replays, member chat, and clip uploads from the community.
4. **County moat** — Local feeds so rural Oklahoma gets the same production quality as the metro capitol beat.
5. **Reader-funded membership** — $4.99/month unlocks the full archive; no ad deals, no junkets, no hidden sponsors.

**Why publish this note now**

Independent media dies when it pretends to be finished on day one. We would rather tell you the truth: the hub is being built in public, with editorial standards already locked even while the product surface area expands.

If you are a journalist, contributor, or member who wants Oklahoma reporting that does not bend to national outrage cycles, this is the room we are building for you.

**How to follow along**

- Read updates on this blog as we ship major hub milestones.
- Browse early stories and shows to see the editorial direction.
- Join the membership waitlist at /pricing when you are ready to fund the work.

We are not asking you to trust a brand deck. We are asking you to watch the hub take shape — and hold us to the standards we publish on /about.

Thank you for stopping by while we build.`,
  },
  {
    slug: "newsletter-archive-migration-complete",
    title: "The Colony Briefing Archive Is Now Fully Native on Our Platform",
    dek: "All previous external newsletter content has been uploaded and migrated to /stories and /news. The platform is now self-contained — no Substack, no third-party hosting for our reporting.",
    author: "Jake Merrick",
    authorRole: "Founding Publisher",
    publishedAt: "2026-06-11T09:30:00.000Z",
    readTime: "5 MIN READ",
    category: "From the Publisher",
    featured: false,
    body: `Today we completed the final step in making The Colony OK a truly independent, self-contained platform.

For a period, select long-form beats from our reader briefing ("The Briefing") lived on an external newsletter service. That era is over. We have uploaded the full content, synthesized high-fidelity versions grounded in Oklahoma county data, energy realities, ag economics, and community heritage, and moved everything to native routes on our own domain: /stories/harvest-reality-2026, /stories/patch-reality-energy, and /stories/heritage-4h-counties.

**What changed**

- Former "Substack-style" external links and references replaced with internal /stories and /news permalinks.
- Rich, original reporting bodies (not placeholders) now power the articles — full paragraphs on 5th-gen farms, Panhandle co-ops, 4H chapters in Lawton and Edmond, pipeline carveouts, and the real numbers from OSU and county elevators.
- All three pieces carry clear "migrated from our previous reader briefing" notices inside the text so the history is transparent.
- Newsletter signup itself was already fully internal (The Briefing via /api/newsletter/subscribe + county prefs). Components and copy have been cleaned of legacy references.

**Why it matters**

Reader-funded media should not depend on any platform's algorithm, terms, or uptime for its own archive. By bringing everything in-house we control the links, the search, the membership gating, and the corrections. Your bookmarks will not rot. County-specific editions remain available through the same native system that powers /my-feed and /my-counties.

**What to do next**

Browse the migrated reports directly:
- Harvest 2026 Reality Check for 5th-Gen Farms
- The Pipeline Patch Reality No One in DC Asked About
- Small Town Faith & Community: County-Level Heritage and 4H in 2026

They surface in /stories, /news, and home hero rotations alongside our core investigations.

The blog will continue to carry publisher notes on the build. The stories desk carries the reporting. Everything stays in Oklahoma, on our stack.

Thank you to every member and reader who supported the transition. We are done outsourcing our voice.`,
  },
  {
    slug: "county-reporting-matters-more-than-ever",
    title: "County Reporting Matters More Than Ever — And It Is Now All Ours",
    dek: "From the Panhandle to Comanche County, the stories that shape Oklahoma lives were scattered. They are not anymore. A note on completing the archive migration and what it means for local coverage.",
    author: "Jake Merrick",
    authorRole: "Founding Publisher",
    publishedAt: "2026-06-11T10:15:00.000Z",
    readTime: "3 MIN READ",
    category: "From the Publisher",
    featured: false,
    body: `Oklahoma is not a coastal state. Our challenges — water, energy infrastructure, ag volatility, school boards, sheriff budgets, church basements that double as community mental-health networks — are hyper-local and county-specific.

For too long, even independent efforts relied on external newsletter tools to reach readers. Those tools served a purpose during the build, but they created a split archive and external dependencies.

With the completion of the content migration, every piece of The Briefing that carried Colony reporting is now a first-class story on thecolonyok.com. The three rural-beat reports that were the last holdouts (ag harvest reality, patch energy co-ops, and faith & 4H heritage) are live at clean slugs with full bodies, proper bylines, and hero imagery.

**No more "subscribe on Substack" language anywhere.**

The canonical place for the local briefing is right here — powered by the same /api/newsletter/subscribe that respects your county selections and feeds /my-feed. The stories are in the same database and CMS that powers investigations and live.

This is not just hygiene. It is sovereignty. When a member searches "Beaver County" or "fertilizer costs 2026", the results come from our servers, not someone else's. Links in our podcasts and clips point inward. Sitemaps and RSS reflect only what we control.

If you bookmarked old external links, they are now redirects in spirit: visit /stories or /news and you will find the upgraded, permanent versions. The reporting is stronger because it is no longer fragmented.

We will keep adding county desks. We will keep naming names in co-op boardrooms and county commission chambers. And we will keep it all here.

— Jake`,
  },
];

export const FEATURED_BLOG_SLUG = "building-the-colony-news-hub";

export function getBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getFeaturedBlogPost(): BlogPost | null {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0] ?? null;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}