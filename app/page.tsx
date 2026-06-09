import Link from "next/link";
import JsonLd from "./_components/JsonLd";
import Countdown from "./_components/Countdown";
import StoryCard from "./_components/StoryCard";
import LiveStageMount from "./_components/LiveStageMount";
import { type StageItem } from "./_components/LiveStage";
import MotionStagger, { MotionStaggerItem } from "./_components/motion/MotionStagger";
import { PODCAST_ART, storyHero } from "@/lib/media-map";
import Image from "next/image";
import { getArticles, type Article } from "@/lib/articles";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";
import { getLiveEvents, eventsToStageItems } from "@/lib/live-events";
import { formatDate, formatHeroDateline, formatTimeCT, formatLiveWhen, whenLabel } from "@/lib/format";
import { CONTRIBUTOR_PLANS } from "@/lib/contributor-plans";

export const revalidate = 60;

const SITE_URL = "https://thecolonyok.com";

function authorName(a: Article): string {
  return (a.contributor?.name ?? "THE COLONY STAFF").toUpperCase();
}

export default async function HomePage() {
  const [latest, podcast, live] = await Promise.all([
    getArticles({ limit: 8 }),
    getShowsWithEpisodeCounts(4),
    getLiveEvents(),
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

      <main id="main">
        <section className="hero" aria-label="Lead story">
          <div className="hero__grid">
            <article className="hero__primary">
              <p className="hero__dateline">
                <span>N°43 / <strong>VOL I</strong></span>
                <span>{formatHeroDateline(hero?.published_at)}</span>
                <span>INVESTIGATIONS DESK</span>
              </p>
              <p className="hero__eyebrow">{hero?.category ?? "Investigative Report"}</p>
              <h1 className="hero__title">
                {hero ? (
                  <Link href={`/stories/${hero.slug}`}>{hero.title}</Link>
                ) : (
                  "What They Don't Want You to Know About Oklahoma's Budget Crisis"
                )}
              </h1>
              <p className="hero__excerpt">
                {hero?.description ?? hero?.dek ?? "Our journalists spent six weeks inside the state capitol. What we found will make you angry — and it's why independent media exists."}
              </p>
              <div className="hero__meta">
                <span>{authorName(hero ?? ({} as Article))}</span>
                <span className="hero__meta-divider" />
                <span>8 MIN READ</span>
                <span className="hero__meta-divider" />
                <span>FILED {formatDate(hero?.published_at) || "MAY 28, 2026"}</span>
              </div>
              <div className="hero__actions">
                {hero && <Link className="btn btn--primary btn--lg" href={`/stories/${hero.slug}`}>Read the Report</Link>}
                <Link className="btn btn--outline btn--lg" href="/pricing">Join — $4.99/mo</Link>
              </div>
            </article>

            <aside className="hero__secondary hero__secondary--paper" aria-label="Live tonight">
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
              <div className="hero__secondary-block hero__secondary--ink">
                <div className="hero__secondary-label">STARTS IN</div>
                <Countdown target={countdownTarget} variant="ink" />
                <Link className="btn btn--outline btn--full" href="/live" style={{ marginTop: "var(--space-5)" }}>
                  Watch Live
                </Link>
              </div>
            </aside>
          </div>
        </section>

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
              {topLead && <StoryCard a={topLead} variant="lead" />}
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
                      src={show.cover_url ?? PODCAST_ART[show.slug] ?? "/assets/images/podcasts/colony-report.jpg"}
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
                />
              </div>

              <div className="live-sidebar live-sidebar--paper">
                <div className="live-status">
                  <span className="badge badge--new">{isOnAir ? "ON AIR" : "TONIGHT"}</span>
                  {nextLive && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", letterSpacing: "var(--track-wide)" }}>
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

        <section className="section section--paper">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°04</span>
              <div className="section-header__group">
                <h2 className="section-title">Daily News</h2>
                <span className="section-header__dateline">FILED THIS MORNING · {newsItems.length} ITEMS</span>
              </div>
              <Link className="section-link" href="/news">
                All News →
              </Link>
            </header>

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

        <section className="section section--alarm">
          <div className="container">
            <header className="section-header">
              <span className="section-header__number">N°06</span>
              <div className="section-header__group">
                <h2 className="section-title">Join the Masthead</h2>
                <span className="section-header__dateline">CONTRIBUTOR · FEATURED · HEADLINER</span>
              </div>
              <Link className="section-link" href="/contributors/join">
                Apply Now →
              </Link>
            </header>

            <div className="contrib-plan-grid" aria-label="Contributor pricing tiers">
              {CONTRIBUTOR_PLANS.map((plan) => (
                <article
                  key={plan.id}
                  className={`contrib-plan-card${plan.highlight ? " contrib-plan-card--highlight" : ""}`}
                >
                  <p className="contrib-plan-card__eyebrow">
                    {plan.highlight ? "▼ MOST POPULAR" : `▼ ${plan.tier.toUpperCase()}`}
                  </p>
                  <h3 className="contrib-plan-card__name">{plan.name}</h3>
                  <div>
                    <span className="contrib-plan-card__price">${plan.price}</span>{" "}
                    <span className="contrib-plan-card__period">/ month</span>
                  </div>
                  <p className="contrib-plan-card__summary">{plan.exposureSummary}</p>
                  <Link
                    className={`btn ${plan.highlight ? "btn--primary" : "btn--ink"} btn--full`}
                    href={`/contributors/join?plan=${plan.id}`}
                  >
                    Apply — {plan.name}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="membership-cta" aria-label="Membership">
          <div className="membership-cta__inner">
            <div className="membership-cta__lead">
              <p className="membership-cta__eyebrow">▼ JOIN THE COLONY · N°07</p>
              <h2 className="membership-cta__title">Independent press costs less than a cup of coffee.</h2>
              <p className="membership-cta__subtitle">
                Full access to every article, every podcast, every live broadcast — from journalists who answer to
                readers, not advertisers.
              </p>
              <ul className="membership-cta__features">
                <li className="membership-cta__feature">All investigative articles — no paywall</li>
                <li className="membership-cta__feature">Full podcast library across every show</li>
                <li className="membership-cta__feature">Live streams + replay archives</li>
                <li className="membership-cta__feature">Members-only briefings and bonus episodes</li>
                <li className="membership-cta__feature">Cancel anytime — no contracts</li>
              </ul>
            </div>

            <div className="membership-cta__price-card">
              <div className="membership-cta__price">
                <span className="membership-cta__amount">$4.99</span>
                <span className="membership-cta__period">/MONTH</span>
              </div>
              <div className="membership-cta__actions">
                <Link className="btn btn--primary btn--lg btn--full" href="/pricing">
                  Join Now
                </Link>
                <Link className="btn btn--outline btn--full" href="/pricing">
                  What&apos;s Included
                </Link>
              </div>
              <p className="membership-cta__disclaimer">Secure checkout via Stripe</p>
            </div>
          </div>
          <div className="membership-cta__footer-band">▼ 1,200+ OKLAHOMANS JOINED THIS MONTH</div>
        </section>
      </main>
    </>
  );
}