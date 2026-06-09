import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import SectionBlock from "@/app/_components/SectionBlock";
import EpisodeShare from "@/app/_components/EpisodeShare";
import JsonLd from "@/app/_components/JsonLd";
import VideoPlayer from "@/app/_components/VideoPlayer";
import VideoEmbed from "@/app/_components/VideoEmbed";
import {
  getVideoEpisodeBySeriesAndSlug,
  getSiblingVideoEpisodes,
  getSeriesEpisodes,
  resolveVideo,
} from "@/lib/series";
import { formatDate, formatDuration, formatDurationLabel } from "@/lib/format";
import { tierLocked, tierLabel } from "@/lib/tiers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

interface Params {
  slug: string;
  ep: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, ep } = await params;
  const data = await getVideoEpisodeBySeriesAndSlug(slug, ep);
  if (!data) return { title: "Episode Not Found | The Colony" };
  const { series, episode } = data;
  const title = `${episode.title} | ${series.title} | The Colony OK`;
  const desc = episode.description?.slice(0, 160) || `Watch ${episode.title} — ${series.title} on The Colony.`;
  const playback = resolveVideo(episode);
  return {
    title,
    description: desc,
    alternates: { canonical: `/shows/${series.slug}/${episode.slug}` },
    openGraph: {
      title,
      description: desc,
      images: episode.thumbnail_url ? [{ url: episode.thumbnail_url }] : undefined,
      videos: playback.src ? [{ url: playback.src }] : undefined,
    },
  };
}

export default async function VideoEpisodePage({ params }: { params: Promise<Params> }) {
  const { slug, ep } = await params;
  const data = await getVideoEpisodeBySeriesAndSlug(slug, ep);
  if (!data) notFound();

  const { series, episode } = data;
  const playback = resolveVideo(episode);
  const [prev, next] = await getSiblingVideoEpisodes(series.id, episode.id);
  const related = (await getSeriesEpisodes(series.id))
    .filter((e) => e.id !== episode.id)
    .slice(0, 5);

  const canonicalPath = `/shows/${series.slug}/${episode.slug}`;
  const shareUrl = `${SITE_URL}${canonicalPath}`;
  const locked = tierLocked(episode.tier_required);
  const isEmbed = playback.kind === "embed" && !!playback.src;

  const videoObject =
    playback.src
      ? {
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: episode.title,
          description: episode.description,
          thumbnailUrl: episode.thumbnail_url,
          uploadDate: episode.published_at,
          contentUrl: playback.kind === "hls" ? playback.src : episode.video_url,
          embedUrl: isEmbed ? playback.src : undefined,
        }
      : null;

  return (
    <main className="per-ep-page" id="main" data-episode-id={episode.id}>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shows", href: "/shows" },
            { label: series.title, href: `/shows/${series.slug}` },
            { label: episode.title },
          ]}
        />

        <div className="per-ep-page__grid">
          <div className="per-ep-page__main">
            <div className="per-ep-page__meta">
              {episode.published_at && <span>{formatDate(episode.published_at)}</span>}
              {episode.season_number != null && episode.episode_number != null && (
                <span>
                  S{episode.season_number}·E{episode.episode_number}
                </span>
              )}
              <span>VIDEO</span>
              {episode.duration_seconds != null && episode.duration_seconds > 0 && (
                <span>{formatDurationLabel(episode.duration_seconds)}</span>
              )}
              {locked && <span className="badge badge--members">{tierLabel(episode.tier_required)}</span>}
            </div>

            <h1 className="per-ep-page__title">{episode.title}</h1>

            <div className="per-ep-page__player">
              {playback.kind === "none" || !playback.src ? (
                <div className="live-player">
                  <div className="live-player__offline">
                    <span className="live-player__status">▼ VIDEO COMING SOON</span>
                  </div>
                </div>
              ) : isEmbed ? (
                <VideoEmbed url={playback.src} title={episode.title} />
              ) : (
                <VideoPlayer
                  src={playback.src}
                  poster={episode.thumbnail_url ?? undefined}
                  title={episode.title}
                  episodeId={episode.id}
                />
              )}
            </div>

            {episode.description && (
              <section aria-label="About this episode">
                <SectionBlock number="N°01" title="About this episode">
                  <p style={{ marginTop: "var(--space-4)", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
                    {episode.description}
                  </p>
                </SectionBlock>
              </section>
            )}

            <nav
              className="ep-nav"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--space-4)",
                marginTop: "var(--space-8)",
                paddingTop: "var(--space-6)",
                borderTop: "var(--rule-hairline) solid var(--color-border)",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                letterSpacing: "var(--track-wide)",
                textTransform: "uppercase",
              }}
              aria-label="Episode navigation"
            >
              {prev && (
                <Link href={`/shows/${series.slug}/${prev.slug}`}>← Prev: {prev.title}</Link>
              )}
              {next && (
                <Link href={`/shows/${series.slug}/${next.slug}`}>Next: {next.title} →</Link>
              )}
              <Link href={`/shows/${series.slug}`}>All episodes</Link>
            </nav>
          </div>

          <aside className="per-ep-page__sidebar">
            <EpisodeShare title={episode.title} url={shareUrl} />

            {related.length > 0 && (
              <SectionBlock
                number="N°02"
                title="More from this show"
                dateline={`${related.length} EPISODES`}
                linkHref={`/shows/${series.slug}`}
                linkLabel="All →"
              >
                <ul className="chapter-list" style={{ marginTop: "var(--space-4)" }}>
                  {related.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/shows/${series.slug}/${s.slug}`}
                        className="chapter-btn"
                        style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "var(--space-3)", textDecoration: "none" }}
                      >
                        <span
                          style={{
                            position: "relative",
                            aspectRatio: "16/9",
                            overflow: "hidden",
                            border: "var(--rule-hairline) solid var(--color-border)",
                            background: "var(--color-ink-soft)",
                          }}
                        >
                          {s.thumbnail_url && (
                            <Image src={s.thumbnail_url} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                          )}
                        </span>
                        <span>
                          <span style={{ display: "block" }}>{s.title}</span>
                          {s.duration_seconds != null && (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                              {formatDuration(s.duration_seconds)}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionBlock>
            )}
          </aside>
        </div>
      </div>

      {videoObject && <JsonLd data={videoObject} />}
    </main>
  );
}