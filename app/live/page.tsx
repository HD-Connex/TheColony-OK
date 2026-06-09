import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import JsonLd from "../_components/JsonLd";
import Countdown from "../_components/Countdown";
import LiveStageMount from "../_components/LiveStageMount";
import { type StageItem } from "../_components/LiveStage";
import LivePlatformTabs from "../_components/LivePlatformTabs";
import ClipsTeaser from "../_components/ClipsTeaser";
import { getLiveEvents, eventsToStageItems, tierLocked, tierLabel, type LiveEvent } from "@/lib/live-events";
import { whenLabel, formatLiveWhen } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Watch Live",
  description: "Live broadcasts and replays from The Colony — Oklahoma news, live events, and the full archive. Streamed free and members-only.",
  alternates: { canonical: "/live" },
};

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ "247"?: string }>;
}) {
  const { "247": q247 } = await searchParams;
  const prefer247 = q247 === "1";

  const { live, upcoming, replays } = await getLiveEvents();

  const items: StageItem[] = eventsToStageItems([...live, ...replays], whenLabel);

  const nextLive = live[0] ?? upcoming[0];
  const schedule = [...live, ...upcoming].slice(0, 3);
  const isOnAir = live.length > 0;
  const countdownTarget =
    nextLive?.scheduled_start ?? new Date(Date.now() + 4 * 3_600_000).toISOString();

  return (
    <>
      {live[0] && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "BroadcastEvent",
          name: live[0].title,
          description: live[0].description ?? undefined,
          startDate: live[0].actual_start ?? live[0].scheduled_start ?? undefined,
          isLiveBroadcast: true,
          publisher: { "@id": "https://thecolonyok.com/#organization" },
        }} />
      )}

      <main id="main">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Watch Live" }]} />
          <PageHeader
            eyebrow="▼ SECTION N°03 · LIVE TV HUB"
            title="Watch Live"
            lede="Oklahoma's independent broadcast. Mon/Wed/Fri 7PM CT live + full archive. Multi-platform mirror (YouTube, Rumble, site). TV-guide schedule, real-time community, and seamless replays — built for the hub."
          />

          <LivePlatformTabs />

          <section className="live-section section--tight" aria-label="Current broadcast">
            <div className="live-player">
              <LiveStageMount
                items={items}
                initialActiveId={live[0]?.id ?? null}
                prefer247={prefer247}
              />
            </div>

            <div className="live-sidebar">
              <div className="live-status">
                <span className="badge badge--new">{isOnAir ? "ON AIR" : "TONIGHT"}</span>
                {nextLive && (
                  <span className="text-mono text-upper text-xs">
                    {nextLive.title.slice(0, 24).toUpperCase()}
                  </span>
                )}
              </div>
              <h2 className="live-status__title">{nextLive?.title ?? "Schedule coming soon"}</h2>
              {nextLive?.description && <p className="live-status__description">{nextLive.description}</p>}
              <Countdown target={countdownTarget} label="▼ COUNTDOWN" variant="alarm" />

              <div className="schedule-list">
                {schedule.length > 0 ? (
                  schedule.map((e, i) => (
                    <div
                      className={`schedule-item${i === 0 ? " schedule-item--current" : ""}`}
                      key={e.id}
                    >
                      <span className="schedule-item__time">{formatLiveWhen(e).toUpperCase()}</span>
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

              <Link className="btn btn--ink btn--full" href="/shows">
                Browse All Shows
              </Link>

              <ClipsTeaser count={15} />
            </div>
          </section>

          {upcoming.length > 0 && (
            <section className="section" aria-label="Upcoming broadcasts">
              <header className="section-header">
                <span className="section-header__number">N°01</span>
                <div className="section-header__group">
                  <h2 className="section-title">Channel Guide — Upcoming</h2>
                  <span className="section-header__dateline">{upcoming.length} SCHEDULED</span>
                </div>
              </header>
              <div className="grid-4">
                {upcoming.map((e) => (
                  <div className="schedule-tile" key={e.id}>
                    <div className="schedule-tile__day">{whenLabel(e)}</div>
                    <h3 className="schedule-tile__title">{e.title}</h3>
                    {tierLocked(e.tier_required) && <span className="badge badge--members">{tierLabel(e.tier_required)}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {replays.length > 0 && (
            <section className="section" aria-label="Replays">
              <header className="section-header">
                <span className="section-header__number">N°02</span>
                <div className="section-header__group">
                  <h2 className="section-title">Replays</h2>
                  <span className="section-header__dateline">{replays.length} BROADCASTS</span>
                </div>
                <Link className="section-link" href="/shows">
                  All Shows →
                </Link>
              </header>
              <div className="grid-3">
                {replays.slice(0, 3).map((e) => (
                  <article className="card card--article" key={e.id}>
                    <div className="card__body">
                      <div className="card__meta">
                        <span className="card__category">REPLAY</span>
                        <span className="card__date">{whenLabel(e)}</span>
                      </div>
                      <h3 className="card__title">{e.title}</h3>
                      {e.description && <p className="card__excerpt">{e.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}