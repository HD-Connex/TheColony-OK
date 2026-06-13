import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import SectionRail from "../_components/SectionRail";
import FilterBar from "../_components/FilterBar";
import LiveStageMount from "../_components/LiveStageMount";
import ContinueRail from "../_components/ContinueRail"; // Enhanced ContinueRail reuse on /watch for discovery breadth (site-wide)
import WatchlistButton from "../_components/WatchlistButton"; // Reuse on more video cards (series/episodes) for stories/episodes/clips discovery
import { type StageItem } from "../_components/LiveStage";
import { getVideoSeries, getSeriesEpisodes, type VideoSeries, type VideoEpisode } from "@/lib/series";
import { getArticles } from "@/lib/articles"; // for AI For You seed in rec rail
import { getLiveEvents, eventsToStageItems, type LiveEvent } from "@/lib/live-events";
import { getShowsWithEpisodeCounts, type ShowWithCount } from "@/lib/podcasts";
import { whenLabel } from "@/lib/format";
import { safeStockImage, STOCK } from "@/lib/media-map";
import { getTrendingClips } from "@/lib/homepage"; // Reuse trending (clips + stories helpers) from homepage lib for discovery breadth (no new file)
import { getRelatedArticles } from "@/lib/articles"; // Phase 2: now powered by lib/recommendations (embedding+collab) for "For You" related rails

export const metadata: Metadata = {
  title: "Watch",
  description: "Unified video home — Netflix-style browse for The Colony shows, live broadcasts, video episodes, and trending member clips. Energy. Ag. Truth. Faith. Freedom.",
  alternates: { canonical: "/watch" },
};

export const revalidate = 60;

interface ClipRow {
  id: string;
  dispatch_type?: string | null;
  upvotes: number;
  created_at: string;
  transcript?: string | null;
  source_phrase?: string | null;
  storage_path?: string | null;
  duration_s?: number | null;
  start_s?: number | null;
  ep_id?: string | null;
  county?: string | null;
  episodes?: { title?: string | null; slug?: string | null } | null;
}

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; pillar?: string }>;
}) {
  const sp = await searchParams;
  const activeFilter = (sp.filter ?? "all").toLowerCase();
  const pillarFilter = sp.pillar as string | undefined;

  // Data-driven fetches (seed-backed via lib + direct public clips)
  const [seriesAll, liveBundle, podcastData] = await Promise.all([
    getVideoSeries().catch(() => [] as VideoSeries[]),
    getLiveEvents().catch(() => ({ live: [] as LiveEvent[], upcoming: [] as LiveEvent[], replays: [] as LiveEvent[] })),
    getShowsWithEpisodeCounts(12).catch(() => ({ shows: [] as ShowWithCount[], totalShows: 0, totalEpisodes: 0 })),
  ]);

  // Recent video episodes: pull published eps from seeded series (data-driven, limited)
  const seriesForEpisodes = seriesAll.slice(0, 6);
  const episodesWithSeries: Array<VideoEpisode & { series: VideoSeries }> = [];
  for (const s of seriesForEpisodes) {
    try {
      const eps = await getSeriesEpisodes(s.id);
      for (const ep of eps.slice(0, 2)) {
        episodesWithSeries.push({ ...ep, series: s });
      }
    } catch {
      // skip series with no eps
    }
  }
  // Sort recent episodes by published_at desc (fallback recency)
  const recentEpisodes = episodesWithSeries
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
    .slice(0, 12);

  // Public trending clips (data-driven via RLS-approved + reused getTrendingClips; seed may be empty → graceful)
  let clips: ClipRow[] = [];
  try {
    const raw = await getTrendingClips(12).catch(() => []);
    // Map to local ClipRow shape (adds optional episodes join; home helper omits for simplicity but sufficient for cards)
    clips = (raw as any[]).map((r: any) => ({
      id: r.id,
      dispatch_type: r.dispatch_type,
      upvotes: r.upvotes ?? 0,
      created_at: r.created_at,
      transcript: r.transcript,
      source_phrase: r.source_phrase,
      storage_path: r.storage_path,
      duration_s: r.duration_s,
      start_s: r.start_s,
      ep_id: r.ep_id,
      county: r.county,
      episodes: null,
    })) as ClipRow[];
  } catch {
    clips = [];
  }

  // Group series by pillar (truth/faith/freedom from seed) + special Ag/Energy row
  const byPillar: Record<string, VideoSeries[]> = { truth: [], faith: [], freedom: [], other: [] };

  // Phase 2 AI recs visible: "For You" rail powered by recommendations (embedding sim + usage collab). Falls back gracefully.
  let forYou: any[] = [];
  try {
    const [seedArts] = await Promise.all([ getArticles({ limit: 1 }).catch(() => []) ]);
    if (seedArts[0]?.slug) {
      forYou = await getRelatedArticles(seedArts[0].slug, 4).catch(() => []);
    }
  } catch {}
  for (const s of seriesAll) {
    const p = (s.pillar || "other").toLowerCase();
    if (byPillar[p]) byPillar[p].push(s);
    else byPillar.other.push(s);
  }

  // Ag + Energy breadth row (data-driven heuristic on seeded titles/desc + pillar)
  const agEnergySeries = seriesAll.filter((s) =>
    /ag|energy|farm|rural|harvest|underground|patch|oil|pipeline/i.test(
      `${s.title} ${s.tagline ?? ""} ${s.description ?? ""} ${s.pillar ?? ""}`
    )
  );

  // Live data reuse
  const liveNow = liveBundle.live;
  const upcoming = liveBundle.upcoming.slice(0, 6);
  const liveItems: StageItem[] = eventsToStageItems([...liveNow, ...liveBundle.replays.slice(0, 4)], whenLabel);

  // Podcast shows reuse (for "Recent Shows" breadth mix)
  const podcastShows = podcastData.shows;

  // Filter series if pillar param active (for FilterBar + server-driven)
  let filteredSeries = seriesAll;
  if (pillarFilter && ["truth", "faith", "freedom"].includes(pillarFilter)) {
    filteredSeries = seriesAll.filter((s) => s.pillar === pillarFilter);
  }

  // Top level FilterBar options (reuse component + searchParams pattern like /stories)
  const filterOptions = [
    { key: "all", label: "ALL VIDEO", href: "/watch" },
    { key: "live", label: "LIVE NOW", href: "/watch?filter=live" },
    { key: "shows", label: "SHOWS", href: "/watch?filter=shows" },
    { key: "episodes", label: "EPISODES", href: "/watch?filter=episodes" },
    { key: "clips", label: "CLIPS", href: "/watch?filter=clips" },
    { key: "pillars", label: "BY PILLAR", href: "/watch?filter=pillars" },
  ];
  const currentFilter = ["live", "shows", "episodes", "clips", "pillars"].includes(activeFilter) ? activeFilter : "all";

  // Helper card renderers (pure CSS brutalist reuse: .card, .series-card, episode styles, grids, no new DS)
  const SeriesVideoCard = ({ s }: { s: VideoSeries }) => {
    const img = safeStockImage("show", s.slug, s.poster_url ?? s.hero_url);
    const meta = [s.pillar, s.type, s.is_oklahoma ? "OK" : null].filter(Boolean).join(" · ");
    return (
      <Link href={`/shows/${s.slug}`} className="series-card" style={{ minWidth: 180, flex: "0 0 auto" }}>
        <div className="series-card__poster">
          <Image
            src={img}
            alt={s.title}
            fill
            sizes="180px"
            style={{ objectFit: "cover" }}
            unoptimized={!!(s.poster_url ?? s.hero_url)?.startsWith("http")}
          />
        </div>
        <div className="series-card__body">
          <h3 className="series-card__title">{s.title}</h3>
          <p className="series-card__meta">{meta || "VIDEO SERIES"}</p>
          {s.tagline && <p className="fine-print" style={{ marginTop: 4 }}>{s.tagline}</p>}
          {/* Reuse WatchlistButton on series cards in watch hub (for episodes/clips/stories discovery cards) */}
          <div onClick={(e) => e.preventDefault()} style={{ marginTop: 4 }}>
            <WatchlistButton seriesId={s.id} className="btn btn--sm btn--outline" />
          </div>
        </div>
      </Link>
    );
  };

  const EpisodeVideoCard = ({ ep, s }: { ep: VideoEpisode; s: VideoSeries }) => {
    const thumb = safeStockImage("podcast", s.slug, ep.thumbnail_url);
    const dur = ep.duration_seconds ? `${Math.floor(ep.duration_seconds / 60)}m` : "";
    const num = ep.episode_number != null ? `S${ep.season_number ?? 1}·E${ep.episode_number}` : "";
    return (
      <Link href={`/shows/${s.slug}/${ep.slug}`} className="card card--article" style={{ minWidth: 220, flex: "0 0 auto", border: "var(--rule-hairline) solid var(--color-border)" }}>
        <div className="card__image" style={{ aspectRatio: "16/9", position: "relative" }}>
          <Image src={thumb} alt={ep.title} fill sizes="220px" style={{ objectFit: "cover" }} />
          {dur && <span style={{ position: "absolute", bottom: 4, right: 4, fontSize: "10px", background: "var(--color-ink)", color: "var(--color-paper)", padding: "1px 4px" }}>{dur}</span>}
        </div>
        <div className="card__body" style={{ padding: "var(--space-3)" }}>
          <div className="card__meta" style={{ fontSize: "10px" }}>
            <span className="card__category">{s.title.toUpperCase().slice(0, 18)}</span>
            {num && <span>{num}</span>}
          </div>
          <h4 className="card__title" style={{ fontSize: "var(--text-base)", margin: "4px 0" }}>{ep.title}</h4>
          {ep.description && <p className="card__excerpt" style={{ fontSize: "var(--text-xs)" }}>{ep.description.slice(0, 90)}…</p>}
          {/* WatchlistButton reuse via parent series (episodes cards context) */}
          <div onClick={(e) => e.preventDefault()} style={{ marginTop: 6 }}>
            <WatchlistButton seriesId={s.id} className="btn btn--sm btn--outline" />
          </div>
        </div>
      </Link>
    );
  };

  const LiveTile = ({ e, isLive }: { e: LiveEvent; isLive?: boolean }) => (
    <Link href="/live" className="card" style={{ minWidth: 200, flex: "0 0 auto", border: "var(--rule-hairline) solid var(--color-border)", padding: "var(--space-4)" }}>
      <div className="card__meta">
        <span className="card__category">{isLive ? "LIVE" : "SCHEDULED"}</span>
        <span className="card__date">{whenLabel(e)}</span>
      </div>
      <h3 className="card__title" style={{ fontSize: "var(--text-lg)", margin: "var(--space-2) 0" }}>{e.title}</h3>
      {e.description && <p className="card__excerpt" style={{ fontSize: "var(--text-sm)" }}>{e.description.slice(0, 110)}</p>}
      {e.tier_required !== "free" && <span className="badge badge--members" style={{ marginTop: 6 }}>{e.tier_required.toUpperCase()}</span>}
    </Link>
  );

  const ClipTile = ({ c }: { c: ClipRow }) => {
    const title = c.transcript || c.source_phrase || "Citizen Dispatch";
    const dur = c.duration_s ? `${Math.floor(c.duration_s / 60)}:${String(c.duration_s % 60).padStart(2, "0")}` : "";
    const epInfo = (c.episodes as any) || {};
    const viewHref = c.ep_id ? `/podcasts/${epInfo.show_slug || "colony-report"}/${epInfo.slug || c.ep_id}${c.start_s != null ? `?t=${c.start_s}` : ""}` : "/clips";
    return (
      <Link href={viewHref} className="card" style={{ minWidth: 200, flex: "0 0 auto", border: "var(--rule-hairline) solid var(--color-border)", padding: "var(--space-3)" }}>
        <div className="card__meta" style={{ fontSize: "10px" }}>
          <span className="card__category">{c.dispatch_type === "citizen_dispatch" ? "CITIZEN DISPATCH" : "MEMBER CLIP"}</span>
          <span>{new Date(c.created_at).toLocaleDateString().toUpperCase()}</span>
        </div>
        <h4 className="card__title" style={{ fontSize: "var(--text-base)", margin: "var(--space-1) 0" }}>{title.slice(0, 72)}</h4>
        <div className="card__meta" style={{ fontSize: "10px", marginTop: 6 }}>
          <span>▲ {c.upvotes}</span>
          {dur && <span>· {dur}</span>}
          {c.county && <span>· {c.county} CO</span>}
        </div>
      </Link>
    );
  };

  const PodcastShowTile = ({ p }: { p: ShowWithCount }) => (
    <Link href={`/podcasts/${p.slug}`} className="card" style={{ minWidth: 180, flex: "0 0 auto", border: "var(--rule-hairline) solid var(--color-border)", padding: "var(--space-4)" }}>
      <div className="card__meta">
        <span className="card__category">PODCAST</span>
        <span>{p.episodes} EPS</span>
      </div>
      <h3 className="card__title" style={{ fontSize: "var(--text-lg)" }}>{p.title}</h3>
      <p className="fine-print">{p.host}</p>
    </Link>
  );

  return (
    <main id="main" className="page--inner">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Watch" }]} />
        <PageHeader
          eyebrow="▼ PHASE 1 1.2 · UNIFIED VIDEO HUB"
          title="Watch"
          lede="Netflix-style browse across the full breadth: live, premium shows, video episodes, and community clips. Data-driven from seed. Brutalist pure-CSS rails. Truth · Faith · Freedom · Ag &amp; Energy."
        />

        {/* Top filter bar reuse (server searchParams driven; self links preserve hub) */}
        <FilterBar options={filterOptions} activeKey={currentFilter} />

        {/* Featured LIVE (reuse LiveStageMount if live present — fits the hub player preview) */}
        {(currentFilter === "all" || currentFilter === "live") && (
          <section className="section section--tight" aria-label="Live Now">
            <SectionRail
              title="LIVE NOW"
              dateline={liveNow.length > 0 ? `${liveNow.length} ON AIR` : "CHANNEL GUIDE + REPLAYS"}
              linkHref="/live"
              linkLabel="Watch Live →"
            >
              {liveNow.length > 0 ? (
                <div style={{ display: "flex", gap: "var(--space-4)", paddingBottom: "var(--space-4)" }}>
                  {liveNow.slice(0, 2).map((e) => (
                    <LiveTile key={e.id} e={e} isLive />
                  ))}
                  {/* Compact stage preview fits the rich hub browse (reuses existing component + pure CSS container) */}
                  {liveItems.length > 0 && (
                    <div style={{ minWidth: 320, flex: "1 1 320px", border: "var(--rule-hairline) solid var(--color-border)", overflow: "hidden" }}>
                      <LiveStageMount items={liveItems} initialActiveId={liveNow[0]?.id ?? null} compact hideInteractivity />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", gap: "var(--space-4)", paddingBottom: "var(--space-4)" }}>
                  {upcoming.slice(0, 4).map((e) => (
                    <LiveTile key={e.id} e={e} />
                  ))}
                  <Link href="/live" className="card" style={{ minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", border: "var(--rule-hairline) solid var(--color-border)" }}>
                    OPEN FULL LIVE HUB →
                  </Link>
                </div>
              )}
            </SectionRail>
          </section>
        )}

        {/* Recent Shows row (reuse getVideoSeries + getShowsWithEpisodeCounts podcast data for breadth) */}
        {(currentFilter === "all" || currentFilter === "shows") && (
          <section className="section section--tight" aria-label="Recent Shows">
            <SectionRail title="RECENT SHOWS" dateline="VIDEO SERIES + PODCAST NETWORK" linkHref="/shows" linkLabel="All Shows →">
              <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-4)", scrollbarWidth: "thin" }}>
                {filteredSeries.slice(0, 6).map((s) => (
                  <SeriesVideoCard key={s.id} s={s} />
                ))}
                {podcastShows.slice(0, 4).map((p) => (
                  <PodcastShowTile key={`pod-${p.slug}`} p={p} />
                ))}
                <Link href="/shows" className="series-card" style={{ minWidth: 140, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", border: "var(--rule-hairline) solid var(--color-border)" }}>
                  BROWSE FULL CATALOG →
                </Link>
              </div>
            </SectionRail>
          </section>
        )}

        {/* By Pillar rails (data-driven from series.pillar in seed) + Ag/Energy special */}
        {(currentFilter === "all" || currentFilter === "pillars" || currentFilter === "shows") && (
          <>
            {(["truth", "faith", "freedom"] as const).map((pKey) => {
              const list = (pillarFilter && pillarFilter !== pKey ? [] : byPillar[pKey]) || [];
              if (list.length === 0 && !pillarFilter) return null;
              const label = pKey === "truth" ? "TRUTH PILLAR" : pKey === "faith" ? "FAITH PILLAR" : "FREEDOM PILLAR";
              return (
                <section key={pKey} className="section section--tight" aria-label={label}>
                  <SectionRail
                    title={label}
                    dateline="SERIES &amp; EPISODES"
                    linkHref={pillarFilter === pKey ? "/watch" : `/watch?pillar=${pKey}`}
                    linkLabel={pillarFilter === pKey ? "Clear Pillar" : "Filter this pillar →"}
                  >
                    <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-4)" }}>
                      {list.length > 0 ? (
                        list.map((s) => <SeriesVideoCard key={s.id} s={s} />)
                      ) : (
                        <p className="fine-print">No series in this pillar yet.</p>
                      )}
                    </div>
                  </SectionRail>
                </section>
              );
            })}

            {/* Ag & Energy breadth example row (explicitly called for in spec) */}
            {agEnergySeries.length > 0 && (
              <section className="section section--tight" aria-label="Ag & Energy">
                <SectionRail title="AG &amp; ENERGY" dateline="RURAL OK • FARM • OIL • PATCH" linkHref="/shows?region=oklahoma" linkLabel="Oklahoma Originals →">
                  <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-4)" }}>
                    {agEnergySeries.map((s) => (
                      <SeriesVideoCard key={s.id} s={s} />
                    ))}
                  </div>
                </SectionRail>
              </section>
            )}
          </>
        )}

        {/* Recent Video Episodes rail (from getSeriesEpisodes + series) */}
        {(currentFilter === "all" || currentFilter === "episodes") && (
          <section className="section section--tight" aria-label="Recent Video Episodes">
            <SectionRail title="TRENDING VIDEO EPISODES" dateline={`${recentEpisodes.length} FROM SEED CATALOG`} linkHref="/shows" linkLabel="All Episodes →">
              <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-4)" }}>
                {recentEpisodes.length > 0 ? (
                  recentEpisodes.map((ep) => (
                    <EpisodeVideoCard key={ep.id} ep={ep} s={ep.series} />
                  ))
                ) : (
                  <p className="fine-print">Episodes will appear here once series are published with video.</p>
                )}
              </div>
            </SectionRail>
          </section>
        )}

        {/* Trending Video Clips (clips data reuse + /clips patterns) */}
        {(currentFilter === "all" || currentFilter === "clips") && (
          <section className="section section--tight" aria-label="Trending Video Clips">
            <SectionRail title="TRENDING VIDEO CLIPS" dateline={clips.length ? `${clips.length} TOP APPROVED` : "MEMBER DISPATCHES"} linkHref="/clips" linkLabel="Open Dispatches →">
              <div style={{ display: "flex", gap: "var(--space-4)", overflowX: "auto", paddingBottom: "var(--space-4)" }}>
                {clips.length > 0 ? (
                  clips.map((c) => <ClipTile key={c.id} c={c} />)
                ) : (
                  <>
                    {/* Graceful when no seed clips (data-driven reality) */}
                    <div className="card" style={{ minWidth: 200, flex: "0 0 auto", border: "var(--rule-hairline) solid var(--color-border)", padding: "var(--space-4)" }}>
                      <div className="card__meta"><span className="card__category">CLIPS</span></div>
                      <h3 className="card__title" style={{ fontSize: "var(--text-base)" }}>No clips yet</h3>
                      <p className="fine-print">Members create 30s dispatches in players or upload. Top-voted surface here and in digests.</p>
                      <Link href="/clips" className="btn btn--sm btn--outline" style={{ marginTop: 8 }}>Browse /clips</Link>
                    </div>
                    <Link href="/live" className="card" style={{ minWidth: 160, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", border: "var(--rule-hairline) solid var(--color-border)" }}>LIVE CLIPS FROM STREAMS →</Link>
                  </>
                )}
              </div>
            </SectionRail>
          </section>
        )}

        {/* Site-wide ContinueRail reuse (watch hub) — discovery breadth for progress/resume across video */}
        <ContinueRail />

        {/* Phase 2 AI: For You recommendations rail — embedding similarity + usage collab via lib/recommendations (powers related everywhere now). Real DB only, gated. Visible in /watch hub. */}
        {forYou.length > 0 && (
          <section className="section section--tight" style={{ marginTop: "var(--space-4)" }}>
            <SectionRail title="FOR YOU — AI RECS" dateline="EMBEDDING + COLLAB FROM USAGE" linkHref="/search" linkLabel="More →">
              <ul className="chapter-list">
                {forYou.map((r: any, i: number) => (
                  <li key={i}>
                    <Link href={r.href || `/stories/${r.slug}`} className="chapter-btn">
                      {r.title || r.slug} <span className="fine-print">({r.type || "story"})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionRail>
          </section>
        )}

        {/* Hub footer actions + discovery (pure brutalist, no tailwind hacks) */}
        <div className="section section--tight" style={{ borderTop: "var(--rule-hairline) solid var(--color-border)", marginTop: "var(--space-8)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
            <Link href="/shows" className="btn btn--primary btn--sm">Full Shows Library</Link>
            <Link href="/live" className="btn btn--outline btn--sm">Enter Live Hub</Link>
            <Link href="/clips" className="btn btn--outline btn--sm">Citizen Dispatches Feed</Link>
            <Link href="/podcasts" className="btn btn--outline btn--sm">Podcast Network</Link>
            <span className="fine-print" style={{ marginLeft: "auto" }}>Data from seed · updated every 60s · pure CSS SectionRail grids</span>
          </div>
          <p className="fine-print" style={{ marginTop: "var(--space-4)" }}>
            This is the unified /watch breadth home (Phase 1 1.2). All rows are server-rendered and seed-driven. Use the filter chips above to narrow. Click any card for deep links into players and full pages.
          </p>
        </div>

        {/* Aesthetic stock for hub polish (reuse pattern from live/shows) */}
        <div className="section-lead-image" style={{ marginTop: "var(--space-6)" }}>
          <Image
            src={STOCK.slateDefault}
            alt="The Colony unified video library — shows, live, clips, episodes"
            width={1200}
            height={280}
            className="img-aesthetic"
          />
        </div>
      </div>
    </main>
  );
}
