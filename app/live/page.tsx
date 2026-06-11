import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import JsonLd from "../_components/JsonLd";
import Countdown from "../_components/Countdown";
import LiveStageMount from "../_components/LiveStageMount";
import { type StageItem } from "../_components/LiveStage";
import LivePlatformTabs from "../_components/LivePlatformTabs";
import ClipsTeaser from "../_components/ClipsTeaser";
import LiveChat from "../_components/LiveChat";
import { Paywall } from "../_components/Paywall";
import { getLiveEvents, eventsToStageItems, tierLocked, tierLabel, type LiveEvent, isMembersOnly } from "@/lib/live-events";
import { whenLabel, formatLiveWhen } from "@/lib/format";

// Phase 2 server SSR check (new @supabase/ssr) + entitlements for primary live visibility gating in page shell.
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isActiveMember } from "@/lib/entitlements";

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

  // Phase 2: SSR + new Supabase client + entitlements for "Off the Record" visibility check on primary live.
  // (Client-side LiveStage also gates on switch using useAuth isMember for full queue support.)
  const cookieStore = await cookies();
  const supabaseSsr = createClient(cookieStore);
  const { data: { user } } = await supabaseSsr.auth.getUser();
  const isActiveMemberUser = user ? await isActiveMember(user.id) : false;
  const primaryLive = live[0];
  const primaryIsOffRecord = primaryLive ? isMembersOnly(primaryLive) : false;

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
                hideInteractivity
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
                      <span className="schedule-item__show">The Colony Report — Live with Jake Merrick</span>
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

              <ClipsTeaser count={15} />

              {/* Live chat in sidebar container (global or event) to keep player clean and text contained */}
              {/* Phase 2: use server-computed isActiveMemberUser (from SSR) for chat gate; client will align via useAuth */}
              <LiveChat liveEventId={live[0]?.id ?? null} isMember={isActiveMemberUser} currentUser={null} />

              {/* Aesthetic life image for live section */}
              <div className="section-lead-image">
                <Image
                  src="/assets/images/slates/colony-247-slate.jpg"
                  alt="The Colony 24/7 live feed"
                  width={800}
                  height={300}
                  className="img-aesthetic"
                />
              </div>
            </div>
          </section>

          {/* Phase 2 Off the Record page-level gate (brass Paywall) for primary live when visibility=members and !active member.
              Complements client LiveStage gate (which handles realtime active switching + queue). Non-members see this + paywall in player via LiveStage. */}
          {primaryIsOffRecord && !isActiveMemberUser && (
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