import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { safeStockImage, STOCK } from "@/lib/media-map";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";
import StoryCard from "../_components/StoryCard";
import NewsletterSignup from "../_components/NewsletterSignup"; // Newsletter / The Briefing block (after filters, internal platform)
import { getArticles, type Article, getCountiesWithCounts, getRelatedArticles, getArticlesCount } from "@/lib/articles"; // Reuse getRelatedArticles for discovery breadth (news page)
import {
  formatDateShort,
  formatNewsTime,
  newsDateGroup,
  type NewsDateGroup,
} from "@/lib/format";
import { tierLocked } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Daily News",
  description: "The day's headlines from The Colony.",
};

export const revalidate = 120;

const GROUP_ORDER: NewsDateGroup[] = ["today", "yesterday", "earlier"];

const GROUP_LABELS: Record<NewsDateGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

function groupArticles(articles: Article[]): Record<NewsDateGroup, Article[]> {
  const groups: Record<NewsDateGroup, Article[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const article of articles) {
    groups[newsDateGroup(article.published_at)].push(article);
  }

  return groups;
}

function sectionDateline(group: NewsDateGroup, items: Article[], now = new Date()): string {
  const count = String(items.length).padStart(2, "0");

  if (group === "today") {
    const day = now
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      .toUpperCase();
    return `${day} · ${count} FILED`;
  }

  if (group === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = yesterday
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      .toUpperCase();
    return `${day} · ${count} FILED`;
  }

  if (items.length === 0) return `${count} FILED`;

  const dates = items
    .map((a) => new Date(a.published_at))
    .filter((d) => !Number.isNaN(d.valueOf()));
  const oldest = dates.length ? new Date(Math.min(...dates.map((d) => d.valueOf()))) : now;
  const newest = dates.length ? new Date(Math.max(...dates.map((d) => d.valueOf()))) : now;

  return `${formatDateShort(oldest.toISOString())} — ${formatDateShort(newest.toISOString())} · ${count} FILED`;
}

function NewsList({ items, showDate }: { items: Article[]; showDate: boolean }) {
  return (
    <ol className="news-list">
      {items.map((a) => (
        <li key={a.id}>
          <Link href={`/stories/${a.slug}`} className="news-item">
            <time className="news-item__time" dateTime={a.published_at}>
              {formatNewsTime(a.published_at, showDate)}
            </time>
            <div>
              <div className="news-item__meta">
                {a.category && <span className="badge badge--category">{a.category}</span>}
                {tierLocked(a.tier_required) && <span className="badge badge--members">Members</span>}
              </div>
              <h2 className="news-item__title">{a.title}</h2>
              {a.description && <p className="news-item__desc">{a.description}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string; page?: string }>;
}) {
  const { county: countyFilter, page: pageStr } = await searchParams;
  const PER_PAGE = 20;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;
  const [items, countyOptions, totalCount] = await Promise.all([
    getArticles({ limit: PER_PAGE, offset, county: countyFilter }).catch(() => { return []; }),
    getCountiesWithCounts(),
    getArticlesCount(countyFilter).catch(() => 0),
  ]);
  const [pinned, ...rest] = items;
  const groups = groupArticles(rest);
  const visibleGroups = GROUP_ORDER.filter((g) => groups[g].length > 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // Reuse getRelatedArticles in news (more places than just stories/[slug]) — breadth discovery rail from first/pinned story
  const relatedFromNews = pinned ? await getRelatedArticles(pinned.slug, 4).catch(() => []) : [];

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Daily News" }]}
      eyebrow="▼ DAILY"
      title="Daily News"
      lede="The day's headlines from Oklahoma — state, national, and local. Filed throughout the day."
      section={false}
    >
      {/* Phase 1 remaining polish: real county filter using getCountiesWithCounts (select, preserves current) */}
      <form action="/news" method="GET" style={{ marginBottom: "var(--space-3)", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="county" className="fine-print" style={{ marginRight: 4 }}>County:</label>
        <select id="county" name="county" defaultValue={countyFilter || ""} style={{ maxWidth: 220 }}>
          <option value="">All counties</option>
          { countyOptions.map(c => (
            <option key={c.county} value={c.county}>{c.county} ({c.count})</option>
          )) }
        </select>
        <button className="btn btn--sm btn--outline" type="submit">Filter</button>
        {countyFilter && <a href="/news" className="btn btn--sm">Clear</a>}
        <small className="fine-print" style={{ marginLeft: 8 }}>Also browse <a href="/counties">all counties</a></small>
      </form>

      {/* Newsletter signup block (The Briefing): after filters/headers (tasteful, inline variant, reuses enhanced NewsletterForm + shared counties) */}
      <NewsletterSignup
        variant="inline"
        source="news-page"
        title="Subscribe for the local briefing"
        copy="Daily headlines + county editions. No spam, double opt-in."
        compact
      />

      {/* Phase 2 AI: on-site member briefing with Claude summaries + real citations only */}
      <p style={{ margin: "var(--space-2) 0", fontSize: "var(--text-xs)" }}>
        Members: see your personalized daily AI briefing at <a href="/briefing" className="btn btn--sm btn--outline" style={{ display: "inline" }}>/briefing</a> (also emailed weekly via cron).
      </p>

      {/* Aesthetic lead image for news */}
      <div className="section-lead-image">
        <Image
          src={STOCK.heroDefault}
          alt="Daily news and dispatches from Oklahoma"
          width={1200}
          height={380}
          className="img-aesthetic"
        />
      </div>

      {items.length === 0 ? (
        // PHASE 8 AUDIT P1: Updated empty-state (user-friendly, no seeded refs; reuses .empty-state pattern from stories/news siblings + topics/counties).
        // Example-aligned: "No headlines yet — check back soon or be the first to contribute via tip line."
        // Keeps county filter + Newsletter + aesthetic image + related rail above/below for consistency when data loads. No layout break.
        <p className="empty-state">No headlines yet — check back soon or be the first to contribute via tip line.</p>
      ) : (
        <>
          {pinned && (
            <section className="section section--tight">
              <p className="page-header__eyebrow" style={{ marginBottom: "var(--space-4)" }}>▼ PINNED · TOP OF FOLD</p>
              <StoryCard a={pinned} variant="lead" />
            </section>
          )}

          {visibleGroups.map((group, index) => (
            <SectionBlock
              key={group}
              number={`N°${String(index + 1).padStart(2, "0")}`}
              title={GROUP_LABELS[group]}
              dateline={sectionDateline(group, groups[group])}
              tone={index % 2 === 0 ? "paper" : "ink"}
            >
              <NewsList items={groups[group]} showDate={group !== "today"} />
            </SectionBlock>
          ))}
        </>
      )}

      {/* Related content reuse of getRelatedArticles (news page breadth, beyond stories detail) */}
      {relatedFromNews.length > 0 && (
        <section className="section section--tight">
          <SectionBlock number="N°R" title="Related Headlines" dateline="FROM CURRENT COVERAGE">
            <div className="work-rail">
              {relatedFromNews.map((r) => (
                <div className="work-rail__item" key={r.id}>
                  <Link href={`/stories/${r.slug}`}>{r.title}</Link>
                  <span className="work-rail__meta">{r.category ?? "News"} · {formatDateShort(r.published_at)}</span>
                </div>
              ))}
            </div>
          </SectionBlock>
        </section>
      )}

      {/* P1 pagination: offset/limit + count for news (one of key surfaces; defaults preserve old full load behavior) */}
      {totalPages > 1 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          {page > 1 && <a href={`/news?${new URLSearchParams({ ...(countyFilter ? {county: countyFilter} : {}), page: String(page-1) }).toString()}`} className="btn btn--sm btn--outline">← Prev</a>}
          <span className="fine-print">Page {page} / {totalPages}</span>
          {page < totalPages && <a href={`/news?${new URLSearchParams({ ...(countyFilter ? {county: countyFilter} : {}), page: String(page+1) }).toString()}`} className="btn btn--sm btn--outline">Next →</a>}
        </div>
      )}
    </InnerPageShell>
  );
}
