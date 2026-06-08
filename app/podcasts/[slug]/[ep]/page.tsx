import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getEpisodeByShowAndEp, getSiblingEpisodes, getEpisodesByShowSlug, episodeToPlayable } from '@/lib/podcasts';
import { getContributorByName } from '@/lib/contributors';
import EpisodePlayer from '@/app/_components/EpisodePlayer';
import EpisodeShare from '@/app/_components/EpisodeShare';
import JsonLd from '@/app/_components/JsonLd';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecolonyok.com';

interface Params { slug: string; ep: string; }

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const episode = await getEpisodeByShowAndEp(params.slug, params.ep);
  if (!episode) return { title: 'Episode Not Found | The Colony' };
  const playable = episodeToPlayable(episode);
  const isVideo = !!playable.video_url || !!playable.mux_playback_id;
  const title = `${episode.title} | ${params.slug} | The Colony OK`;
  const desc = episode.description?.slice(0, 160) || `Watch or listen to ${episode.title} — video podcast from The Colony.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/podcasts/${params.slug}/${episode.slug || episode.id}` },
    openGraph: {
      title,
      description: desc,
      images: episode.thumbnail_url || playable.thumbnail_url ? [{ url: episode.thumbnail_url || playable.thumbnail_url! }] : undefined,
      videos: isVideo && playable.video_url ? [{ url: playable.video_url }] : undefined,
    },
  };
}

export default async function PerEpisodePage({ params }: { params: Params }) {
  const episode = await getEpisodeByShowAndEp(params.slug, params.ep);
  if (!episode) notFound();

  const playable = episodeToPlayable(episode);
  const siblings = await getSiblingEpisodes(params.slug, episode.id);
  const prev = siblings[0] ?? null;
  const next = siblings[1] ?? null;

  let contributor = null;
  if (episode.host_name) {
    contributor = await getContributorByName(episode.host_name).catch(() => null);
  }

  const isVideo = !!(playable.video_url || playable.mux_playback_id);
  const showSlug = params.slug;
  const canonicalPath = `/podcasts/${showSlug}/${episode.slug || episode.id}`;
  const shareUrl = `${SITE_URL}${canonicalPath}`;

  const videoObject = isVideo ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: episode.title,
    description: episode.description,
    thumbnailUrl: episode.thumbnail_url || playable.thumbnail_url,
    uploadDate: episode.published_at || episode.pub_date,
    contentUrl: playable.video_url,
    embedUrl: playable.mux_playback_id ? `https://player.mux.com/${playable.mux_playback_id}` : undefined,
  } : null;

  return (
    <main className="per-ep-page container" data-episode-id={episode.id}>
      <nav className="breadcrumbs"><Link href={`/podcasts/${showSlug}`}>← Back to {showSlug}</Link></nav>

      <header>
        <h1>{episode.title}</h1>
        <p className="meta">
          {episode.published_at || episode.pub_date} · {episode.host_name} · {isVideo ? 'VIDEO + AUDIO' : 'AUDIO'}
          {episode.duration_s ? ` · ${Math.round(episode.duration_s / 60)} min` : ''}
        </p>
      </header>

      <section className="player-section">
        <EpisodePlayer episode={playable} />
      </section>

      <section className="description">
        <h2>About this episode</h2>
        <div dangerouslySetInnerHTML={{ __html: episode.description || '' }} />
      </section>

      {contributor || episode.host_name ? (
        <aside className="contributor-rail">
          <h3>Featuring</h3>
          <Link href={`/contributors/${contributor?.slug || episode.host_name?.toLowerCase().replace(/\s+/g, '-')}`}>
            {episode.host_name}{contributor ? ' → full profile' : ''}
          </Link>
          <p>Explore their body of work across stories, podcasts &amp; video.</p>
        </aside>
      ) : null}

      <EpisodeShare title={episode.title} url={shareUrl} />

      <nav className="ep-nav">
        {prev && <Link href={`/podcasts/${showSlug}/${prev.slug || prev.id}`}>← Prev: {prev.title}</Link>}
        {next && <Link href={`/podcasts/${showSlug}/${next.slug || next.id}`}>Next: {next.title} →</Link>}
        <Link href={`/podcasts/${showSlug}`}>All episodes</Link>
      </nav>

      {videoObject && <JsonLd data={videoObject} />}

      <section className="related">
        <h3>More from this show</h3>
        {(await getEpisodesByShowSlug(showSlug))
          .filter((s) => s.id !== episode.id)
          .slice(0, 3)
          .map((s) => (
            <Link key={s.id} href={`/podcasts/${showSlug}/${s.slug || s.id}`}>{s.title}</Link>
          ))}
      </section>
    </main>
  );
}