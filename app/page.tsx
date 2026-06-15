import Link from "next/link";
import dynamic from "next/dynamic";
import JsonLd from "./_components/JsonLd";
import Countdown from "./_components/Countdown";
import StoryCard from "./_components/StoryCard";
import LiveStageMount from "./_components/LiveStageMount";
import { type StageItem } from "./_components/LiveStage";
import MotionStagger, { MotionStaggerItem } from "./_components/motion/MotionStagger";
import MotionReveal from "./_components/motion/MotionReveal";
import { PODCAST_ART, storyHero, podcastCover, safeStockImage } from "@/lib/media-map";
import Image from "next/image";
import { getArticles, type Article } from "@/lib/articles";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";
import { getLiveEvents, eventsToStageItems } from "@/lib/live-events";
import { formatDate, formatHeroDateline, formatTimeCT, formatLiveWhen, whenLabel } from "@/lib/format";
import { CONTRIBUTOR_PLANS } from "@/lib/contributor-plans";
import ContinueRail from "./_components/ContinueRail";
import BuildingHubNotice from "./_components/BuildingHubNotice";
import { getFeaturedBlogPost } from "@/lib/blog-posts";
import { getHomepageBundle } from "@/lib/homepage";
// p2-13 LCP: dynamic import for below-fold SectionRails (after live/clips sections) to code-split framer-motion + rail chunks out of main LCP/hydration bundle.
// Hero/podcast-grid Motion kept above-fold for polish; bottom rails non-critical for LCP path. Reuses existing dynamic pattern from ClipsUploadForm.
const SectionRail = dynamic(() => import("./_components/SectionRail"), {
  loading: () => <div className="section-rail" style={{ minHeight: "120px", opacity: 0.5 }} aria-hidden="true">Loading stories…</div>,
});

// Phase 7 LCP/perf: defer non-critical below-fold client component (ClipsUploadForm is upload form, not discovery/lead content).
// Dynamic + ssr:false reduces initial JS bundle/hydration for LCP path. Reuses existing ClipsUploadForm (no rewrite).
// MotionStagger on podcast grid kept (above-fold polish + reuse motion primitive); later SectionRails use viewport-deferred MotionReveal/Stagger internally.
// p2-13: framer-motion (used via Motion* + StoryCard hover) inspected; easy split on rails done. Bundle impact: reduces main entry for LCP.
const ClipsUploadForm = dynamic(
  () => import("./_components/ClipsUploadForm"),
  {
    // Phase 7: ssr:false removed (not allowed in Server Components per Next 16/Turbopack; dynamic still lazy-loads chunk for perf/LCP deferral of below-fold form).
    loading: () => (
      <div className="clips-teaser" style={{ padding: "var(--space-8)", opacity: 0.7 }}>
        Member clips — sign in to upload field reports.
      </div>
    ),
  }
);

// p2-13 LCP: revalidate=60 kept for balance (fresh homepage content for news hub vs CDN/LCP cache); homepage bundle fetches prioritized in parallel below. Tune higher if static wins needed.
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

function authorName(a: Article): string {
  return (a.contributor?.name ?? "THE COLONY STAFF").toUpperCase();
}

export default async function HomePage() {
  // p2-13 LCP: above-fold fetches prioritized with Promise.all (getArticles for hero/lead + getHomepageBundle for rails + live/podcast counts).
  // All critical data for above-fold (hero, ticker, top stories, live, podcast network) resolved in parallel before render. No waterfall.
  // (getHomepageBundle also calls getArticles/getLive etc internally but cached in p2-14 later.)
  const [latest, podcast, live, bundle] = await Promise.all([
    getArticles({ limit: 8 }),
    getShowsWithEpisodeCounts(4),
    getLiveEvents(),
    getHomepageBundle(),
  ]);

  const hero = latest[0] ?? null;
  const topLead = latest[1] ?? latest[0] ?? null;
  const topSecondary = latest.slice(topLead === latest[0] ? 1 : 2, topLead === latest[0] ? 4 : 5);
  const newsItems = latest.slice(0, 3);
  const ticker = latest.slice(0, 6);

  const nextLive = live.live[0] ?? live.upcoming[0];
  const schedule = [...live.live, ...live.upcoming].slice(0, 3);
  const isOnAir = live.live.length > 0;
  const countdownTarget =
    nextLive?.scheduled_start ?? new Date(Date.now() + 4 * 3_600_000).toISOString();

  const liveItems: StageItem[] = eventsToStageItems([...live.live, ...live.replays], whenLabel);

  const todayLabel = new Date()
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    .toUpperCase();

  const featuredBlog = getFeaturedBlogPost();

  // Phase 1 homepage bundle rails (DB-driven, reuse existing)
  const { topStories, liveNow, trendingClips, latestEpisodes, contributorSpotlight, countyPulse, opinionRail, liveItems: hpLive } = bundle;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "The Colony OK",
          url: SITE_URL,
        }}
      />
      {/* Phase 4 SEO: additional rich results JsonLd — Organization + NewsMediaOrganization for E-E-A-T, rich SERP (logo, sameAs, contact). 
          Complements per-story NewsArticle/VideoObject in StoryCard pages + EpisodePlayer. 
          Sitemap updated for /watch /clips /briefing /topics etc for full discovery. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          name: "The Colony OK",
          url: SITE_URL,
          logo: `${SITE_URL}/assets/images/logo.jpg`,
          description: "Oklahoma's independent conservative press. Investigative journalism, podcasting, live programming, and daily news — funded by readers, not advertisers.",
          sameAs: ["https://thecolonyok.com"],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Editorial",
            url: `${SITE_URL}/submit-a-tip`,
          },
          publishingPrinciples: `${SITE_URL}/about`,
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "The Colony OK",
          url: SITE_URL,
          foundingDate: "2026",
          areaServed: "Oklahoma",
        }}
      />
      {/* p2-13 LCP fix for 10.7s audit: preload link for primary hero/lead story image (topLead StoryCard visual is LCP candidate; uses storyHero mapping like cards).
         Next.js priority on lead StoryCard also auto-injects <link preload> + fetchPriority high internally. This explicit aids above-fold image discovery.
         Placed early in tree. */}
      {topLead && (
        <link
          rel="preload"
          as="image"
          href={storyHero(topLead.slug, topLead.hero_url)}
          // Note: for production with srcset/sizes add imageSrcSet etc but single asset ok for seed.
        />
      )}

      <main id="main">
        {/* Phase 4: cinematic hero + standardized MotionReveal on lead elements for motion polish.
            .hero--cinematic adds overlays/grain/rule depth (see hero.css). Reduced-motion respected in primitives. */}
        <section className="hero hero--cinematic" aria-label="Lead story">
          <div className="hero__grid">
            <article className="hero__primary">
              <MotionReveal delay={0.02}>
                <p className="hero__dateline">
                  <span>N°43 / <strong>VOL I</strong></span>
                  <span>{formatHeroDateline(hero?.published_at)}</span>
                  <span>INVESTIGATIONS DESK</span>
                </p>
              </MotionReveal>
              <MotionReveal delay={0.05}>
                <p className="hero__eyebrow">{hero?.category ?? "Investigative Report"}</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h1 className="hero__title">
                  {hero ? (
                    <Link href={`/stories/${hero.slug}`}>{hero.title}</Link>
                  ) : (
                    "What They Don't Want You to Know About Oklahoma's Budget Crisis"
                  )}
                </h1>
              </MotionReveal>
              <MotionReveal delay={0.11}>
                <p className="hero__excerpt">
                  {hero?.description ?? hero?.dek ?? "Our journalists spent six weeks inside the state capitol. What we found will make you angry — and it's why independent media exists."}
                </p>
              </MotionReveal>
              <MotionReveal delay={0.14}>
                <div className="hero__meta">
                  <span>{authorName(hero ?? ({} as Article))}</span>
                  <span className="hero__meta-divider" />
                  <span>8 MIN READ</span>
                  <span className="hero__meta-divider" />
                  <span>FILED {formatDate(hero?.published_at) || "MAY 28, 2026"}</span>
                </div>
              </MotionReveal>
              <MotionReveal delay={0.17}>
                <div className="hero__actions">
                  {hero && <Link className="btn btn--primary btn--lg" href={`/stories/${hero.slug}`}>Read the Report</Link>}
                  <Link className="btn btn--outline btn--lg" href="/pricing">Join — $4.99/mo</Link>
                </div>
              </MotionReveal>
            </article>

            <aside className="hero__secondary hero__secondary--paper" aria-label="Live tonight">
              <MotionReveal>
                <div className="hero__secondary-block">
                  <div className="hero__secondary-label">
                    ▼ {isOnAir ? "LIVE NOW" : "LIVE TONIGHT · " + formatLiveWhen(nextLive)}
                  </div>
                  <h2 className="hero__secondary-title">
                    {nextLive?.title ?? "The Colony Report"}
                  </h2>
                  <p className="hero__secondary-meta">
                    {nextLive?.description ?? "Live from Oklahoma City — whistleblower interviews, governor's race, and your questions."}
                  </p>
                </div>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <div className="hero__secondary-block hero__secondary--ink">
                  <div className="hero__secondary-label">STARTS IN</div>
                  <Countdown target={countdownTarget} variant="ink" />
                  <Link className="btn btn--outline btn--full" href="/live">
                    Watch Live
                  </Link>
                </div>
              </MotionReveal>
            </aside>
          </div>
        </section>

        {featuredBlog && <BuildingHubNotice post={featuredBlog} />}

        {ticker.length > 0 && (
          <div className="ticker" aria-label="Latest news">
            <span className="ticker__label">LATEST</span>
            <div className="ticker__track">
              {[...ticker, ...ticker].map((a, i) => (
                <span className="ticker__item" key={`${a.slug}-${i}`}>
                  <Link href={`/stories/${a.slug}`}>{a.title}</Link>
                  <span className="ticker__filed">{formatTimeCT(a.published_at)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <section className="section section--paper">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°01</span>
              <div className="section-header__group">
                <h2 className="section-title">Top Stories</h2>
                <span className="section-header__dateline">
                  {todayLabel} · {String(latest.length).padStart(2, "0")} FILED THIS WEEK
                </span>
              </div>
              <Link className="section-link" href="/stories">
                All Stories →
              </Link>
            </header>

            <div className="grid-feature">
              {/* p2-13 LCP: topLead StoryCard gets priority (passed) + internal fetchPriority="high" + eager for primary hero visual (addresses 10.7s LCP from lead card img per audit/PERF_AUDIT.md).
                 fetchPriority high tells browser to prioritize this over other images; pairs with preload link above. */}
              {topLead && <StoryCard a={topLead} variant="lead" priority />}
              <div>
                {topSecondary.map((a, i) => (
                  <article className="card card--horizontal" key={a.id}>
                    <div className="card__image">
                      <Image
                        src={storyHero(a.slug, a.hero_url)}
                        alt={a.hero_alt ?? `${a.title} — Oklahoma investigative report`}
                        width={320}
                        height={180}
                        sizes="(max-width: 768px) 100vw, 320px"
                        loading="lazy"
                        // p2-13: added explicit fetchPriority high on first secondary (above-fold near hero) for LCP polish; non-leads stay lazy.
                        fetchPriority={i === 0 ? "high" : undefined}
                      />
                    </div>
                    <div className="card__body">
                      <div className="card__meta">
                        <span className="card__category">{a.category ?? "News"}</span>
                        <span className="card__date">{formatDate(a.published_at)}</span>
                        {a.member_only && <span className="badge badge--members">Members</span>}
                      </div>
                      <h3 className="card__title">
                        <Link href={`/stories/${a.slug}`}>{a.title}</Link>
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°02</span>
              <div className="section-header__group">
                <h2 className="section-title">Podcast Network</h2>
                <span className="section-header__dateline">
                  {podcast.totalShows} SHOWS · {podcast.totalEpisodes} EPISODES
                </span>
              </div>
              <Link className="section-link" href="/podcasts">
                All Shows →
              </Link>
            </header>

            <MotionStagger className="podcast-grid">
              {podcast.shows.map((show, i) => (
                <MotionStaggerItem key={show.slug}>
                <Link className="podcast-card" href={`/podcasts/${show.slug}`}>
                  <span className="podcast-card__number">SHOW N°{String(i + 1).padStart(2, "0")}</span>
                  <div className="podcast-card__art">
                    <Image
                      src={podcastCover(show.slug, show.cover_url)}
                      alt={`${show.title} — The Colony OK podcast cover`}
                      width={220}
                      height={220}
                      sizes="220px"
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
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°03</span>
              <div className="section-header__group">
                <h2 className="section-title">Watch Live</h2>
                <span className="section-header__dateline">BROADCAST 7PM CT · MON / WED / FRI</span>
              </div>
              <Link className="section-link" href="/live">
                Full Schedule →
              </Link>
            </header>

            <div className="live-section">
              <div className="live-player">
                <LiveStageMount
                  items={liveItems}
                  initialActiveId={live.live[0]?.id ?? null}
                  compact
                />
              </div>

              {/* Fixed placement: ContinueRail moved OUT of .live-player (aspect-ratio grid cell) to prevent overlay/breakage of the media stage. */}
              <ContinueRail />

              <div className="live-sidebar live-sidebar--paper">
                <div className="live-status">
                  <span className="badge badge--new">{isOnAir ? "ON AIR" : "TONIGHT"}</span>
                  {nextLive && (
                    <span className="mono-eyebrow">
                      {nextLive.title.toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="live-status__title">{nextLive?.title ?? "The Colony Report"}</h3>
                <p className="live-status__description">
                  {nextLive?.description ??
                    "Live coverage of the governor's race, whistleblower interviews, and real-time Q&amp;A."}
                </p>

                <Countdown target={countdownTarget} label="▼ COUNTDOWN" variant="alarm" />

                <div className="schedule-list">
                  {schedule.length > 0 ? (
                    schedule.map((e, i) => (
                      <div
                        className={`schedule-item${i === 0 ? " schedule-item--current" : ""}`}
                        key={e.id}
                      >
                        <span className="schedule-item__time">
                          {e.status === "live" ? "LIVE NOW" : formatLiveWhen(e).toUpperCase()}
                        </span>
                        <span className="schedule-item__show">{e.title}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="schedule-item schedule-item--current">
                        <span className="schedule-item__time">TONIGHT 7PM</span>
                        <span className="schedule-item__show">Colony Report</span>
                      </div>
                      <div className="schedule-item">
                        <span className="schedule-item__time">THU 6PM</span>
                        <span className="schedule-item__show">Patriot Hour Q&A</span>
                      </div>
                      <div className="schedule-item">
                        <span className="schedule-item__time">SAT 10AM</span>
                        <span className="schedule-item__show">OK Underground Field Report</span>
                      </div>
                    </>
                  )}
                </div>

                <Link className="btn btn--ink btn--full" href="/live">
                  Full Schedule
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Hub teaser — full depth lives on dedicated /news. Curated priority on home per agency hub model (inspired by newspaper front page + The Free Press/ProPublica excellence focus). */}
        <section className="section section--paper">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°04</span>
              <div className="section-header__group">
                <h2 className="section-title">Latest Dispatches</h2>
                <span className="section-header__dateline">CURATED FOR THE HUB · {newsItems.length} THIS MORNING</span>
              </div>
              <Link className="section-link" href="/news">
                Full News Desk →
              </Link>
            </header>

            {/* Aesthetic lead image for life (brutalist filter per DS) */}
            {/* p2-13 LCP: added fetchPriority="high" + loading eager to this lead/hero aesthetic image (above fold in hub section) + profile note.
               Primary LCP still the topLead StoryCard but this is visible early visual. Pairs with preload + StoryCard high prio.
               Bundle: framer split + above parallel + reval + preloads target the 10.7s LCP. */}
            <div className="section-lead-image">
              <Image
                src={safeStockImage("hero")}
                alt="Oklahoma investigations and rural reporting"
                width={1200}
                height={400}
                className="img-aesthetic"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className="grid-3">
              {newsItems.map((a) => (
                <article className="card card--article" key={a.id}>
                  <div className="card__body">
                    <div className="card__meta">
                      <span className="badge badge--category">{a.category ?? "State"}</span>
                      <span className="card__date">
                        {formatDate(a.published_at)} · {formatTimeCT(a.published_at)}
                      </span>
                    </div>
                    <h3 className="card__title">
                      <Link href={`/stories/${a.slug}`}>{a.title}</Link>
                    </h3>
                    {a.description && <p className="card__excerpt">{a.description}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Member clips upload — direct follow-up to "Latest Dispatches" community area (post side-quest overlay fix).
           Uses the Phase 2/3 clips backend (/api/clips/upload). Compact, token-aware form.
           Real uploads need member auth + BLOB_READ_WRITE_TOKEN. */}
        <section className="section section--paper">
          <div className="container">
            <ClipsUploadForm />
          </div>
        </section>

        {/* Phase 1 control room rails (minimal, using bundle; SectionRail for scrollable discovery) */}
        <SectionRail title="Top Stories" dateline="WEIGHTED RECENCY + IMPACT" linkHref="/stories" linkLabel="All →">
          <div className="grid-3">
            {topStories?.slice(0,3).map((s: any, i: number) => <StoryCard key={i} a={s as any} />)}
          </div>
        </SectionRail>

        <SectionRail title="Contributor Spotlight" dateline="OK VOICES" linkHref="/contributors">
          <div style={{display:'flex', gap:8}}>
            {contributorSpotlight?.slice(0,3).map((c: any, i: number) => <div key={i} className="card">{c.name}</div>)}
          </div>
        </SectionRail>

        {/* Hub teaser only — full depth + tiers on dedicated /contributors/join (per hub model + no-repeats rule in DS + audit Phase 1). */}
        <section className="section section--alarm">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°06</span>
              <div className="section-header__group">
                <h2 className="section-title">Join the Masthead</h2>
                <span className="section-header__dateline">CONTRIBUTOR · FEATURED · HEADLINER</span>
              </div>
              <Link className="section-link" href="/contributors/join">
                See Tiers &amp; Apply →
              </Link>
            </header>

            <div className="card card--horizontal">
              <div className="card__body">
                <p className="card__excerpt">
                  Contributor, Featured, and Headliner tiers with exposure across stories, shows, live, and the hub.
                  Full pricing, work rails, and application on the dedicated Contributors page.
                </p>
                <Link className="btn btn--ink btn--full" href="/contributors/join">
                  Apply to the Masthead
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Hub teaser only — full membership details + conversion on /pricing (home owns discovery, pricing owns the ask per DS). */}
        <section className="section section--paper">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°07</span>
              <div className="section-header__group">
                <h2 className="section-title">Become a Member</h2>
                <span className="section-header__dateline">READER-FUNDED · INDEPENDENT</span>
              </div>
              <Link className="section-link" href="/pricing">
                Full Details &amp; Join →
              </Link>
            </header>

            <div className="card card--horizontal">
              <div className="card__body">
                <p className="card__excerpt">
                  $4.99/mo unlocks every article, every podcast, every live broadcast and replay. No ads, no tracking, cancel anytime.
                  Exact perks, tiers, and secure Stripe checkout live on the Pricing page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}