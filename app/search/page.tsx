import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import { getVideoSeries } from "@/lib/series";
import { getArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across shows, episodes, and articles on The Colony.",
};

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  thumbnail?: string | null;
}

function matchesQuery(text: string | null | undefined, q: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(q);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const query = raw?.trim() ?? "";
  const q = query.toLowerCase();

  let results: SearchResult[] = [];
  if (q) {
    const [series, articles] = await Promise.all([
      getVideoSeries().catch(() => []),
      getArticles({ limit: 50 }).catch(() => []),
    ]);

    for (const s of series) {
      if (matchesQuery(s.title, q) || matchesQuery(s.tagline, q) || matchesQuery(s.description, q)) {
        results.push({
          id: `series-${s.id}`,
          title: s.title,
          subtitle: "Show",
          href: `/shows/${s.slug}`,
          thumbnail: s.poster_url ?? s.hero_url,
        });
      }
    }

    for (const a of articles) {
      if (matchesQuery(a.title, q) || matchesQuery(a.description, q)) {
        results.push({
          id: `article-${a.id}`,
          title: a.title,
          subtitle: "Article",
          href: `/stories/${a.slug}`,
        });
      }
    }
  }

  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <PageHeader
          eyebrow="▼ SEARCH"
          title="Find it"
          lede="Basic title search across shows and articles. Smart semantic search coming soon."
        />

        <form action="/search" method="GET" className="search-form">
          <input
            name="q"
            defaultValue={query}
            placeholder="e.g. election integrity, faith and freedom, Oklahoma…"
            aria-label="Search query"
            autoFocus
          />
          <button className="btn btn--primary btn--sm" type="submit">
            Search
          </button>
        </form>

        {query && (
          <p style={{ fontSize: ".875rem", color: "var(--muted-foreground)", marginBottom: "1rem" }}>
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
          </p>
        )}

        {query && results.length === 0 && (
          <p className="empty-state">No matches found. Try different keywords.</p>
        )}

        <div className="search-results">
          {results.map((r) => (
            <Link key={r.id} href={r.href} className="search-result">
              <div className="search-result__thumb">
                {r.thumbnail && (
                  <Image src={r.thumbnail} alt="" width={320} height={180} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div className="search-result__body">
                <p className="search-result__series">{r.subtitle}</p>
                <h3 className="search-result__title">{r.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}