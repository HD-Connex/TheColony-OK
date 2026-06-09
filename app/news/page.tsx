import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";
import StoryCard from "../_components/StoryCard";
import { getArticles, type Article } from "@/lib/articles";
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
              <div style={{ display: "flex", gap: ".5rem", marginBottom: ".25rem" }}>
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

export default async function NewsPage() {
  const items = await getArticles({ limit: 30 }).catch(() => { return []; });
  const [pinned, ...rest] = items;
  const groups = groupArticles(rest);
  const visibleGroups = GROUP_ORDER.filter((g) => groups[g].length > 0);

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Daily News" }]}
      eyebrow="▼ DAILY"
      title="Daily News"
      lede="The day's headlines from Oklahoma — state, national, and local. Filed throughout the day."
      section={false}
    >
      {items.length === 0 ? (
        <p className="empty-state">No headlines yet.</p>
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
    </InnerPageShell>
  );
}