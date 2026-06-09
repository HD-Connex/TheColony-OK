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
import AuthorityBadge from "@/app/_components/AuthorityBadge";
import ClipsTeaser from "@/app/_components/ClipsTeaser";
import ChapterSidebar from "../../_components/ChapterSidebar";
import { formatDate, formatDurationLabel } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

interface Params {
  slug: string;
  ep: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, ep } = await params;
  const episode = await getEpisodeByShowAndEp(slug, ep);
  if (!episode) return { title: "Episode Not Found | The Colony", robots: { index: false } };
  const playable = episodeToPlayable(episode);
  const isVideo = !!playable.video_url || !!playable.mux_playback_id;
  const title = `${episode.title} | ${slug} | The Colony OK`;
  const desc =
    episode.description?.slice(0, 160) || `Watch or listen to ${episode.title} — video podcast from The Colony.`;
  const canonical = `/podcasts/${slug}/${episode.slug || episode.id}`;
  const thumb = episode.thumbnail_url || playable.thumbnail_url || undefined;
  const durationIso = episode.duration_s
    ? `PT${Math.floor(episode.duration_s / 60)}M${episode.duration_s % 60}S`
    : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      images: thumb ? [{ url: thumb }] : undefined,
      videos: isVideo && playable.video_url ? [{ url: playable.video_url }] : undefined,
      // Deeper: type-specific + locale/rural signals
      locale: "en_US",
      siteName: "The Colony OK",
    },
    twitter: {
      card: isVideo ? "player" : "summary_large_image",
      title,
      description: desc,
      images: thumb ? [thumb] : undefined,
    },
    other: {
      // For rich video platforms
      ...(durationIso ? { "video:duration": String(episode.duration_s) } : {}),
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

  // Deeper generateMetadata + VideoObject (Phase 3 SEO completion example on per-ep).
  // Includes duration, publisher, potentialAction for play, interaction stats stub, both Video+Audio variants.
  const baseSchema = {
    "@context": "https://schema.org",
    name: episode.title,
    description: episode.description,
    thumbnailUrl: episode.thumbnail_url || playable.thumbnail_url,
    uploadDate: episode.published_at || episode.pub_date,
    duration: episode.duration_s ? `PT${Math.floor((episode.duration_s || 0) / 60)}M` : undefined,
    author: episode.host_name ? { "@type": "Person", name: episode.host_name } : undefined,
    publisher: { "@type": "Organization", name: "The Colony OK", url: SITE_URL },
    url: shareUrl,
  };

  const videoObject = isVideo
    ? {
        ...baseSchema,
        "@type": "VideoObject",
        contentUrl: playable.video_url,
        embedUrl: playable.mux_playback_id
          ? `https://player.mux.com/${playable.mux_playback_id}`
          : undefined,
        potentialAction: {
          "@type": "WatchAction",
          target: shareUrl,
        },
      }
    : {
        ...baseSchema,
        "@type": "AudioObject",
        contentUrl: playable.audio_url,
        // audio fallback for pure audio eps
      };

  // Always render (VideoObject or AudioObject) for per-ep SEO completeness.

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
                  <div className="article__body pod-ep-body" dangerouslySetInnerHTML={{ __html: episode.description }} />
                </SectionBlock>
              </section>
            )}

            {(contributor || episode.host_name) && (
              <aside className="account-card account-card-tight">
                <h2 className="account-card__h">Featuring</h2>
                <Link
                  href={`/contributors/${contributor?.slug || episode.host_name?.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {episode.host_name}
                  {contributor ? " → full profile" : ""}
                </Link>
                <AuthorityBadge verified />
                <p className="account-card__note">
                  Explore their body of work across stories, podcasts &amp; video.
                </p>
              </aside>
            )}

            <ClipsTeaser count={8} />

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
                <ul className="chapter-list chapter-list-tight">
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

      <JsonLd data={videoObject} />
    </main>
  );
}