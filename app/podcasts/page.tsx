import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";

export const metadata: Metadata = {
  title: "Podcast Network",
  description: "Every show in The Colony podcast network — investigative reporting, faith, freedom, and Oklahoma stories.",
  alternates: { canonical: "/podcasts" },
};

export const revalidate = 60;

const PODCAST_ART: Record<string, string> = {
  "colony-report": "/assets/images/podcast-colony-report.svg",
  "patriot-hour": "/assets/images/podcast-patriot-hour.svg",
  "oklahoma-underground": "/assets/images/podcast-ok-underground.svg",
  "faith-and-freedom": "/assets/images/podcast-faith-freedom.svg",
};

export default async function PodcastsIndexPage() {
  const podcast = await getShowsWithEpisodeCounts(100).catch(() => ({
    shows: [],
    totalShows: 0,
    totalEpisodes: 0,
  }));

  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Podcast Network" }]} />

        <section className="section" aria-label="Podcast Network">
          <header className="section-header">
            <span className="section-header__number">N°02</span>
            <div className="section-header__group">
              <h1 className="section-title">Podcast Network</h1>
              <span className="section-header__dateline">
                {podcast.totalShows} SHOWS · {podcast.totalEpisodes} EPISODES
              </span>
            </div>
          </header>

          {podcast.shows.length === 0 ? (
            <p className="empty-state">No shows here yet. Check back after the catalog is seeded.</p>
          ) : (
            <div className="podcast-grid">
              {podcast.shows.map((show, i) => (
                <Link className="podcast-card" href={`/podcasts/${show.slug}`} key={show.slug}>
                  <span className="podcast-card__number">SHOW N°{String(i + 1).padStart(2, "0")}</span>
                  <div className="podcast-card__art">
                    <img
                      src={show.cover_url ?? PODCAST_ART[show.slug] ?? "/assets/images/podcast-colony-report.svg"}
                      alt={`${show.title} cover art`}
                      loading="lazy"
                    />
                    <div className="podcast-card__play">
                      <div className="podcast-card__play-icon">
                        <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="podcast-card__body">
                    <div className="podcast-card__show-name">{show.title}</div>
                    <div className="podcast-card__host">{show.host}</div>
                    <div className="podcast-card__meta">
                      <span className="podcast-card__episodes">{show.episodes} Episodes</span>
                      {i === 0 && <span className="badge badge--live">NEW</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}