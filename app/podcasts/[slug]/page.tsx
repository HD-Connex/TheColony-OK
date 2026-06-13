import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";
import JsonLd from "../../_components/JsonLd";
import Countdown from "../../_components/Countdown";
import { supabasePublic } from "@/lib/supabase";
import { gatePodcastEpisode } from "@/lib/content-access";
// Local minimal types (lib/supabase no longer re-exports domain row types; keep surface working)
type Show = { slug: string; title: string; host: string; description?: string | null; cover_url?: string | null };
type Episode = { id: string; slug?: string; title: string; pub_date: string; episode_no?: number | null; duration_s?: number | null; description?: string | null; audio_url?: string | null; video_url?: string | null; mux_playback_id?: string | null; thumbnail_url?: string | null; chapters?: any; host_name?: string | null; tier_required?: string | null };
import EpisodePlayer from "../../_components/EpisodePlayer";
import { hostPhoto, podcastCover, safeStockImage } from "@/lib/media-map";
import { formatDate, formatDurationLabel } from "@/lib/format";

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const sb = supabasePublic();
  const { data } = await sb.from("shows").select("slug").eq("active", true);
  return (data ?? []).map((s) => ({ slug: s.slug as string }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sb = supabasePublic();
  const { data: show } = await sb.from("shows").select("title,description,cover_url").eq("slug", slug).single();
  if (!show) return { title: "Show not found" };
  return {
    title: show.title as string,
    description: (show.description as string) ?? undefined,
    alternates: { canonical: `/podcasts/${slug}` },
    openGraph: { type: "website", title: show.title as string, images: [podcastCover(slug, show.cover_url as string | null)] },
  };
}

async function getShowAndEpisodes(slug: string): Promise<{ show: Show; episodes: Episode[] } | null> {
  const sb = supabasePublic();
  const [{ data: show }, { data: episodes }] = await Promise.all([
    sb.from("shows").select("*").eq("slug", slug).single(),
    sb.from("episodes").select("*").eq("show_slug", slug).order("pub_date", { ascending: false }).limit(50),
  ]);
  if (!show) return null;
  return { show: show as Show, episodes: (episodes ?? []) as Episode[] };
}

export default async function PodcastShowPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getShowAndEpisodes(slug);
  if (!data) notFound();
  const { show, episodes } = data;

  // Gate every episode for the library (real server-side paywall).
  // Non-entitled episodes get audio_url/video_url/mux_playback_id nulled + truncated description.
  // This prevents full media leakage from the show page (library + latest) into EpisodePlayer or UI.
  const gatedEpisodes = await Promise.all((episodes || []).map((ep: any) => gatePodcastEpisode(ep)));
  const latest = gatedEpisodes[0] ?? null;

  // Episodes now carry real optional video_url / mux_playback_id / thumbnail_url / chapters (jsonb)
  // from DB (populated via seed, admin, or RSS parser for video enclosures). 
  // /podcasts/colony-report (after reseed) shows real VIDEO episode(s) with toggle/viz/chapters.
  // Gated versions are passed so locked episodes have no playable URLs.
  const playableEpisodes = gatedEpisodes;

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "PodcastSeries",
        "@id": `${SITE_URL}/podcasts/${show.slug}#podcast`,
        name: show.title,
        description: show.description,
        url: `${SITE_URL}/podcasts/${show.slug}`,
        image: `${SITE_URL}${podcastCover(slug, show.cover_url as string | null)}`,
        author: { "@type": "Person", name: show.host },
        publisher: { "@id": `${SITE_URL}/#organization` },
        webFeed: `${SITE_URL}/feeds/${show.slug}.xml`,
      }} />

      <main id="main">
        <div className="container">
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Podcasts", href: "/podcasts" },
            { label: show.title },
          ]} />

          <PageHeader
            eyebrow={`▼ ${episodes.length} EPISODES · HOSTED BY ${show.host.toUpperCase()}`}
            title={show.title}
            lede={show.description ?? undefined}
          />

          <div className="podcast-subscribe" aria-label={`Subscribe to ${show.title}`}>
            <span className="podcast-subscribe__label">▼ SUBSCRIBE</span>
            <a className="btn btn--outline btn--sm" href="https://podcasts.apple.com/" target="_blank" rel="noopener">Apple Podcasts</a>
            <a className="btn btn--outline btn--sm" href="https://open.spotify.com/" target="_blank" rel="noopener">Spotify</a>
            <a className="btn btn--outline btn--sm" href="https://podcasts.apple.com/" target="_blank" rel="noopener noreferrer">Apple / RSS</a>
            <a className="btn btn--outline btn--sm" href="https://rumble.com/thecolonyok" target="_blank" rel="noopener">Rumble</a>
            <a className="btn btn--outline btn--sm" href="https://youtube.com/@thecolonyok" target="_blank" rel="noopener">YouTube</a>
          </div>

          {latest && (
            <section className="section section--tight" aria-label="Latest episode">
              <header className="section-header">
                <span className="section-header__number">N°01</span>
                <div className="section-header__group">
                  <h2 className="section-title">Latest Episode</h2>
                  <span className="section-header__dateline">{latest.episode_no ? `EPISODE ${latest.episode_no} · ` : ""}{formatDate(latest.pub_date)}</span>
                </div>
                <a className="section-link" href="#library">All Episodes →</a>
              </header>

              <article className="live-section live-section--even">
                <div className="pod-latest-main">
                  <div className="pod-latest-meta">
                    EPISODE {latest.episode_no ?? "—"} · {formatDurationLabel(latest.duration_s)}
                  </div>
                  <h3 className="pod-latest-title">{latest.title}</h3>
                  {latest.description && <p className="pod-latest-desc">{latest.description}</p>}
                  <div className="pod-latest-actions">
                    {latest.fullAccess && latest.audio_url ? (
                      <a className="btn btn--primary" href="#library">▶ Play Episode</a>
                    ) : (
                      <Link className="btn btn--primary" href={`/podcasts/${slug}/${latest.slug || latest.id}`}>Members — Listen on episode page</Link>
                    )}
                    <a className="btn btn--outline" href="#library">Show Notes</a>
                  </div>
                </div>
                <div className="live-sidebar">
                  <span className="badge badge--new">NEW</span>
                  <h3 className="live-status__title">Latest Episode</h3>
                  <p className="live-status__description">{latest.description ? latest.description.slice(0, 120) + "…" : "Full episode now available."}</p>
                  <Link className="btn btn--ink btn--full" href="#library">Listen Now</Link>
                </div>
              </article>
            </section>
          )}

          <section className="section" id="library" aria-label="Episode library">
            <header className="section-header">
              <span className="section-header__number">N°02</span>
              <div className="section-header__group">
                <h2 className="section-title">Episode Library</h2>
                <span className="section-header__dateline">{episodes.length} EPISODES</span>
              </div>
            </header>

            <EpisodePlayer episodes={playableEpisodes as any} />
          </section>

          <section className="section" aria-label="Host">
            <header className="section-header">
              <span className="section-header__number">N°03</span>
              <div className="section-header__group">
                <h2 className="section-title">The Host</h2>
                <span className="section-header__dateline">{show.host.toUpperCase()}</span>
              </div>
            </header>

            <div className="grid-feature">
              <div className="host-bio">
                <div className="host-bio__photo">
                  <Image
                    src={hostPhoto(show.slug ?? "", null, show.host)}
                    alt={`${show.host} — host of The Colony OK`}
                    width={120}
                    height={120}
                  />
                </div>
                <div className="host-bio__content">
                  <h3 className="host-bio__name">{show.host}</h3>
                  <p className="host-bio__desc">{show.description}</p>
                </div>
              </div>
              <div className="host-contact">
                <div className="host-contact__label">▼ CONTACT</div>
                <p className="host-contact__info">
                  {show.host.toLowerCase().split(" ")[0]}@thecolonyok.com<br />
                  P.O. Box 12, OKC OK 73101
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
