import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";
import JsonLd from "../../_components/JsonLd";
import Countdown from "../../_components/Countdown";
import { supabasePublic, type Show, type Episode } from "@/lib/supabase";
import EpisodePlayer from "../../_components/EpisodePlayer";
import { hostPhoto } from "@/lib/media-map";
import { formatDate, formatDurationLabel } from "@/lib/format";

export const revalidate = 60;

const SITE_URL = "https://thecolonyok.com";

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
    openGraph: { type: "website", title: show.title as string, images: show.cover_url ? [show.cover_url as string] : undefined },
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
  const latest = episodes[0];

  // Episodes now carry real optional video_url / mux_playback_id / thumbnail_url / chapters (jsonb)
  // from DB (populated via seed, admin, or RSS parser for video enclosures). 
  // /podcasts/colony-report (after reseed) shows real VIDEO episode(s) with toggle/viz/chapters.
  const playableEpisodes = episodes;

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "PodcastSeries",
        "@id": `${SITE_URL}/podcasts/${show.slug}#podcast`,
        name: show.title,
        description: show.description,
        url: `${SITE_URL}/podcasts/${show.slug}`,
        image: show.cover_url ? `${SITE_URL}${show.cover_url}` : undefined,
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
            <a className="btn btn--outline btn--sm" href={`/feeds/${show.slug}.xml`}>RSS</a>
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
                <div style={{ backgroundColor: "var(--color-ink-soft)", padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)", justifyContent: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "var(--track-wider)", textTransform: "uppercase", color: "var(--color-alarm)" }}>
                    EPISODE {latest.episode_no ?? "—"} · {formatDurationLabel(latest.duration_s)}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: "var(--track-tight)", lineHeight: 1 }}>{latest.title}</h3>
                  {latest.description && <p style={{ color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)" }}>{latest.description}</p>}
                  <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                    {latest.audio_url && <a className="btn btn--primary" href="#library">▶ Play Episode</a>}
                    <a className="btn btn--outline" href="#library">Show Notes</a>
                  </div>
                </div>
                <div className="live-sidebar" style={{ backgroundColor: "var(--color-alarm)" }}>
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
              <div style={{ padding: "var(--space-6)", borderRight: "var(--rule-hairline) solid var(--color-border)", display: "flex", gap: "var(--space-6)", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0 }}>
                  <Image
                    src={hostPhoto(show.slug ?? "", null, show.host)}
                    alt={`${show.host} — host of The Colony OK`}
                    width={120}
                    height={120}
                    style={{ borderRadius: "var(--radius-sm)", objectFit: "cover", border: "var(--rule-medium) solid var(--color-border-light)" }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: "var(--track-tight)", marginBottom: "var(--space-4)" }}>{show.host}</h3>
                  <p style={{ color: "var(--color-text-secondary)", lineHeight: "var(--leading-relaxed)", marginBottom: "var(--space-4)" }}>{show.description}</p>
                </div>
              </div>
              <div style={{ padding: "var(--space-6)", backgroundColor: "var(--color-ink-soft)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "var(--track-wider)", textTransform: "uppercase", color: "var(--color-alarm)", marginBottom: "var(--space-3)" }}>▼ CONTACT</div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--color-paper)", lineHeight: "var(--leading-relaxed)" }}>
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
