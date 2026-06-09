import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import JsonLd from "../../_components/JsonLd";
import WatchlistButton from "../../_components/WatchlistButton";
import { getVideoSeriesBySlug, getSeriesEpisodes, getPublishedSeriesSlugs } from "@/lib/series";
import { formatDuration, formatDate } from "@/lib/format";
import { tierLocked, tierLabel } from "@/lib/tiers";

export const revalidate = 60;

const SITE_URL = "https://thecolonyok.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getPublishedSeriesSlugs().catch(() => []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getVideoSeriesBySlug(slug).catch(() => null);
  if (!series) return { title: "Show" };
  return {
    title: series.title,
    description: series.tagline ?? series.description ?? undefined,
    alternates: { canonical: `/shows/${slug}` },
    openGraph: { images: series.hero_url ? [series.hero_url] : undefined },
  };
}

export default async function SeriesPage({ params }: PageProps) {
  const { slug } = await params;
  const series = await getVideoSeriesBySlug(slug).catch(() => null);
  if (!series) notFound();

  const episodes = await getSeriesEpisodes(series.id).catch(() => []);
  const accent = series.accent_color ?? "#f0b429";

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TVSeries",
          name: series.title,
          description: series.description ?? series.tagline,
          url: `${SITE_URL}/shows/${series.slug}`,
          image: series.hero_url ?? series.poster_url ?? undefined,
        }}
      />

      <InnerPageShell
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shows", href: "/shows" },
          { label: series.title },
        ]}
        eyebrow="▼ SHOW"
        title={series.title}
        lede={series.tagline ?? undefined}
        section={false}
      >
        <section
          style={{
            position: "relative",
            marginBottom: "var(--space-8)",
            padding: "var(--space-8) 0",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}
        >
          {series.hero_url && (
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <Image
                src={series.hero_url}
                alt=""
                fill
                priority
                sizes="100vw"
                style={{ objectFit: "cover", opacity: 0.35 }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, var(--background), transparent 70%)",
                }}
              />
            </div>
          )}
          {!series.hero_url && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                background: `radial-gradient(ellipse at top, ${accent}33, transparent 60%)`,
              }}
            />
          )}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", marginBottom: "1rem" }}>
              {series.is_oklahoma && <span className="badge badge--new">Oklahoma Original</span>}
              {series.pillar && <span className="badge">{series.pillar}</span>}
              <span className="badge">{series.type}</span>
              {tierLocked(series.tier_required) && (
                <span className="badge badge--members">{tierLabel(series.tier_required)}</span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", alignItems: "center" }}>
              {episodes[0] && (
                <Link className="btn btn--primary" href={`/shows/${series.slug}/${episodes[0].slug}`}>
                  ▶ Play latest
                </Link>
              )}
              <WatchlistButton seriesId={series.id} className="btn btn--outline" />
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gap: "2.5rem" }}>
          <section aria-label="Episodes" className="section section--tight">
            <header className="section-header" style={{ marginBottom: "1rem" }}>
              <h2 className="section-title" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: 0 }}>
                Episodes
              </h2>
            </header>
            {episodes.length === 0 ? (
              <p className="empty-state">Episodes coming soon.</p>
            ) : (
              <ol className="episode-list">
                {episodes.map((ep) => {
                  const locked = tierLocked(ep.tier_required);
                  return (
                    <li key={ep.id}>
                      <Link href={`/shows/${series.slug}/${ep.slug}`} className="episode-row">
                        <div className="episode-row__thumb">
                          {ep.thumbnail_url && (
                            <Image src={ep.thumbnail_url} alt="" fill sizes="176px" style={{ objectFit: "cover" }} />
                          )}
                          {ep.duration_seconds != null && (
                            <span className="episode-row__duration">{formatDuration(ep.duration_seconds)}</span>
                          )}
                        </div>
                        <div className="episode-row__content">
                          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "center" }}>
                            {ep.episode_number != null && (
                              <span
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: ".7rem",
                                  color: "var(--muted-foreground)",
                                }}
                              >
                                S{ep.season_number ?? 1}·E{ep.episode_number}
                              </span>
                            )}
                            {(ep.badges ?? []).map((b) => (
                              <span key={b} className="badge">
                                {b}
                              </span>
                            ))}
                            {locked && <span className="badge badge--members">{tierLabel(ep.tier_required)}</span>}
                          </div>
                          <h3 className="episode-row__title">{ep.title}</h3>
                          {ep.description && <p className="episode-row__desc">{ep.description}</p>}
                          {ep.published_at && (
                            <p style={{ fontSize: ".75rem", color: "var(--muted-foreground)", margin: ".35rem 0 0" }}>
                              {formatDate(ep.published_at)}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <aside>
            {series.description && (
              <div className="account-card">
                <h2>About</h2>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{series.description}</p>
              </div>
            )}
            {(series.apple_url || series.spotify_url || series.rumble_url || series.youtube_url) && (
              <div className="account-card">
                <h2>Also on</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
                  {series.apple_url && <SubLink href={series.apple_url} label="Apple" />}
                  {series.spotify_url && <SubLink href={series.spotify_url} label="Spotify" />}
                  {series.rumble_url && <SubLink href={series.rumble_url} label="Rumble" />}
                  {series.youtube_url && <SubLink href={series.youtube_url} label="YouTube" />}
                </div>
              </div>
            )}
          </aside>
        </div>
      </InnerPageShell>
    </>
  );
}

function SubLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="btn btn--outline btn--sm" href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}