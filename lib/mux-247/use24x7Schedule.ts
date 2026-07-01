"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseBrowser } from "@/lib/auth-client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { QueueItem, CurrentProgram, UpcomingQueueItem, PlayerConfig, Program } from "./types";

const SCHEDULE_CACHE_KEY = "colony247:schedule";
const CACHE_TTL = 30_000; // 30s in-memory cache

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
 * Design:
 * - On mount, fetches current_program view + upcoming_queue view + player_configs.
 * - Subscribes to postgres_changes on schedules, programs, player_configs.
 * - On any relevant change, gracefully updates the queue.
 *   If the current program changes, the player advances at its natural end.
 *   If the admin force-bumps a program ("break in"), the current program pointer updates
 *   immediately so the player can hot-swap.
 * - Caches in-memory for 30s to avoid refetch storms on mount.
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

  const notify = useCallback(() => {
    listenersRef.current.forEach((fn) => fn(state));
  }, [state]);

  const fetchSchedule = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const sb = supabaseBrowser();

      // Fetch current program, upcoming queue, and player config in parallel
      const [currentRes, upcomingRes, configRes] = await Promise.all([
        sb.from("current_program").select("*").limit(1).maybeSingle(),
        sb.from("upcoming_queue").select("*"),
        sb.from("player_configs").select("*").limit(1).maybeSingle(),
      ]);

      const currentRaw = currentRes.data as CurrentProgram | null;
      const upcomingRaw = (upcomingRes.data ?? []) as UpcomingQueueItem[];
      const config = configRes.data as PlayerConfig | null;

      // Map to QueueItem (domain model)
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
      setState(newState);
    } catch (err) {
      // If we have cached state, serve it and mark stale
      if (cacheRef.current) {
        setState((prev) => ({ ...prev, error: "stale", lastRefreshed: Date.now() }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load schedule",
        }));
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch + Realtime subscriptions
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      await fetchSchedule();
      if (cancelled) return;
      notify();
    };
    load();

    const sb = supabaseBrowser();

    // Subscribe to schedules changes
    const schedulesChannel = sb
      .channel("mux247-schedules")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedules" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled) fetchSchedule();
        },
      )
      .subscribe();

    // Subscribe to programs changes
    const programsChannel = sb
      .channel("mux247-programs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "programs" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled) fetchSchedule();
        },
      )
      .subscribe();

    // Subscribe to player config changes
    const configChannel = sb
      .channel("mux247-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_configs" },
        (_payload: RealtimePostgresChangesPayload<any>) => {
          if (!cancelled) fetchSchedule();
        },
      )
      .subscribe();

    // Periodic refresh every 60s as safety net
    const iv = setInterval(() => {
      if (!cancelled) fetchSchedule();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(iv);
      sb.removeChannel(schedulesChannel);
      sb.removeChannel(programsChannel);
      sb.removeChannel(configChannel);
    };
  }, [fetchSchedule, notify]);

  const refresh = useCallback(async () => {
    await fetchSchedule();
    notify();
  }, [fetchSchedule, notify]);

  const subscribe = useCallback((listener: ScheduleListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const forceNext = useCallback(async () => {
    // Advance to the next program by calling the server function
    // This is used when the admin triggers "next" or on program end
    if (!state.current) return;
    try {
      const sb = supabaseBrowser();
      const next = state.upcoming[0];
      if (next) {
        await sb.rpc("bump_program", { target_program_id: next.programId });
        await fetchSchedule();
        notify();
      }
    } catch {
      // Silent fail - schedule will update on next Realtime event
    }
    // `state` is a mutable external store synced via notify()/listenersRef (not React
    // state) — these reads intentionally use the latest values without re-creating the
    // callback; adding `state` wouldn't re-render and would churn the subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.current, state.upcoming, fetchSchedule, notify]);

  return { ...state, refresh, subscribe, forceNext };
}

/**
 * Fetch a single program's details by playback_id.
 * Used by the player to look up metadata for the current program.
 */
export async function fetchProgramByPlaybackId(playbackId: string): Promise<Program | null> {
  try {
    const sb = supabaseBrowser();
    const { data } = await sb
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
