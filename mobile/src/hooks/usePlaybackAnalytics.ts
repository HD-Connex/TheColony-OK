import { useRef, useCallback, useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { supabase } from "@/lib/supabase";

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
 * Ported from web's lib/mux-247/usePlaybackAnalytics.ts.
 * Reports to public.playback_sessions on session start, heartbeat, quality change, error, session end.
 */
export function usePlaybackAnalytics(
  playbackId: string | null,
  programId: string | null,
  viewerId: string | null
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
      const deviceInfo = `${Platform.OS} ${Platform.Version}`;

      const { data } = await supabase
        .from("playback_sessions")
        .insert({
          playback_id: playbackId,
          program_id: programId,
          viewer_id: viewerId,
          device_type: "mobile",
          browser: deviceInfo.slice(0, 200),
          is_live: false,
        })
        .select("id")
        .single();

      if (data) {
        const row = data as { id: string };
        stateRef.current.sessionId = row.id;
        stateRef.current.startTime = Date.now();
        stateRef.current.lastReportedTime = Date.now();
      }
    } catch {
      // Analytics are best-effort; never throw
    }
  }, [playbackId, programId, viewerId]);

  const updateSession = useCallback(
    async (partial: Record<string, any>) => {
      const sessionId = stateRef.current.sessionId;
      if (!sessionId) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("playback_sessions").update(partial).eq("id", sessionId);
      } catch {
        // Best-effort
      }
    },
    []
  );

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

  // End session on app backgrounding
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      const s = stateRef.current;
      if (nextState === "background" || nextState === "inactive") {
        if (s.sessionId) {
          const watchSeconds = (Date.now() - s.startTime) / 1000;
          updateSession({
            watch_seconds: watchSeconds,
            session_end: new Date().toISOString(),
          });
        }
      } else if (nextState === "active") {
        if (playbackId && s.sessionId === null) {
          createSession();
        }
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [playbackId, createSession, updateSession]);

  // Periodic heartbeat every 30s
  useEffect(() => {
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (!s.sessionId) return;
      const elapsed = (Date.now() - s.startTime) / 1000;
      updateSession({ watch_seconds: elapsed });
    }, 30_000);
    return () => clearInterval(iv);
  }, [updateSession]);

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