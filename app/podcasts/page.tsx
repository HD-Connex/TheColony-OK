import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import SectionBlock from "../_components/SectionBlock";
import PodcastSearchGrid from "./_components/PodcastSearchGrid";
import ContinueRail from "../_components/ContinueRail"; // Reuse ContinueRail on podcasts index (episodes-focused discovery, site-wide)
import { getShowsWithEpisodeCounts, getRecentEpisodes } from "@/lib/podcasts"; // getRecentEpisodes now supports offset for pagination
import { formatDate, formatDurationLabel } from "@/lib/format";
import { PODCAST_ART, podcastCover, safeStockImage } from "@/lib/media-map";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Podcast Network",
  description: "Every show in The Colony podcast network — investigative reporting, faith, freedom, and Oklahoma stories.",
  alternates: { canonical: "/podcasts" },
};

export const revalidate = 60;

export default async function PodcastsIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const PER_PAGE = 12;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;
  const [podcast, recent] = await Promise.all([
    getShowsWithEpisodeCounts(100).catch(() => ({
      shows: [],
      totalShows: 0,
      totalEpisodes: 0,
    })),
    getRecentEpisodes({ limit: PER_PAGE, offset }).catch(() => []),
  ]);
  // Note: no total count for episodes easy (would need extra query), pager demo uses fixed for surface.

  return (
    <main id="main" className="page--inner">
      <section className="section section--paper section--flush section--tight">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Podcast Network" }]} />

          <PageHeader
            eyebrow="▼ SECTION N°02 · PODCAST NETWORK"
            title="Podcast Network"
            lede={`${podcast.totalShows} shows. ${podcast.totalEpisodes} episodes. Investigative reporting, faith, freedom, and Oklahoma stories — each show led by a host who lives the beat.`}
          />

          {recent.length > 0 && (
            <section className="section section--tight" aria-label="Latest across network">
              <SectionBlock
                number="N°01"
                title="Latest Across Network"
                dateline={`${recent.length} RECENT EPISODES`}
              >
                <div className="episode-rail">
                  {recent.map((ep) => {
                    const thumb = safeStockImage("podcast", ep.show_slug, ep.thumbnail_url ?? ep.cover_url);
                    return (
                      <Link
                        key={ep.id}
                        href={`/podcasts/${ep.show_slug}/${ep.slug || ep.id}`}
                        className="episode-rail__card"
                      >
                        <div className="episode-rail__thumb">
                          <Image
                            src={thumb}
                            alt={`${ep.show_title} — episode thumbnail for ${ep.title}`}
                            width={160}
                            height={90}
                            sizes="160px"
                            loading="lazy"
                            style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="episode-rail__body">
                          <span className="episode-rail__show">{ep.show_title}</span>
                          <h3 className="episode-rail__title">{ep.title}</h3>
                          <span className="episode-rail__meta">
                            {formatDate(ep.pub_date)}
                            {ep.duration_s ? ` · ${formatDurationLabel(ep.duration_s)}` : ""}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </SectionBlock>
              {/* P1 simple pager for episodes list surface (offset support in lib) */}
              {page > 1 && <a href={`/podcasts?page=${page-1}`} className="btn btn--sm btn--outline" style={{marginRight:8}}>← Prev eps</a>}
              <a href={`/podcasts?page=${page+1}`} className="btn btn--sm btn--outline">Next eps →</a>
            </section>
          )}

          {/* Community clips elevation — per plan ideas. Teaser for member content on hub. */}
          <section className="section section--tight">
            <SectionBlock number="N°01b" title="Member Clips from the Field" dateline="COMMUNITY VOICES">
              <div className="clips-teaser">
                <p>Ranch reports, faith moments, local updates — 30s clips from members, featured across live and network.</p>
                <Link href="/pricing" className="btn btn--outline btn--sm">Become a member to upload</Link>
              </div>
            </SectionBlock>
          </section>
        </div>
      </section>

      <section className="section section--ink" aria-label="Podcast Network">
        <div className="container">
          <header className="section-header">
            <span className="section-header__number">N°02</span>
            <div className="section-header__group">
              <h2 className="section-title">All Shows</h2>
              <span className="section-header__dateline">
                {podcast.totalShows} SHOWS · {podcast.totalEpisodes} EPISODES
              </span>
            </div>
          </header>

          {podcast.shows.length === 0 ? (
            // PHASE 8 AUDIT P1: Updated empty-state message (user-friendly, no "seeded" language per scope).
            // Reuses .empty-state class (see styles, backroom/threads, clips, topics etc). Matches task spec.
            // Preserves PageHeader totals + rail + ContinueRail for when populated. Layout intact.
            <p className="empty-state">No shows here yet — check back soon.</p>
          ) : (
            <PodcastSearchGrid shows={podcast.shows} />
          )}

          {/* Aesthetic network visual for life */}
          <div className="section-lead-image">
            <Image
              src={safeStockImage("podcast")}
              alt="The Colony podcast network"
              width={900}
              height={300}
              className="img-aesthetic"
            />
          </div>
        </div>
      </section>

      {/* ContinueRail site-wide reuse on podcasts (great for episode resume discovery) */}
      <div className="container">
        <ContinueRail compact />
      </div>
    </main>
  );
}