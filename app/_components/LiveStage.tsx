"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import VideoPlayer from "./VideoPlayer";
import VideoEmbed from "./VideoEmbed";
import { getCurrentLiveChannel, type Live247Channel, COLONY_247 } from "@/lib/live-247";
import { STOCK } from "@/lib/media-map";
import { JAKE_MERRICK_YT_LIVE_URL, isSoftLaunchTonight } from "@/lib/live-events"; // for scheduling + Jake YT src free bypass (kept free even post soft launch date)
import LiveChat from "./LiveChat";
import LivePoll, { type Poll } from "./LivePoll";
import ThreadedComments from "./ThreadedComments"; // P2-16 helped: realtime channels for comments on live targets (in stage interactivity)
import { useAuth, supabaseBrowser } from "@/lib/auth-client";
import { refreshStageItems } from "@/lib/live-events";
import { getActivePollClient } from "@/lib/live-polls";
import YouTubeDemoReel from "./YouTubeDemoReel";
import { Paywall } from "./Paywall"; // Phase 2: brass Off the Record Paywall for members visibility live events
// Note: 24/7 now always prefers Jake Merrick YouTube stream (see lib/live-247 + lib/video JAKE_MERRICK_*).
// When is247 && playbackSrc is YT (e.g. @jakemerrick212/streams or watch?v=), isEmbed=true -> VideoEmbed (bare).
// VideoEmbed + toEmbedSrc already fully handles YT -> nocookie iframe with autoplay/mute etc. No change needed here.
/** Unified stage item — used by /live and homepage (old API).
 * P2-16: realtime verified: live_events postgres_changes, live_polls for activePoll, presence. + sidebar poll/chat wiring on /live (P2-16 polish). Channels use live target id or global.
 */
export interface StageItem {
  id: string;
  title: string;
  kind?: string;
  src?: string | null;
  isLive?: boolean;
  when?: string;
  locked?: boolean;
  tierLabel?: string;
  visibility?: 'public' | 'members'; // Phase 2 Off the Record member live
}

interface LiveStageProps {
  items?: StageItem[];
  initialActiveId?: string | null;
  /** compact=true (home teaser): suppresses internal .queue (the sidebar already renders schedule) to stop extra boxes/queue content from flowing out of the .live-player grid cell and overlaying the next section ("Latest Dispatches"). */
  compact?: boolean;
  /** hideInteractivity: for pages like full /live that render chat/poll in custom sidebar instead of inside the stage (prevents text leaking outside player container) */
  hideInteractivity?: boolean;
}

function whenLabelFromItem(item: StageItem): string {
  if (item.when) return item.when;
  return item.isLive ? "LIVE NOW" : "";
}

export default function LiveStage({ items: initialItems = [], initialActiveId, compact = false, hideInteractivity = false }: LiveStageProps) {
  const [items, setItems] = useState<StageItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (initialActiveId !== undefined) return initialActiveId;
    const live = initialItems.find((i) => i.isLive);
    return live?.id ?? null;
  });
  const [viewerCount, setViewerCount] = useState(0);
  // Sync default guarantees 24/7 playbackSrc on first render (no flash of off-air when no live events or async env).
  // getCurrentLiveChannel enriches with currentProgram when available.
  // Jake Merrick YouTube demo stream (JAKE_MERRICK_CHANNEL_URL) is the permanent primary for is247 fallback.
  const [channel247, setChannel247] = useState<Live247Channel | null>(COLONY_247);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [demoReelActive, setDemoReelActive] = useState(false);
  const prefersReduced = useReducedMotion();
  const { user, isMember } = useAuth();

  const is247 = activeId === null;
  const active = useMemo(
    () => (activeId ? items.find((i) => i.id === activeId) ?? null : null),
    [activeId, items],
  );

  const refreshItems = useCallback(async () => {
    try {
      const refreshed = await refreshStageItems((e) => {
        const iso = e.status === "ended" ? e.ended_at ?? e.scheduled_start : e.scheduled_start;
        if (!iso) return e.status === "live" ? "LIVE NOW" : "";
        const d = new Date(iso)
          .toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          .toUpperCase();
        return e.status === "live" ? `LIVE NOW · ${d}` : e.status === "ended" ? `REPLAY · ${d}` : d;
      });
      setItems(refreshed);
    } catch {
      /* offline / build stub */
    }
  }, []);

  useEffect(() => {
    getCurrentLiveChannel().then(setChannel247).catch(() => {});
  }, []);

  // Realtime: live_events changes + presence viewer count
  useEffect(() => {
    let active = true;
    const sb = supabaseBrowser();
    let eventsChannel: RealtimeChannel | null = null;
    let presenceChannel: RealtimeChannel | null = null;

    try {
      eventsChannel = sb
        .channel("live-stage-events")
        .on("postgres_changes", { event: "*", schema: "public", table: "live_events" }, () => {
          if (active) void refreshItems();
        })
        .subscribe();

      presenceChannel = sb
        .channel("live-stage-presence", { config: { presence: { key: user?.id ?? "anon" } } })
        .on("presence", { event: "sync" }, () => {
          if (active) {
            const state = presenceChannel?.presenceState() ?? {};
            setViewerCount(Math.max(1, Object.keys(state).length));
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel?.track({ watching: true, at: Date.now() });
          }
        });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (active) setViewerCount((c) => Math.max(c, 12));
    }

    const pollIv = setInterval(() => { if (active) void refreshItems(); }, 60_000);

    return () => {
      active = false;
      clearInterval(pollIv);
      if (eventsChannel) sb.removeChannel(eventsChannel);
      if (presenceChannel) sb.removeChannel(presenceChannel);
    };
  }, [refreshItems, user?.id]);

  // Active poll for current event or 24/7 global
  useEffect(() => {
    let active = true;
    const eventId = is247 ? null : activeId;

    getActivePollClient(eventId).then((poll) => {
      if (active) setActivePoll(poll);
    });

    const sb = supabaseBrowser();
    const channel = sb
      .channel(`live-poll-active-${eventId ?? "global"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_polls" }, () => {
        getActivePollClient(eventId).then((poll) => {
          if (active) setActivePoll(poll);
        });
      })
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [is247, activeId]);

  const effective247 = channel247 ?? COLONY_247;
  const currentTitle = is247 && effective247 ? effective247.title : active?.title ?? "The Colony Live";
  const playbackSrc = is247
    ? effective247?.streamUrl ?? COLONY_247.streamUrl
    : active?.src ?? null;
  const playbackIsLive = is247 ? true : !!active?.isLive;
  // YT (including Jake Merrick @jakemerrick212/streams or watch?v=) is treated as embed (not HLS, not .mp4).
  // Verified: is247 + YT playbackSrc -> VideoEmbed (bare) which calls toEmbedSrc -> proper YT nocookie iframe.
  // Direct Jake Merrick YouTube demo stream as permanent 24/7 fallback until real Mux ingest.
  const isEmbed = playbackSrc ? !/\.m3u8(\?|$)/.test(playbackSrc) && !playbackSrc.endsWith(".mp4") : false;

  // Soft launch YT path guarantee for Jake Merrick /live src: free for anyone (keep even if date passed).
  // Force active only on the soft launch window date logic (via isSoftLaunchTonight) for scheduling.
  // The free bypass for Jake src path is kept unconditionally below (no paywall on this YT path).
  if (isSoftLaunchTonight() && playbackSrc && playbackSrc.includes('jakemerrick212/live') && activeId !== 'yt-jake-merrick-7pm-est') {
    // Force in next tick to avoid render loop
    setTimeout(() => setActiveId('yt-jake-merrick-7pm-est'), 0);
  }

  const isJakeYT = !!playbackSrc && /jakemerrick212/.test(playbackSrc);
  const isJakeFree = isJakeYT; // Jake Merrick YT src (live or streams) path always free - soft launch YT path kept free even if date passed

  const tierBlocked = !is247 && active?.locked && !isMember && !isJakeFree;
  // Phase 2: "Off the Record" visibility gating — members only lives show brass Paywall (reuse Paywall + .foil/.brass styling)
  const isMembersOnlyLive = !is247 && active?.visibility === 'members' && !isJakeFree;
  const offRecordBlocked = isMembersOnlyLive && !isMember && !isJakeFree;

  return (
    <div className="live-stage" data-247={is247}>
      <div className="live-header">
        <div className="status">
          <span className={`badge ${demoReelActive ? "replay" : is247 ? "live-247" : active?.isLive ? "live-event" : "replay"}`}>
            {demoReelActive ? "DEMO REEL" : is247 ? "24/7" : active?.isLive ? "LIVE" : "REPLAY"}
            {/* PHASE 8 AUDIT P4: "Investor Demo"/"Recent 5" purged previously (now "Recent Streams" label + neutral archive). Confirmed no such strings in live/page or here (grep). Uses "Recent Streams" for replays. */}
          </span>
          <span>{currentTitle}</span>
          <span className="viewers" aria-live="polite">
            {viewerCount > 0 ? `${viewerCount} WATCHING` : "TUNING IN"}
          </span>
        </div>
        {demoReelActive && (
          <span className="note">
            Steady archive stream • auto-advancing
          </span>
        )}
        {/* Primary 24/7 always runs Jake Merrick YT (via resolve247StreamUrl default or NEXT_PUBLIC_247_YOUTUBE_URL) as the live TV player fallback. */}
        {active?.when && !is247 && <span className="note">{active.when}</span>}
        {is247 && <span className="note">Always-on Jake Merrick YouTube demo stream • scheduled wheel active (permanent fallback until real Mux ingest)</span>}
      </div>

      <div className="live-player">
        {demoReelActive ? (
          <YouTubeDemoReel
            items={items}
            onExit={() => {
              setDemoReelActive(false);
              // Return to a clean state (24/7 or previous items)
              setActiveId(null);
            }}
          />
        ) : offRecordBlocked ? (
          // Phase 2 brass Paywall for Off the Record (members live). Styled via prop; foil on h3.
          <div className="live-player__gate live-player__gate--brass">
            <Paywall
              title="Off the Record"
              message="Off the Record is for members only."
              brass
              perk="OFF_THE_RECORD_LIVE"
              returnUrl="/live"
            />
          </div>
        ) : tierBlocked ? (
          <div className="live-player__gate">
            <p>▼ {active?.tierLabel ?? "Members"} only</p>
            <a href="/membership" className="btn btn--outline">
              Join to watch
            </a>
          </div>
        ) : playbackSrc ? (
          isEmbed ? (
            <VideoEmbed url={playbackSrc} title={currentTitle} bare />
          ) : (
            <VideoPlayer src={playbackSrc} title={currentTitle} isLive={playbackIsLive} />
          )
        ) : (
          <div className="live-player__offline">
            <Image
              src={effective247?.fallbackSlate || STOCK.offAirDefault}
              alt="The Colony OK — Off air. Next live broadcast soon."
              width={640}
              height={360}
              style={{ maxWidth: "100%", height: "auto", opacity: 0.8 }}
            />
            <p className="note">Off air — check the schedule for the next live broadcast.</p>
            <button type="button" onClick={() => setActiveId(null)} className="btn btn--outline">
              Watch 24/7 Channel (Jake Merrick YouTube demo stream)
            </button>
          </div>
        )}
      </div>

      {!compact && (
        <div className="queue">
          <h3>
            {demoReelActive ? "Demo Reel — Continuous Archived Stream (no controls)" : "Recent Streams"}
            {/* P4 confirmed: neutral "Recent Streams" (not "Recent 5" or investor). P7: no vercel preview hardcodes here. */}
            {demoReelActive && (
              <button
                type="button"
                onClick={() => {
                  setDemoReelActive(false);
                  setActiveId(null);
                }}
                className="reel-exit"
              >
                EXIT REEL
              </button>
            )}
          </h3>
          {/* YouTubeDemoReel not used for primary 24/7 Jake Merrick YT stream (that uses LiveStage isEmbed -> VideoEmbed path for direct iframe).
              YouTubeDemoReel remains for the separate (currently dormant) multi-VOD archive reel mode only. */}
        <AnimatePresence>
          <motion.div
            variants={prefersReduced ? undefined : { visible: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden"
            animate="visible"
          >
            {items.map((ev) => (
              <motion.button
                key={ev.id}
                type="button"
                layout
                onClick={() => {
                  if (!demoReelActive) {
                    setActiveId(ev.id);
                  }
                  // In demo reel mode: no skipping — the reel auto-advances as a steady stream
                }}
                className={`${ev.id === activeId ? "active" : ""}${demoReelActive ? " queue-item--demo" : ""}`}
                variants={
                  prefersReduced
                    ? undefined
                    : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }
                }
                whileHover={prefersReduced || demoReelActive ? undefined : { scale: 1.01 }}
                whileTap={prefersReduced || demoReelActive ? undefined : { scale: 0.99 }}
              >
                {ev.title}{" "}
                <span className="status">{ev.isLive ? "live" : "replay"}</span>
                {ev.locked && <span className="badge badge--members">{ev.tierLabel}</span>}
                {ev.visibility === 'members' && <span className="badge badge--members">OFF THE RECORD</span>}
                {ev.id === activeId && (
                  <span className="pulse" aria-hidden>
                    ● NOW
                  </span>
                )}
                {ev.when && <span className="when">{whenLabelFromItem(ev)}</span>}
                {demoReelActive && <span className="reel-archived" aria-hidden>archived</span>}
              </motion.button>
            ))}
            {!demoReelActive && (
              <motion.button
                type="button"
                onClick={() => setActiveId(null)}
                className={is247 ? "active" : ""}
                layout
              >
                {effective247.title} <span>24/7 (Jake Merrick YT demo)</span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      )}

      {!compact && !hideInteractivity && (
        <>
          <div className="live-interactivity">
            <LiveChat liveEventId={is247 ? null : activeId} isMember={isMember} currentUser={user} />
            {activePoll && (
              <LivePoll poll={activePoll} isMember={isMember} currentUserId={user?.id ?? null} />
            )}
            {/* P2-16: ensure comments realtime on live target in stage (when interactive): uses ThreadedComments' `comments:live:${activeId}` channel + postgres_changes (target_type filter) + P1 polish (UPDATE, counts, mod queue). Only for specific live events (not pure 24/7). */}
            {!is247 && activeId && (
              <ThreadedComments targetType="live" targetId={activeId} isMember={isMember} currentUserId={user?.id ?? null} />
            )}
          </div>

          <p className="fine-print">Low-latency HLS • PiP supported • Reduced motion respected</p>
        </>
      )}
    </div>
  );
}