import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import ContinueRail from "../_components/ContinueRail"; // Reuse for discovery on shows catalog (site-wide breadth)
import WatchlistButton from "../_components/WatchlistButton"; // Reuse existing for more cards (series discovery breadth)
import { getVideoSeries, type VideoSeries } from "@/lib/series";
import { safeStockImage, STOCK } from "@/lib/media-map";

export const metadata: Metadata = {
  title: "Shows",
  description: "Browse every premium show and documentary on The Colony.",
};

export const revalidate = 60;

const PILLARS = [
  { key: "", label: "All" },
  { key: "truth", label: "Truth" },
  { key: "faith", label: "Faith" },
  { key: "freedom", label: "Freedom" },
] as const;

export default async function ShowsPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string; region?: string }>;
}) {
  const sp = await searchParams;
  const pillar = (["truth", "faith", "freedom"].includes(sp.pillar ?? "") ? sp.pillar : undefined) as
    | "truth"
    | "faith"
    | "freedom"
    | undefined;
  const oklahomaOnly = sp.region === "oklahoma";

  let items: VideoSeries[] = [];
  try {
    items = await getVideoSeries();
    if (pillar) items = items.filter((s) => s.pillar === pillar);
    if (oklahomaOnly) items = items.filter((s) => s.is_oklahoma);
  } catch (err) {
    console.error("Failed to load video series", err);
    items = [];
  }

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shows" }]}
      eyebrow="▼ THE LIBRARY"
      title={oklahomaOnly ? "Oklahoma Originals" : "All Shows"}
      lede="Premium shows and documentaries — Truth. Faith. Freedom."
    >
      <nav aria-label="Filter by pillar" className="filter-nav">
        {PILLARS.map((p) => {
          const params = new URLSearchParams();
          if (p.key) params.set("pillar", p.key);
          if (oklahomaOnly) params.set("region", "oklahoma");
          const href = params.toString() ? `/shows?${params}` : "/shows";
          const active = (p.key || undefined) === pillar && !oklahomaOnly;
          return (
            <Link key={p.label} href={href} className={`filter-pill${active ? " is-active" : ""}`}>
              {p.label}
            </Link>
          );
        })}
        <Link
          href={pillar ? `/shows?pillar=${pillar}&region=oklahoma` : "/shows?region=oklahoma"}
          className={`filter-pill${oklahomaOnly ? " is-active" : ""}`}
        >
          Oklahoma
        </Link>
      </nav>

      {items.length === 0 ? (
        // PHASE 8 AUDIT P1: Updated empty-state to user-friendly (no "seeded"/catalog lang).
        // Reuses .empty-state + InnerPageShell/ContinueRail patterns from podcasts/stories.
        // Consistent with /podcasts fix below. "No shows here yet — check back soon."
        // Does not break layout (series-grid sibling). 
        <p className="empty-state">No shows here yet — check back soon.</p>
      ) : (
        <div className="series-grid">
          {items.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}

      {/* Aesthetic visual for shows catalog */}
      <div className="section-lead-image">
        <Image
          src={STOCK.slateDefault}
          alt="The Colony shows and video library"
          width={900}
          height={300}
          className="img-aesthetic"
        />
      </div>

      {/* ContinueRail reuse on /shows for site-wide discovery */}
      <ContinueRail compact />
    </InnerPageShell>
  );
}

function SeriesCard({ series }: { series: VideoSeries }) {
  const img = series.poster_url ?? series.hero_url;
  const displayImg = safeStockImage("podcast", series.slug, img);
  return (
    <Link href={`/shows/${series.slug}`} className="series-card">
      <div className="series-card__poster">
        <Image
          src={displayImg}
          alt={series.title}
          fill
          sizes="(max-width:640px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
          unoptimized={!!img && img.startsWith("http")}
        />
      </div>
      <div className="series-card__body">
        <h2 className="series-card__title">{series.title}</h2>
        <p className="series-card__meta">
          {[series.pillar, series.type, series.is_oklahoma ? "Oklahoma" : null].filter(Boolean).join(" · ")}
        </p>
        {/* Reuse WatchlistButton on series cards (episodes/clips context via parent show) for discovery breadth */}
        <div onClick={(e) => e.preventDefault()} style={{ marginTop: 6 }}>
          <WatchlistButton seriesId={series.id} className="btn btn--sm btn--outline" />
        </div>
      </div>
    </Link>
  );
}