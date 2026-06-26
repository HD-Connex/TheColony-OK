"use client";

import { useRef, useCallback, useEffect } from "react";
import { supabaseBrowser } from "@/lib/auth-client";

interface AnalyticsState {
  sessionId: string | null;
  startTime: number;
  lastReportedTime: number;
  qualitySwitches: number;
  errorCount: number;
  lastErrorCode: string | null;
  lastBitrate: number | null;
}

/**
 * usePlaybackAnalytics — Tracks playback quality and session metrics.
 *
 * Reports to public.playback_sessions on:
 * - Session start (on first play)
 * - Periodic heartbeat (every 30s of watch time)
 * - Quality change
 * - Error
 * - Session end (visibilitychange, page unload, or program end)
 *
 * Uses a ref-based approach to avoid re-renders on every timeupdate.
 */
export function usePlaybackAnalytics(
  playbackId: string | null,
  programId: string | null,
  viewerId: string | null,
) {
  const stateRef = useRef<AnalyticsState>({
    sessionId: null,
    startTime: 0,
    lastReportedTime: 0,
    qualitySwitches: 0,
    errorCount: 0,
    lastErrorCode: null,
    lastBitrate: null,
  });

  const createSession = useCallback(async () => {
    if (!playbackId) return;
    try {
      const sb = supabaseBrowser();
      const deviceType = /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop";

      const { data } = await sb
        .from("playback_sessions")
        .insert({
          playback_id: playbackId,
          program_id: programId,
          viewer_id: viewerId,
          device_type: deviceType,
          browser: navigator.userAgent.slice(0, 200),
          is_live: false,
        })
        .select("id")
        .single();

      if (data) {
        stateRef.current.sessionId = data.id;
        stateRef.current.startTime = Date.now();
        stateRef.current.lastReportedTime = Date.now();
      }
    } catch {
      // Analytics are best-effort; never throw
    }
  }, [playbackId, programId, viewerId]);

  const updateSession = useCallback(async (partial: Record<string, any>) => {
    const sessionId = stateRef.current.sessionId;
    if (!sessionId) return;
    try {
      const sb = supabaseBrowser();
      await sb.from("playback_sessions").update(partial).eq("id", sessionId);
    } catch {
      // Best-effort
    }
  }, []);

  const endSession = useCallback(async () => {
    const s = stateRef.current;
    if (!s.sessionId) return;
    const watchSeconds = (Date.now() - s.startTime) / 1000;
    await updateSession({
      session_end: new Date().toISOString(),
      watch_seconds: watchSeconds,
      avg_bitrate: s.lastBitrate,
      quality_switches: s.qualitySwitches,
      error_count: s.errorCount,
      last_error_code: s.lastErrorCode,
    });
    stateRef.current.sessionId = null;
  }, [updateSession]);

  // Create session when playback ID changes
  useEffect(() => {
    if (playbackId) {
      createSession();
    }
    return () => {
      endSession();
    };
  }, [playbackId, createSession, endSession]);

  // End session on visibilitychange (user leaves tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        const s = stateRef.current;
        if (s.sessionId) {
          const watchSeconds = (Date.now() - s.startTime) / 1000;
          updateSession({ watch_seconds: watchSeconds, session_end: new Date().toISOString() });
        }
      } else {
        // Resume: create a new session for the resumed playback
        if (playbackId && stateRef.current.sessionId === null) {
          createSession();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [playbackId, createSession, updateSession]);

  // End session on page unload
  useEffect(() => {
    const handleUnload = () => {
      const s = stateRef.current;
      if (s.sessionId) {
        const watchSeconds = (Date.now() - s.startTime) / 1000;
        // Use sendBeacon for reliability during unload
        const body = JSON.stringify({
          watch_seconds: watchSeconds,
          session_end: new Date().toISOString(),
          avg_bitrate: s.lastBitrate,
          quality_switches: s.qualitySwitches,
          error_count: s.errorCount,
          last_error_code: s.lastErrorCode,
        });
        navigator.sendBeacon?.(
          `/api/analytics/end-session?sessionId=${s.sessionId}`,
          body,
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Report periodic heartbeat every 30s of wall time
  useEffect(() => {
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (!s.sessionId) return;
      const elapsed = (Date.now() - s.startTime) / 1000;
      updateSession({ watch_seconds: elapsed });
    }, 30_000);
    return () => clearInterval(iv);
  }, [updateSession]);

  // Exposed handlers for the player to call
  const onQualityChange = useCallback(() => {
    stateRef.current.qualitySwitches++;
  }, []);

  const onError = useCallback((errorCode: string) => {
    stateRef.current.errorCount++;
    stateRef.current.lastErrorCode = errorCode;
  }, []);

  const onBitrateChange = useCallback((bitrate: number) => {
    stateRef.current.lastBitrate = bitrate;
  }, []);

  return {
    onQualityChange,
    onError,
    onBitrateChange,
    createSession,
    endSession,
  };
}
