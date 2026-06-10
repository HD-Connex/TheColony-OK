import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import { getVideoSeries, type VideoSeries } from "@/lib/series";

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
        <p className="empty-state">No shows here yet. Check back after the catalog is seeded.</p>
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
          src="/assets/images/slates/colony-247-slate.jpg"
          alt="The Colony shows and video library"
          width={900}
          height={300}
          className="img-aesthetic"
        />
      </div>
    </InnerPageShell>
  );
}

function SeriesCard({ series }: { series: VideoSeries }) {
  const img = series.poster_url ?? series.hero_url;
  return (
    <Link href={`/shows/${series.slug}`} className="series-card">
      <div className="series-card__poster">
        {img ? (
          <Image src={img} alt={series.title} fill sizes="(max-width:640px) 50vw, 25vw" style={{ objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: series.accent_color ?? "var(--muted)" }} />
        )}
      </div>
      <div className="series-card__body">
        <h2 className="series-card__title">{series.title}</h2>
        <p className="series-card__meta">
          {[series.pillar, series.type, series.is_oklahoma ? "Oklahoma" : null].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}