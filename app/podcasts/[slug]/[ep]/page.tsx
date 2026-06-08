import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getEpisodeByShowAndEp, getSiblingEpisodes, episodeToPlayable, getEpisodesByShowSlug } from '@/lib/podcasts';
import { getContributorByName } from '@/lib/contributors';
import EpisodePlayer from '@/app/_components/EpisodePlayer';
import { JsonLd } from '@/app/_components/JsonLd';
import type { Episode } from '@/lib/supabase';

interface Params { slug: string; ep: string; }

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const episode = await getEpisodeByShowAndEp(params.slug, params.ep);
  if (!episode) return { title: 'Episode Not Found | The Colony' };
  const playable = episodeToPlayable(episode);
  const isVideo = !!playable.videoUrl || !!playable.muxPlaybackId;
  const title = `${episode.title} | ${params.slug} | The Colony OK`;
  const desc = episode.description?.slice(0, 160) || `Watch or listen to ${episode.title} — video podcast from The Colony.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/podcasts/${params.slug}/${episode.slug || episode.id}` },
    openGraph: {
      title,
      description: desc,
      images: episode.thumbnail_url || playable.thumbnailUrl ? [{ url: episode.thumbnail_url || playable.thumbnailUrl }] : undefined,
      videos: isVideo && playable.videoUrl ? [{ url: playable.videoUrl }] : undefined,
    },
  };
}

export default async function PerEpisodePage({ params }: { params: Params }) {
  const episode = await getEpisodeByShowAndEp(params.slug, params.ep);
  if (!episode) notFound();

  const playable = episodeToPlayable(episode);
  const siblings = await getSiblingEpisodes(params.slug, episode.id);
  const prev = siblings.find((_, i, arr) => arr[i+1]?.id === episode.id) || null;
  const next = siblings[0] || null;

  let contributor = null;
  if (episode.host_name) {
    contributor = await getContributorByName(episode.host_name).catch(() => null);
  }

  const isVideo = !!(playable.videoUrl || playable.muxPlaybackId);
  const showSlug = params.slug;

  const videoObject = isVideo ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: episode.title,
    description: episode.description,
    thumbnailUrl: episode.thumbnail_url || playable.thumbnailUrl,
    uploadDate: episode.published_at,
    contentUrl: playable.videoUrl,
    embedUrl: playable.muxPlaybackId ? `https://player.mux.com/${playable.muxPlaybackId}` : undefined,
  } : null;

  return (
    <main className="per-ep-page container" data-episode-id={episode.id}>
      <nav className="breadcrumbs"><Link href={`/podcasts/${showSlug}`}>← Back to {showSlug}</Link></nav>

      <header>
        <h1>{episode.title}</h1>
        <p className="meta">{episode.published_at} · {episode.host_name} · {isVideo ? 'VIDEO + AUDIO' : 'AUDIO'} {episode.duration ? `· ${Math.round(episode.duration/60)} min` : ''}</p>
      </header>

      <section className="player-section">
        <EpisodePlayer episode={playable} />
      </section>

      {playable.chapters && playable.chapters.length > 0 && (
        <section className="chapters">
          <h2>Chapters</h2>
          <ul>
            {playable.chapters.map((ch: any, idx: number) => (
              <li key={idx}>
                <button onClick={() => { /* seek via player */ }} aria-label={`Seek to ${ch.label}`}>
                  {Math.floor(ch.t / 60)}:{(ch.t % 60).toString().padStart(2,'0')} — {ch.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="description">
        <h2>About this episode</h2>
        <div dangerouslySetInnerHTML={{ __html: episode.description || '' }} />
      </section>

      {contributor || episode.host_name ? (
        <aside className="contributor-rail">
          <h3>Featuring</h3>
          <Link href={`/contributors/${contributor?.slug || episode.host_name?.toLowerCase().replace(/\s+/g,'-')}`}>
            {episode.host_name} {contributor ? ' → full profile' : ''}
          </Link>
          <p>Explore their body of work across stories, podcasts &amp; video.</p>
        </aside>
      ) : null}

      <section className="share">
        <h3>Share</h3>
        <button onClick={() => navigator.share?.({ title: episode.title, url: window.location.href })}>Share episode</button>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(episode.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank">X</a>
      </section>

      <nav className="ep-nav">
        {prev && <Link href={`/podcasts/${showSlug}/${prev.slug || prev.id}`}>← Prev: {prev.title}</Link>}
        {next && <Link href={`/podcasts/${showSlug}/${next.slug || next.id}`}>Next: {next.title} →</Link>}
        <Link href={`/podcasts/${showSlug}`}>All episodes</Link>
      </nav>

      {videoObject && <JsonLd data={videoObject} />}

      <section className="related">
        <h3>More from this show</h3>
        {siblings.slice(0,3).map(s => (
          <Link key={s.id} href={`/podcasts/${showSlug}/${s.slug || s.id}`}>{s.title}</Link>
        ))}
      </section>
    </main>
  );
}