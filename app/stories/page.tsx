import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FilterBar from "../_components/FilterBar";
import InnerPageShell from "../_components/InnerPageShell";
import StoryCard from "../_components/StoryCard";
import NewsletterSignup from "../_components/NewsletterSignup"; // Newsletter / The Briefing block (after filters/headers)
import ContinueRail from "../_components/ContinueRail"; // Reuse enhanced ContinueRail for discovery breadth on stories list (site-wide)
import { getArticles, type Article, getCountiesWithCounts, getArticlesCount } from "@/lib/articles";
import { safeStockImage } from "@/lib/media-map";

export const metadata: Metadata = {
  title: "Stories",
  description: "Investigative stories and long-form reporting from The Colony.",
};

export const revalidate = 120;

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "politics", label: "Politics" },
  { key: "investigations", label: "Investigations" },
  { key: "culture", label: "Culture" },
  { key: "economy", label: "Economy" },
] as const;

function matchesCategory(article: Article, cat: string | undefined): boolean {
  if (!cat || cat === "all") return true;
  return (article.category ?? "").toLowerCase() === cat.toLowerCase();
}

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; county?: string; page?: string }>;
}) {
  const { cat, county, page: pageStr } = await searchParams;
  const activeKey = CATEGORIES.some((c) => c.key === cat) ? cat! : "all";
  const PER_PAGE = 12;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const [articles, countyOptions, totalCount] = await Promise.all([
    getArticles({ limit: PER_PAGE, offset, county }).catch((e) => { console.error("Failed loading stories", e); return []; }),
    getCountiesWithCounts(),
    getArticlesCount(county).catch(() => 0),
  ]);
  const filtered = articles.filter((a) => matchesCategory(a, activeKey));
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  const filterOptions = CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    href: c.key === "all" ? "/stories" : `/stories?cat=${c.key}`,
  }));

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Stories" }]}
      eyebrow="▼ INVESTIGATIONS"
      title="Top Stories"
      lede="Investigative reporting from Oklahoma. Politics, culture, the economy, and the stories the legacy press won't touch — funded by readers, not advertisers."
      section={false}
      tone="paper"
    >
      <FilterBar options={filterOptions} activeKey={activeKey} />

      {/* Phase 1 remaining polish: county filter (select from real counts) — complements cat filter */}
      <form action="/stories" method="GET" style={{ margin: "var(--space-3) 0", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input type="hidden" name="cat" value={activeKey} />
        <label htmlFor="county" className="fine-print" style={{ marginRight: 4 }}>County:</label>
        <select id="county" name="county" defaultValue={county || ""} style={{ maxWidth: 220 }}>
          <option value="">All counties</option>
          {countyOptions.map(c => (
            <option key={c.county} value={c.county}>{c.county} ({c.count})</option>
          ))}
        </select>
        <button className="btn btn--sm btn--outline" type="submit">Filter</button>
        {(county || activeKey !== "all") && <Link href="/stories" className="btn btn--sm">Clear all</Link>}
      </form>

      {/* Newsletter signup / The Briefing block: after filters/headers in stories (inline variant for flow) */}
      <NewsletterSignup
        variant="inline"
        source="stories-page"
        title="Subscribe for the local briefing"
        copy="Long-form investigations + county editions delivered free."
        compact
      />

      {/* Aesthetic lead image for stories */}
      <div className="section-lead-image">
        <Image
          src={safeStockImage("story")}
          alt="Investigative reporting from Oklahoma"
          width={1200}
          height={400}
          className="img-aesthetic"
        />
      </div>

      {filtered.length === 0 ? (
        // PHASE 8 AUDIT P1: Updated empty-state to user-friendly message (no "seeded" language, per instructions).
        // Reuses exact .empty-state class + pattern from existing (news, journalists, topics, counties, watch, clips, backroom).
        // Matches task example: "No published stories yet — check back soon or be the first to contribute via tip line."
        // Brutalist tone; preserves layout (p inside InnerPageShell grid flow). SEO: description/eyebrow already strong.
        <p className="empty-state">No published stories yet — check back soon or be the first to contribute via tip line.</p>
      ) : (
        <div className="grid-3">
          {filtered.map((a) => (
            <StoryCard key={a.id} a={a} />
          ))}
        </div>
      )}

      {/* P1 pagination: simple offset/limit + count pager (non-breaking defaults; ?page= ) */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          {page > 1 && <Link href={`/stories?${new URLSearchParams({ ...(cat && cat!=='all' ? {cat} : {}), ...(county ? {county} : {}), page: String(page-1) }).toString()}`} className="btn btn--sm btn--outline">← Prev</Link>}
          <span className="fine-print">Page {page} / {totalPages} (showing {filtered.length})</span>
          {page < totalPages && <Link href={`/stories?${new URLSearchParams({ ...(cat && cat!=='all' ? {cat} : {}), ...(county ? {county} : {}), page: String(page+1) }).toString()}`} className="btn btn--sm btn--outline">Next →</Link>}
        </div>
      )}

      {/* Site-wide ContinueRail reuse (stories index) for discovery breadth */}
      <ContinueRail compact />
    </InnerPageShell>
  );
}
