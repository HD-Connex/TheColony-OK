"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { whenLabel, formatLiveWhen } from "@/lib/format";
import { STOCK } from "@/lib/media-map";
import { getLiveEvents, eventsToStageItems, type LiveEvent } from "@/lib/live-events";
import LiveStageMount from "../_components/LiveStageMount";
import { type StageItem } from "../_components/LiveStage";
import LivePlatformTabs from "../_components/LivePlatformTabs";
import ClipsTeaser from "../_components/ClipsTeaser";
import LiveChat from "../_components/LiveChat";
import LiveNowBar from "../_components/LiveNowBar";
import ThreadedComments from "../_components/ThreadedComments";
import Countdown from "../_components/Countdown";
import NewsletterSignup from "../_components/NewsletterSignup";
import { Paywall } from "../_components/Paywall";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import JsonLd from "../_components/JsonLd";
import { tierLocked, tierLabel } from "@/lib/tiers";

const EliteMux24x7Player = dynamic(
  () => import("../_components/EliteMux24x7Player"),
  { ssr: false }
);

interface LiveClientProps {
  isMember: boolean;
  user?: any;
}

export default function LiveClient({ isMember, user }: LiveClientProps) {
  const [stageItems, setStageItems] = useState<StageItem[]>([]);
  const [, setActiveTab] = useState("live");
  const [isLoading, setIsLoading] = useState(true);
  const [live, setLive] = useState<LiveEvent[]>([]);
  const [schedule, setSchedule] = useState<LiveEvent[]>([]);
  const [upcoming, setUpcoming] = useState<LiveEvent[]>([]);
  const [replays, setReplays] = useState<LiveEvent[]>([]);
  const [prefer247] = useState(false);
  const [isOnAir, setIsOnAir] = useState(false);
  const [nextLive, setNextLive] = useState<LiveEvent | null>(null);
  const [countdownTarget, setCountdownTarget] = useState<string | null>(null);
  const [primaryLive, setPrimaryLive] = useState<LiveEvent | null>(null);
  const [primaryIsOffRecord, setPrimaryIsOffRecord] = useState(false);

  useEffect(() => {
    async function fetchLiveData() {
      try {
        // getLiveEvents() returns a LiveBundle ({ live, upcoming, replays });
        // flatten to a LiveEvent[] so the date-based logic below keeps working.
        const bundle = await getLiveEvents();
        const events: LiveEvent[] = [...bundle.live, ...bundle.upcoming, ...bundle.replays];
        setLive(events);
        
        const now = new Date();
        const current = events.find(e => 
          e.actual_start && new Date(e.actual_start) <= now && 
          (!e.ended_at || new Date(e.ended_at) >= now)
        );
        const upcomingEvents = events.filter(e => 
          e.scheduled_start && new Date(e.scheduled_start) > now
        );
        const replaysList = events.filter(e => 
          e.ended_at && new Date(e.ended_at) < now
        );
        
        setSchedule(events);
        setUpcoming(upcomingEvents);
        setReplays(replaysList);
        setIsOnAir(!!current);
        setNextLive(current || upcomingEvents[0] || null);
        
        if (current || upcomingEvents[0]) {
          const target = current?.ended_at || upcomingEvents[0]?.scheduled_start || null;
          setCountdownTarget(target);
        }

        setPrimaryLive(current || upcomingEvents[0] || null);
        setPrimaryIsOffRecord(current?.title?.includes('Off the Record') || false);

        // Map the current LiveEvent to a StageItem via the shared helper
        // (StageItem is { id, title, kind, src, isLive, when, locked, tierLabel, visibility }).
        const items: StageItem[] = current ? eventsToStageItems([current], whenLabel) : [];

        setStageItems(items);
      } catch (error) {
        console.error("Failed to fetch live data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveData();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

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
            lede="Oklahoma's independent broadcast. Soft launch YT path: Jake Merrick YouTube ( /live src ) — FREE for anyone (no paywall). Full archive + multi-platform mirror. 24/7 Jake YT fallback outside the window."
          />

          <LivePlatformTabs />

          <section className="live-section section--tight" aria-label="Current broadcast">
            <div className="live-stage-host">
              {prefer247 ? (
                <EliteMux24x7Player />
              ) : (
                <LiveStageMount
                  items={stageItems}
                  initialActiveId={live[0]?.id ?? null}
                  prefer247={prefer247}
                  hideInteractivity
                />
              )}
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
                      <span className="schedule-item__time">TONIGHT 7PM EST</span>
                      <span className="schedule-item__show">The Colony Report — Live with Jake Merrick (Jake YT src path — FREE no paywall)</span>
                    </div>
                    <div className="schedule-item">
                      <span className="schedule-item__time">THU 6PM</span>
                      <span className="schedule-item__show">Patriot Hour</span>
                    </div>
                    <div className="schedule-item">
                      <span className="schedule-item__time">SAT 10AM</span>
                      <span className="schedule-item__show">OK Underground — Field Report</span>
                    </div>
                    <div className="schedule-item">
                      <span className="schedule-item__time">TUE 7PM</span>
                      <span className="schedule-item__show">Energy OK — Patch Dispatch</span>
                    </div>
                  </>
                )}
              </div>

              <Link className="btn btn--ink btn--full" href="/shows">
                Browse All Shows
              </Link>

              <NewsletterSignup
                variant="sidebar"
                source="live-sidebar"
                title="Get the briefing"
                copy="Live drops + county editions in your inbox."
                compact
              />

              <ClipsTeaser count={15} />

              <LiveChat liveEventId={live[0]?.id ?? null} isMember={isMember} currentUser={null} />

              {live[0]?.id && (
                <ThreadedComments
                  targetType="live"
                  targetId={live[0].id}
                  isMember={isMember}
                  currentUserId={user?.id ?? null}
                />
              )}

              <div className="section-lead-image">
                <Image
                  src={STOCK.slateDefault}
                  alt="The Colony 24/7 live feed (Jake Merrick YouTube demo stream)"
                  width={800}
                  height={300}
                  className="img-aesthetic"
                />
              </div>
            </div>
          </section>

          {primaryIsOffRecord && !isMember && !(
            primaryLive?.video_url?.includes('jakemerrick212/live')
          ) && (
            <div className="container" style={{ marginTop: 'var(--space-8)' }}>
              <Paywall
                title="Off the Record"
                message="Off the Record is for members only."
                brass
                perk="OFF_THE_RECORD_LIVE"
                returnUrl="/live"
              />
            </div>
          )}

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