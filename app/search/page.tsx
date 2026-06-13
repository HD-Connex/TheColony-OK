import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import TranscriptClipper from "../_components/TranscriptClipper";
import {
  mergeSearchResults,
  resolveEmbeddingHits,
  textSearch,
  type SearchResult,
} from "@/lib/search";
import { safeStockImage } from "@/lib/media-map";
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
  searchParams: Promise<{ q?: string; facet?: string }>;
}) {
  const { q: raw, facet: rawFacet } = await searchParams;
  const query = raw?.trim() ?? "";
  const activeFacet = (rawFacet || "all").toLowerCase();

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

    // Phase 2 facets: server filter by result type (subtitle driven) for episodes/podcasts, video, articles, clips/transcript moments
    if (activeFacet !== "all") {
      const f = activeFacet;
      results = results.filter((r) => {
        const sub = r.subtitle.toLowerCase();
        if (f === "episodes" || f === "podcasts") return sub.includes("podcast") || sub.includes("episode");
        if (f === "video" || f === "shows") return sub.includes("episode") || sub.includes("show");
        if (f === "articles" || f === "news") return sub.includes("article");
        if (f === "clips" || f === "transcript") return sub.includes("clip") || sub.includes("transcript") || sub.includes("semantic");
        return true;
      });
    }
  }

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      eyebrow="▼ SEARCH"
      title="Find Stories & Shows"
      lede="Search podcasts, shows, episodes, and articles. Transcript-aware when embeddings are indexed."
      section={false}
    >
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
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>{statusNote}</p>
      )}

      {query && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
          {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Phase 2 semantic+transcript facets + jump-to-moment via clipper in results. Use links to preserve server render + brutalist no-Tailwind. */}
      {query && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
          {["all", "episodes", "video", "articles", "clips"].map((f) => (
            <a
              key={f}
              href={`/search?q=${encodeURIComponent(query)}&facet=${f}`}
              className={`btn btn--sm ${activeFacet === f ? "btn--primary" : "btn--outline"}`}
              style={{ fontSize: "var(--text-xs)" }}
            >
              {f === "all" ? "ALL" : f.toUpperCase()}
            </a>
          ))}
          <span className="fine-print" style={{ alignSelf: "center" }}>• jump via TranscriptClipper below (time-aware from pgvector chunks)</span>
        </div>
      )}

      {query && results.length === 0 && (
        <p className="empty-state">No matches found. Try different keywords.</p>
      )}

      <div className="search-results">
        {results.map((r) => (
          <Link key={r.id} href={r.href} className="search-result">
            <div className="search-result__thumb">
              <Image
                src={safeStockImage("story", undefined, r.thumbnail)}
                alt={r.title}
                width={320}
                height={180}
                sizes="(max-width: 640px) 100vw, 320px"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="search-result__body">
              <p className="search-result__series">{r.subtitle}</p>
              <h3 className="search-result__title">{r.title}</h3>
              {r.excerpt && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                  {r.excerpt}
                </p>
              )}
              {(r.subtitle.toLowerCase().includes("transcript") || r.subtitle.toLowerCase().includes("semantic") || r.subtitle.toLowerCase().includes("clip")) && (
                <TranscriptClipper
                  href={r.href}
                  title={r.title}
                  startTime={r.startTime}
                  phrase={r.excerpt}
                  // epId extraction is best-effort from href for real moment creation; component falls back to link copy
                  epId={r.id.includes("ep-") ? r.id.split("ep-")[1]?.split("-")[0] : undefined}
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </InnerPageShell>
  );
}