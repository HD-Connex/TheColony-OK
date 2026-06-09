import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getEpisodeByShowAndEp,
  getSiblingEpisodes,
  getEpisodesByShowSlug,
  episodeToPlayable,
} from "@/lib/podcasts";
import { getContributorByName } from "@/lib/contributors";
import Breadcrumbs from "@/app/_components/Breadcrumbs";
import SectionBlock from "@/app/_components/SectionBlock";
import EpisodePlayer from "@/app/_components/EpisodePlayer";
import EpisodeShare from "@/app/_components/EpisodeShare";
import JsonLd from "@/app/_components/JsonLd";
import ChapterSidebar from "../../_components/ChapterSidebar";
import { formatDate, formatDurationLabel } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thecolonyok.com";

interface Params {
  slug: string;
  ep: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, ep } = await params;
  const episode = await getEpisodeByShowAndEp(slug, ep);
  if (!episode) return { title: "Episode Not Found | The Colony" };
  const playable = episodeToPlayable(episode);
  const isVideo = !!playable.video_url || !!playable.mux_playback_id;
  const title = `${episode.title} | ${slug} | The Colony OK`;
  const desc =
    episode.description?.slice(0, 160) || `Watch or listen to ${episode.title} — video podcast from The Colony.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/podcasts/${slug}/${episode.slug || episode.id}` },
    openGraph: {
      title,
      description: desc,
      images:
        episode.thumbnail_url || playable.thumbnail_url
          ? [{ url: episode.thumbnail_url || playable.thumbnail_url! }]
          : undefined,
      videos: isVideo && playable.video_url ? [{ url: playable.video_url }] : undefined,
    },
  };
}

export default async function PerEpisodePage({ params }: { params: Promise<Params> }) {
  const { slug: showSlug, ep } = await params;
  const episode = await getEpisodeByShowAndEp(showSlug, ep);
  if (!episode) notFound();

  const playable = episodeToPlayable(episode);
  const siblings = await getSiblingEpisodes(showSlug, episode.id);
  const prev = siblings[0] ?? null;
  const next = siblings[1] ?? null;

  let contributor = null;
  if (episode.host_name) {
    contributor = await getContributorByName(episode.host_name).catch((e) => { console.error(e); return null; });
  }

  const isVideo = !!(playable.video_url || playable.mux_playback_id);
  const canonicalPath = `/podcasts/${showSlug}/${episode.slug || episode.id}`;
  const shareUrl = `${SITE_URL}${canonicalPath}`;

  const related = (await getEpisodesByShowSlug(showSlug))
    .filter((s) => s.id !== episode.id)
    .slice(0, 5);

  const showTitle = showSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const videoObject = isVideo
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: episode.title,
        description: episode.description,
        thumbnailUrl: episode.thumbnail_url || playable.thumbnail_url,
        uploadDate: episode.published_at || episode.pub_date,
        contentUrl: playable.video_url,
        embedUrl: playable.mux_playback_id
          ? `https://player.mux.com/${playable.mux_playback_id}`
          : undefined,
      }
    : null;

  return (
    <main className="per-ep-page" id="main" data-episode-id={episode.id}>
      <div className="container">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Podcasts", href: "/podcasts" },
            { label: showTitle, href: `/podcasts/${showSlug}` },
            { label: episode.title },
          ]}
        />

        <div className="per-ep-page__grid">
          <div className="per-ep-page__main">
            <div className="per-ep-page__meta">
              <span>{formatDate(episode.published_at || episode.pub_date)}</span>
              {episode.host_name && <span>{episode.host_name}</span>}
              <span>{isVideo ? "VIDEO + AUDIO" : "AUDIO"}</span>
              {episode.duration_s != null && episode.duration_s > 0 && (
                <span>{formatDurationLabel(episode.duration_s)}</span>
              )}
              {episode.episode_no != null && <span>EPISODE {episode.episode_no}</span>}
            </div>

            <h1 className="per-ep-page__title">{episode.title}</h1>

            <div className="per-ep-page__player">
              <EpisodePlayer episode={playable} />
            </div>

            {episode.description && (
              <section aria-label="About this episode">
                <SectionBlock number="N°01" title="About this episode">
                  <div
                    className="article__body"
                    style={{ marginTop: "var(--space-4)" }}
                    dangerouslySetInnerHTML={{ __html: episode.description }}
                  />
                </SectionBlock>
              </section>
            )}

            {(contributor || episode.host_name) && (
              <aside className="account-card" style={{ marginTop: "var(--space-8)" }}>
                <h2 style={{ marginTop: 0 }}>Featuring</h2>
                <Link
                  href={`/contributors/${contributor?.slug || episode.host_name?.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {episode.host_name}
                  {contributor ? " → full profile" : ""}
                </Link>
                <p style={{ marginBottom: 0, marginTop: "var(--space-3)", color: "var(--color-text-secondary)" }}>
                  Explore their body of work across stories, podcasts &amp; video.
                </p>
              </aside>
            )}

            <nav className="ep-nav" aria-label="Episode navigation">
              {prev && (
                <Link href={`/podcasts/${showSlug}/${prev.slug || prev.id}`}>
                  ← Prev: {prev.title}
                </Link>
              )}
              {next && (
                <Link href={`/podcasts/${showSlug}/${next.slug || next.id}`}>
                  Next: {next.title} →
                </Link>
              )}
              <Link href={`/podcasts/${showSlug}`}>All episodes</Link>
            </nav>
          </div>

          <aside className="per-ep-page__sidebar">
            {episode.chapters && episode.chapters.length > 0 && (
              <ChapterSidebar chapters={episode.chapters} />
            )}

            <EpisodeShare title={episode.title} url={shareUrl} />

            {related.length > 0 && (
              <SectionBlock
                number="N°02"
                title="More from this show"
                dateline={`${related.length} EPISODES`}
                linkHref={`/podcasts/${showSlug}`}
                linkLabel="All →"
              >
                <ul className="chapter-list" style={{ marginTop: "var(--space-4)" }}>
                  {related.map((s) => (
                    <li key={s.id}>
                      <Link href={`/podcasts/${showSlug}/${s.slug || s.id}`} className="chapter-btn">
                        {s.title}
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