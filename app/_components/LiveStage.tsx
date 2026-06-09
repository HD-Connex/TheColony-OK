"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import VideoPlayer from "./VideoPlayer";
import VideoEmbed from "./VideoEmbed";
import { getCurrentLiveChannel, type Live247Channel } from "@/lib/live-247";
import LiveChat from "./LiveChat";
import LivePoll, { type Poll } from "./LivePoll";
import { useAuth, supabaseBrowser } from "@/lib/auth-client";
import { refreshStageItems } from "@/lib/live-events";
import { getActivePollClient } from "@/lib/live-polls";
import YouTubeDemoReel from "./YouTubeDemoReel";
/** Unified stage item — used by /live and homepage (old API). */
export interface StageItem {
  id: string;
  title: string;
  kind?: string;
  src?: string | null;
  isLive?: boolean;
  when?: string;
  locked?: boolean;
  tierLabel?: string;
}

interface LiveStageProps {
  items?: StageItem[];
  initialActiveId?: string | null;
  /** compact=true (home teaser): suppresses internal .queue (the sidebar already renders schedule) to stop extra boxes/queue content from flowing out of the .live-player grid cell and overlaying the next section ("Latest Dispatches"). */
  compact?: boolean;
}

function whenLabelFromItem(item: StageItem): string {
  if (item.when) return item.when;
  return item.isLive ? "LIVE NOW" : "";
}

export default function LiveStage({ items: initialItems = [], initialActiveId, compact = false }: LiveStageProps) {
  const [items, setItems] = useState<StageItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (initialActiveId !== undefined) return initialActiveId;
    const live = initialItems.find((i) => i.isLive);
    return live?.id ?? null;
  });
  const [viewerCount, setViewerCount] = useState(0);
  const [channel247, setChannel247] = useState<Live247Channel | null>(null);
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
    const sb = supabaseBrowser();
    let eventsChannel: RealtimeChannel | null = null;
    let presenceChannel: RealtimeChannel | null = null;

    try {
      eventsChannel = sb
        .channel("live-stage-events")
        .on("postgres_changes", { event: "*", schema: "public", table: "live_events" }, () => {
          void refreshItems();
        })
        .subscribe();

      presenceChannel = sb
        .channel("live-stage-presence", { config: { presence: { key: user?.id ?? "anon" } } })
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel?.presenceState() ?? {};
          setViewerCount(Math.max(1, Object.keys(state).length));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel?.track({ watching: true, at: Date.now() });
          }
        });
    } catch {
      setViewerCount((c) => Math.max(c, 12));
    }

    const pollIv = setInterval(() => void refreshItems(), 60_000);

    return () => {
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

  const currentTitle = is247 && channel247 ? channel247.title : active?.title ?? "The Colony Live";
  const playbackSrc = is247
    ? channel247?.streamUrl ?? null
    : active?.src ?? null;
  const playbackIsLive = is247 ? true : !!active?.isLive;
  const isEmbed = playbackSrc ? !/\.m3u8(\?|$)/.test(playbackSrc) && !playbackSrc.endsWith(".mp4") : false;
  const tierBlocked = !is247 && active?.locked && !isMember;

  return (
    <div className="live-stage" data-247={is247}>
      <div className="live-header">
        <div className="status">
          <span className={`badge ${demoReelActive ? "replay" : is247 ? "live-247" : active?.isLive ? "live-event" : "replay"}`}>
            {demoReelActive ? "DEMO REEL" : is247 ? "24/7" : active?.isLive ? "LIVE" : "REPLAY"}
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
        {active?.when && !is247 && <span className="note">{active.when}</span>}
        {is247 && <span className="note">Always-on fallback • scheduled wheel active</span>}
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
          <div className="off-air">
            <Image
              src={channel247?.fallbackSlate || "/assets/images/slates/off-air.jpg"}
              alt="The Colony OK — Off air. Next live broadcast soon."
              width={640}
              height={360}
              className="offair-slate"
            />
            <p>Next live event soon. In the meantime enjoy the 24/7 Colony feed.</p>
            <button type="button" onClick={() => setActiveId(null)}>
              Watch 24/7 Channel
            </button>
          </div>
        )}
      </div>

      {!compact && (
        <div className="queue">
          <h3>
            {demoReelActive ? "Demo Reel — Continuous Archived Stream (no controls)" : "Recent Streams"}
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
                {ev.id === activeId && (
                  <span className="pulse" aria-hidden>
                    ● NOW
                  </span>
                )}
                {ev.when && <span className="when">{whenLabelFromItem(ev)}</span>}
                {demoReelActive && <span className="reel-archived" aria-hidden>archived</span>}
              </motion.button>
            ))}
            {channel247 && !demoReelActive && (
              <motion.button
                type="button"
                onClick={() => setActiveId(null)}
                className={is247 ? "active" : ""}
                layout
              >
                {channel247.title} <span>24/7</span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      )}

      <div className="live-interactivity">
        <LiveChat liveEventId={is247 ? null : activeId} isMember={isMember} currentUser={user} />
        {activePoll && (
          <LivePoll poll={activePoll} isMember={isMember} currentUserId={user?.id ?? null} />
        )}
      </div>

      <p className="fine-print">Low-latency HLS • PiP supported • Reduced motion respected</p>
    </div>
  );
}