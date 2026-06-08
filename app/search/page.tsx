import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import {
  mergeSearchResults,
  resolveEmbeddingHits,
  textSearch,
  type SearchResult,
} from "@/lib/search";
import {
  getEmbeddingSearchStatus,
  searchTranscriptChunks,
  semanticSearch,
} from "@/lib/semantic-search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search across podcasts, shows, episodes, and articles on The Colony.",
};

function searchStatusNote(
  status: Awaited<ReturnType<typeof getEmbeddingSearchStatus>>,
  usedSemantic: boolean,
  usedTranscript: boolean
): string | null {
  if (usedSemantic) {
    return "Semantic search matched transcript embeddings in the database.";
  }
  if (usedTranscript) {
    return "Matched stored transcript text. Add OPENAI_API_KEY for full semantic (meaning-based) search.";
  }
  if (status.hasEmbeddings && !status.semanticQueryReady) {
    return "Transcript embeddings exist, but semantic search needs OPENAI_API_KEY. Showing title and description matches.";
  }
  if (status.schemaReady && !status.hasEmbeddings) {
    return "Title and description search only — transcript embeddings are not indexed yet.";
  }
  if (!status.schemaReady) {
    return "Title and description search only — AI search schema not applied yet.";
  }
  return null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const query = raw?.trim() ?? "";

  let results: SearchResult[] = [];
  let statusNote: string | null = null;
  let usedSemantic = false;
  let usedTranscript = false;

  if (query) {
    const [textResults, embedStatus, semanticHits, transcriptHits] = await Promise.all([
      textSearch(query).catch(() => [] as SearchResult[]),
      getEmbeddingSearchStatus().catch(() => ({
        schemaReady: false,
        hasEmbeddings: false,
        semanticQueryReady: false,
      })),
      semanticSearch(query, 8, { threshold: 0.45 }).catch(() => []),
      searchTranscriptChunks(query, 8).catch(() => []),
    ]);

    usedSemantic = semanticHits.length > 0;
    usedTranscript = !usedSemantic && transcriptHits.length > 0;

    const [semanticResults, transcriptResults] = await Promise.all([
      usedSemantic
        ? resolveEmbeddingHits(semanticHits, "Semantic match").catch(() => [] as SearchResult[])
        : Promise.resolve([] as SearchResult[]),
      usedTranscript
        ? resolveEmbeddingHits(transcriptHits, "Transcript match").catch(() => [] as SearchResult[])
        : Promise.resolve([] as SearchResult[]),
    ]);

    results = mergeSearchResults(semanticResults, transcriptResults, textResults);
    statusNote = searchStatusNote(embedStatus, usedSemantic, usedTranscript);
  }

  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
        <PageHeader
          eyebrow="▼ SEARCH"
          title="Find it"
          lede="Search podcasts, shows, episodes, and articles. Transcript-aware when embeddings are indexed."
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

        {query && statusNote && (
          <p style={{ fontSize: ".8125rem", color: "var(--muted-foreground)", marginBottom: ".75rem" }}>
            {statusNote}
          </p>
        )}

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
                  <Image
                    src={r.thumbnail}
                    alt=""
                    width={320}
                    height={180}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
              <div className="search-result__body">
                <p className="search-result__series">{r.subtitle}</p>
                <h3 className="search-result__title">{r.title}</h3>
                {r.excerpt && (
                  <p style={{ fontSize: ".8125rem", color: "var(--muted-foreground)", margin: ".35rem 0 0" }}>
                    {r.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}