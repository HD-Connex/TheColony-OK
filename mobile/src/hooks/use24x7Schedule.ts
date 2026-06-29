import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type {
  QueueItem,
  CurrentProgram,
  UpcomingQueueItem,
  PlayerConfig,
  Program,
} from "@/types";

interface ScheduleState {
  current: QueueItem | null;
  upcoming: QueueItem[];
  config: PlayerConfig | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: number;
}

type ScheduleListener = (state: ScheduleState) => void;

/**
 * use24x7Schedule — Fetches the 24/7 schedule from Supabase with Realtime subscriptions.
 *
 * Ported from web's lib/mux-247/use24x7Schedule.ts.
 * Identical data flow: fetches current_program view + upcoming_queue view + player_configs.
 */
export function use24x7Schedule(): ScheduleState & {
  refresh: () => Promise<void>;
  subscribe: (listener: ScheduleListener) => () => void;
  forceNext: () => Promise<void>;
} {
  const [state, setState] = useState<ScheduleState>({
    current: null,
    upcoming: [],
    config: null,
    isLoading: true,
    error: null,
    lastRefreshed: 0,
  });

  const listenersRef = useRef<Set<ScheduleListener>>(new Set());
  const cacheRef = useRef<ScheduleState | null>(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const notify = useCallback(() => {
    listenersRef.current.forEach((fn) => fn(state));
  }, [state]);

  const fetchSchedule = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [currentRes, upcomingRes, configRes] = await Promise.all([
        supabase.from("current_program").select("*").limit(1).maybeSingle(),
        supabase.from("upcoming_queue").select("*"),
        supabase.from("player_configs").select("*").limit(1).maybeSingle(),
      ]);

      const currentRaw = currentRes.data as CurrentProgram | null;
      const upcomingRaw = (upcomingRes.data ?? []) as UpcomingQueueItem[];
      const config = configRes.data as PlayerConfig | null;

      const toQueueItem = (p: CurrentProgram): QueueItem => ({
        programId: p.program_id,
        playbackId: p.playback_id,
        fallbackPlaybackId: p.fallback_playback_id,
        title: p.title,
        description: p.description,
        duration: p.effective_duration,
        thumbnailUrl: p.thumbnail_url,
        isPremium: p.is_premium,
        category: p.category,
      });

      const newState: ScheduleState = {
        current: currentRaw ? toQueueItem(currentRaw) : null,
        upcoming: upcomingRaw.map(toQueueItem),
        config,
        isLoading: false,
        error: null,
        lastRefreshed: Date.now(),
      };

      cacheRef.current = newState;
      if (mountedRef.current) setState(newState);
    } catch (err) {
      if (cacheRef.current) {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            error: "stale",
            lastRefreshed: Date.now(),
          }));
        }
      } else {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error:
              err instanceof Error ? err.message : "Failed to load schedule",
          }));
        }
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const load = async () => {
      await fetchSchedule();
      if (cancelled || !mountedRef.current) return;
      notify();
    };
    load();

    // Subscribe to realtime changes
    const schedulesChannel = supabase
      .channel("mobile247-schedules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled && mountedRef.current) fetchSchedule();
        }
      )
      .subscribe();

    const programsChannel = supabase
      .channel("mobile247-programs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "programs" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled && mountedRef.current) fetchSchedule();
        }
      )
      .subscribe();

    const configChannel = supabase
      .channel("mobile247-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_configs" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled && mountedRef.current) fetchSchedule();
        }
      )
      .subscribe();

    // Periodic refresh every 60s
    const iv = setInterval(() => {
      if (!cancelled && mountedRef.current) fetchSchedule();
    }, 60_000);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(iv);
      supabase.removeChannel(schedulesChannel);
      supabase.removeChannel(programsChannel);
      supabase.removeChannel(configChannel);
    };
  }, [fetchSchedule, notify]);

  const refresh = useCallback(async () => {
    await fetchSchedule();
    notify();
  }, [fetchSchedule, notify]);

  const subscribe = useCallback(
    (listener: ScheduleListener) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    []
  );

  const forceNext = useCallback(async () => {
    if (!state.current) return;
    try {
      const next = state.upcoming[0];
      if (next) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)("bump_program", {
          target_program_id: next.programId,
        });
        await fetchSchedule();
        notify();
      }
    } catch {
      // Silent fail
    }
  }, [state.current, state.upcoming, fetchSchedule, notify]);

  return { ...state, refresh, subscribe, forceNext };
}

export async function fetchProgramByPlaybackId(
  playbackId: string
): Promise<Program | null> {
  try {
    const { data } = await supabase
      .from("programs")
      .select("*")
      .eq("playback_id", playbackId)
      .limit(1)
      .maybeSingle();
    return data as Program | null;
  } catch {
    return null;
  }
}