"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import type { MuxPlayerRefAttributes } from "@mux/mux-player-react";
import { use24x7Schedule } from "@/lib/mux-247/use24x7Schedule";
import { usePlaybackAnalytics } from "@/lib/mux-247/usePlaybackAnalytics";
import { useAuth } from "@/lib/auth-client";
import {
  createRetryState,
  nextRetryDelay,
  classifyMuxError,
  MAX_RECONNECT_ATTEMPTS,
  checkSupabaseHealth,
  createConnectivityMonitor,
} from "@/lib/mux-247/resilience";
import type { PlayerState, ResilienceMetrics } from "@/lib/mux-247/types";

const SLATE_DEFAULT = "https://images.pexels.com/photos/3945317/pexels-photo-3945317.jpeg?auto=compress&cs=tinysrgb&w=1280";

export default function EliteMux24x7Player({
  className,
  hideOverlay,
}: {
  className?: string;
  hideOverlay?: boolean;
}) {
  const { current: currentProgram, upcoming, config, isLoading, error: scheduleError } = use24x7Schedule();
  const { user, isMember } = useAuth();

  const playerRef = useRef<MuxPlayerRefAttributes>(null);
  const retryRef = useRef(createRetryState());
  const onlineRef = useRef(true);
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [resilience, setResilience] = useState<ResilienceMetrics>({
    reconnectAttempts: 0,
    lastError: null,
    lastErrorTime: null,
    isOnline: true,
    isRecovering: false,
  });

  const [queuePointer, setQueuePointer] = useState(0);
  const [showOverlay, setShowOverlay] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  const activeProgram = queuePointer === 0 ? currentProgram : upcoming[queuePointer - 1] ?? null;

  const resolvedPlaybackId = useMemo(() => {
    if (!activeProgram) return null;
    if (activeProgram.isPremium && !isMember) return null;
    return activeProgram.playbackId;
  }, [activeProgram, isMember]);

  const resolvedThumbnail = useMemo(() => {
    return activeProgram?.thumbnailUrl ?? config?.default_thumbnail_url ?? SLATE_DEFAULT;
  }, [activeProgram?.thumbnailUrl, config?.default_thumbnail_url]);

  const analytics = usePlaybackAnalytics(
    resolvedPlaybackId,
    activeProgram?.programId ?? null,
    user?.id ?? null,
  );

  const advanceProgram = useCallback(() => {
    if (queuePointer < upcoming.length) {
      setQueuePointer((p) => p + 1);
      analytics.endSession();
    } else if (config?.loop_schedule) {
      setQueuePointer(0);
      analytics.endSession();
    } else {
      setPlayerState("ended");
    }
  }, [queuePointer, upcoming.length, config?.loop_schedule, analytics]);

  const onPlaying = useCallback(() => {
    retryRef.current = createRetryState();
    setResilience((prev) => ({ ...prev, reconnectAttempts: 0, lastError: null, isRecovering: false, lastErrorTime: null }));
    setPlayerState("playing");
  }, []);

  const onPlayerError = useCallback(
    (event: any) => {
      const error = event?.detail ?? event;
      const severity = classifyMuxError(error);
      const r = retryRef.current;
      r.lastError = error?.message ?? "Unknown error";
      analytics.onError(r.lastError ?? "unknown");
      setResilience((prev) => ({ ...prev, reconnectAttempts: r.attempt + 1, lastError: r.lastError, lastErrorTime: Date.now(), isRecovering: severity !== "fatal" }));
      if (!onlineRef.current) {
        setPlayerState("offline");
        return;
      }
      if (severity === "fatal") {
        const fb = activeProgram?.fallbackPlaybackId;
        const globalFb = config?.global_fallback_playback_id;
        if (fb && playerRef.current) {
          playerRef.current.playbackId = fb;
          r.attempt = 0;
          setResilience((prev) => ({ ...prev, reconnectAttempts: 0 }));
          return;
        }
        if (globalFb && playerRef.current) {
          playerRef.current.playbackId = globalFb;
          r.attempt = 0;
          return;
        }
        setPlayerState("offline");
        return;
      }
      if (r.attempt < MAX_RECONNECT_ATTEMPTS) {
        const delay = nextRetryDelay(r);
        r.attempt++;
        setResilience((prev) => ({ ...prev, reconnectAttempts: r.attempt, isRecovering: true }));
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.playbackId = resolvedPlaybackId ?? "";
          }
        }, delay);
      } else {
        const fb = activeProgram?.fallbackPlaybackId;
        const globalFb = config?.global_fallback_playback_id;
        if (fb && playerRef.current) {
          playerRef.current.playbackId = fb;
          r.attempt = 0;
          return;
        }
        if (globalFb && playerRef.current) {
          playerRef.current.playbackId = globalFb;
          r.attempt = 0;
          return;
        }
        setPlayerState("offline");
      }
    },
    [activeProgram?.fallbackPlaybackId, config?.global_fallback_playback_id, resolvedPlaybackId, analytics],
  );

  useEffect(() => {
    const cleanup = createConnectivityMonitor((online) => {
      onlineRef.current = online;
      if (online && playerState === "offline") {
        retryRef.current = createRetryState();
        setResilience((prev) => ({ ...prev, reconnectAttempts: 0, isRecovering: false }));
        if (playerRef.current && resolvedPlaybackId) {
          playerRef.current.playbackId = resolvedPlaybackId;
        }
        setPlayerState("loading");
      } else if (!online) {
        setPlayerState("offline");
      }
    });
    return cleanup;
  }, [playerState, resolvedPlaybackId]);

  useEffect(() => {
    const iv = setInterval(async () => {
      const healthy = await checkSupabaseHealth(null);
      if (!healthy && playerState === "playing") {
        console.warn("[247] Supabase health check failed — schedule may be stale");
      }
    }, 120_000);
    return () => clearInterval(iv);
  }, [playerState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!playerRef.current) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (playerState === "playing") playerRef.current.pause();
          else playerRef.current.play();
          break;
        case "ArrowLeft":
          e.preventDefault();
          playerRef.current.currentTime = Math.max(0, (playerRef.current.currentTime ?? 0) - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          playerRef.current.currentTime = (playerRef.current.currentTime ?? 0) + 10;
          break;
        case "f":
          e.preventDefault();
          if (document.fullscreenElement) document.exitFullscreen();
          else playerRef.current.requestFullscreen?.();
          break;
        case "m":
          e.preventDefault();
          playerRef.current.volume = playerRef.current.volume > 0 ? 0 : 1;
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playerState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setShowOverlay(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="elite-player elite-player--loading" aria-label="Loading 24/7 channel">
        <div className="elite-player__spinner" />
        <p className="elite-player__status-text">Loading schedule...</p>
      </div>
    );
  }

  if (scheduleError && !activeProgram) {
    return (
      <div className="elite-player elite-player--error" role="alert">
        <img src={SLATE_DEFAULT} alt="" className="elite-player__slate" />
        <div className="elite-player__message">
          <p>Failed to load 24/7 channel</p>
          <button type="button" className="btn btn--outline" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activeProgram?.isPremium && !isMember) {
    return (
      <div className="elite-player elite-player--gated">
        <img src={resolvedThumbnail} alt="" className="elite-player__slate" />
        <div className="elite-player__message">
          <p>Premium content — membership required</p>
          <a href="/membership" className="btn btn--outline">Join to watch</a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`elite-player ${playerState === "offline" ? "elite-player--offline" : ""} ${className ?? ""}`}
      role="region"
      aria-label={`24/7 player — ${activeProgram?.title ?? "The Colony"}`}
    >
      {resolvedPlaybackId ? (
        <MuxPlayer
          ref={playerRef}
          playbackId={resolvedPlaybackId}
          metadata={{ video_title: activeProgram?.title ?? "The Colony 24/7", viewer_user_id: user?.id ?? "anonymous" }}
          streamType="on-demand"
          preload="auto"
          poster={resolvedThumbnail}
          placeholder={resolvedThumbnail}
          maxResolution="2160p"
          accentColor="#EC1024"
          defaultHiddenCaptions
          onPlaying={onPlaying}
          onPause={() => setPlayerState("paused")}
          onWaiting={() => setPlayerState("buffering")}
          onEnded={advanceProgram}
          onError={onPlayerError}
          onLoadStart={() => playerState !== "playing" && setPlayerState("loading")}
          onLoadedData={() => {
            retryRef.current = createRetryState();
            setResilience((prev) => ({ ...prev, reconnectAttempts: 0, isRecovering: false }));
          }}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <div className="elite-player__slate-container">
          <img src={resolvedThumbnail} alt="The Colony" className="elite-player__slate" />
          {activeProgram && (
            <div className="elite-player__message">
              <p>{activeProgram.title}</p>
              <p className="elite-player__subtitle">Available soon</p>
            </div>
          )}
        </div>
      )}

      {resilience.isRecovering && resolvedPlaybackId && (
        <div className="elite-player__status" role="status" aria-live="polite">
          <div className="elite-player__status-dot" />
          <span>Reconnecting... (attempt {resilience.reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})</span>
        </div>
      )}

      {playerState === "offline" && (
        <div className="elite-player__status elite-player__status--offline" role="alert">
          <span>Connection lost — will auto-reconnect</span>
        </div>
      )}

      {activeProgram && !showOverlay && resolvedPlaybackId && (
        <div className="elite-player__overlay" aria-hidden>
          <div className="elite-player__program-info">
            <span className="elite-player__badge">{config?.channel_title ?? "24/7"}</span>
            <h2 className="elite-player__title">{activeProgram.title}</h2>
            {activeProgram.description && <p className="elite-player__description">{activeProgram.description}</p>}
          </div>
          {upcoming.length > 0 && (
            <div className="elite-player__upcoming">
              <span className="elite-player__upcoming-label">Up next</span>
              <span className="elite-player__upcoming-title">{upcoming[0]?.title}</span>
            </div>
          )}
        </div>
      )}

      {playerState === "ended" && !activeProgram && (
        <div className="elite-player__message">
          <p>End of schedule</p>
          <button type="button" className="btn btn--outline" onClick={() => { setQueuePointer(0); setPlayerState("loading"); }}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
