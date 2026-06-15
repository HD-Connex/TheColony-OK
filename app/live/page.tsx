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
import LivePoll from "../_components/LivePoll";
import ThreadedComments from "../_components/ThreadedComments"; // P2-16: ensure realtime channels (comments:live:${id}) + postgres for live targets wired in hub (alongside LiveChat/LivePoll)
import { Paywall } from "../_components/Paywall";
import NewsletterSignup from "../_components/NewsletterSignup"; // Teaser newsletter / The Briefing block in sidebar (compact internal variant)
import { getLiveEvents, eventsToStageItems, tierLocked, tierLabel, type LiveEvent, isMembersOnly } from "@/lib/live-events";
import { getActivePoll } from "@/lib/live-polls";
import { whenLabel, formatLiveWhen } from "@/lib/format";
import { safeStockImage, STOCK } from "@/lib/media-map";

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

  // P2-16: wire live polls to /live sidebar (previously only inside LiveStage when !hideInteractivity).
  // Uses server getActivePoll (lib/live-polls.ts) + client LivePoll for realtime vote tally (postgres_changes on live_poll_votes + active poll listener).
  // Matches LiveStage + LiveChat pattern: target liveEventId (or null global). isMember + userId from SSR for gate/own-vote.
  const activePoll = await getActivePoll(primaryLive?.id ?? null);

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
                    {/* PHASE 8 AUDIT P3: Reconciled fallback schedule show names to seeded (supabase/seed-content.sql): The Colony Report, Patriot Hour, OK Underground, Energy OK + Ag Report series in /shows. Matches /advertise /about /vs/blaze /podcasts /journalists (5 shows, 5 staff: Sarah/Marcus/Rachel/Dan/Wes). 
                       P4: Confirmed no "Investor Demo" or "Recent 5" placeholders remain in live/page or _components (prior clean per audit docs; using "Replays" / "BROADCASTS" / "Recent" rails). Added this comment. If any, would replace e.g. "Recent Broadcasts". P8: Re-greped, all P1-7 + TWA/personalities/agentic/elite clean. */}
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

              {/* Newsletter teaser in live sidebar (compact internal variant, bottom of schedule area before clips) */}
              <NewsletterSignup
                variant="sidebar"
                source="live-sidebar"
                title="Get the briefing"
                copy="Live drops + county editions in your inbox."
                compact
              />

              <ClipsTeaser count={15} />

              {/* Live chat in sidebar container (global or event) to keep player clean and text contained */}
              {/* Phase 2: use server-computed isActiveMemberUser (from SSR) for chat gate; client will align via useAuth */}
              <LiveChat liveEventId={live[0]?.id ?? null} isMember={isActiveMemberUser} currentUser={null} />

              {/* P2-16 realtime wiring: Live polls now also in /live sidebar (hot path). Uses same liveEventId target for channel filter.
                  Realtime subscribe on live_polls (for active changes) + live_poll_votes (tally refresh) in LivePoll + LiveStage.
                  Chat uses live_chat_messages with live_event_id=eq filter for threaded per-target. Migrations 0004/0005 enable publication. */}
              {activePoll && (
                <LivePoll poll={activePoll} isMember={isActiveMemberUser} currentUserId={user?.id ?? null} />
              )}

              {/* P2-16: wire ThreadedComments for live target (uses its realtime postgres_changes INSERT/UPDATE on threaded_comments with target_type=live filter + channel `comments:live:${id}`; reuses P1 mod + nested). Complements LiveChat (simple messages) for full live discussion. */}
              {live[0]?.id && (
                <ThreadedComments
                  targetType="live"
                  targetId={live[0].id}
                  isMember={isActiveMemberUser}
                  currentUserId={user?.id ?? null}
                />
              )}

              {/* Aesthetic life image for live section */}
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

          {/* Phase 2 Off the Record page-level gate (brass Paywall) ... 
              Soft launch YT path kept FREE: SKIP entirely for the Jake YT /live src (free for anyone, no paywall).
              Even if soft launch date passed, the jake merrick src path remains free (per Phase 5 ops). Reversible via src check. */}
          {primaryIsOffRecord && !isActiveMemberUser && !(
            primaryLive?.video_url?.includes('jakemerrick212/live') /* jake merrick src always free path */
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
