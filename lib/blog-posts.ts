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