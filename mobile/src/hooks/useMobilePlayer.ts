import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import type { QueueItem, PlayerState } from "@/types";
import {
  classifyPlayerError,
  MAX_RECONNECT_ATTEMPTS,
  nextRetryDelay,
  createRetryState,
} from "@/lib/resilience";
import type { RetryState } from "@/lib/resilience";
import { buildHlsUrl } from "@/lib/constants";

/**
 * useMobilePlayer — Manages the 24/7 player state machine with error recovery.
 */
export function useMobilePlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [currentHlsUrl, setCurrentHlsUrl] = useState<string | null>(null);
  const [retryState, setRetryState] = useState<RetryState>(createRetryState());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIndexRef = useRef(0);
  const mountedRef = useRef(true);
  const currentHlsUrlRef = useRef<string | null>(null);

  useEffect(() => {
    currentHlsUrlRef.current = currentHlsUrl;
  }, [currentHlsUrl]);

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const resolveHlsUrl = useCallback(
    (item: QueueItem, fallbackLevel: number = 0): string | null => {
      const candidates: (string | null)[] = [
        item.playbackId ? buildHlsUrl(item.playbackId) : null,
        item.fallbackPlaybackId ? buildHlsUrl(item.fallbackPlaybackId) : null,
      ];

      for (let i = fallbackLevel; i < candidates.length; i++) {
        const url = candidates[i];
        if (url) return url;
      }

      return null;
    },
    []
  );

  const loadItem = useCallback(
    (item: QueueItem) => {
      if (!mountedRef.current) return;

      setCurrentItem(item);
      setPlayerState("loading");
      setErrorMessage(null);
      setCurrentTime(0);
      setDuration(item.duration || 0);
      fallbackIndexRef.current = 0;

      const url = resolveHlsUrl(item, 0);
      if (url) {
        setCurrentHlsUrl(url);
      } else {
        setPlayerState("error");
        setErrorMessage("No playback source available for this program");
      }
    },
    [resolveHlsUrl]
  );

  const attemptFallback = useCallback(
    (globalFallbackPlaybackId: string | null): RetryState => {
      if (!currentItem) return { attempt: 0, lastError: null, isRecovering: false };

      fallbackIndexRef.current++;

      const candidates: (string | null)[] = [
        currentItem.fallbackPlaybackId
          ? buildHlsUrl(currentItem.fallbackPlaybackId)
          : null,
        globalFallbackPlaybackId
          ? buildHlsUrl(globalFallbackPlaybackId)
          : null,
      ];

      const fallbackUrl = candidates[fallbackIndexRef.current - 1] ?? null;

      if (fallbackUrl) {
        setCurrentHlsUrl(fallbackUrl);
        setErrorMessage("Switching to backup source...");
        setPlayerState("loading");
        return { attempt: 0, lastError: null, isRecovering: false };
      } else {
        setPlayerState("error");
        setErrorMessage("All playback sources failed. Please try again later.");
        return { attempt: 0, lastError: "all_sources_failed", isRecovering: false };
      }
    },
    [currentItem]
  );

  const handlePlayerError = useCallback(
    (error: any, globalFallbackPlaybackId: string | null = null) => {
      const severity = classifyPlayerError(error);

      if (severity === "offline") {
        setPlayerState("offline");
        setErrorMessage("Network connection lost. Waiting for reconnection...");
        return;
      }

      if (severity === "transient") {
        setRetryState((prev) => {
          const newAttempts = prev.attempt + 1;

          if (newAttempts >= MAX_RECONNECT_ATTEMPTS) {
            const newState = attemptFallback(globalFallbackPlaybackId);
            return newState;
          }

          const delay = nextRetryDelay(prev);
          setPlayerState("buffering");
          setErrorMessage(
            `Reconnecting... (attempt ${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`
          );

          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current && currentHlsUrlRef.current) {
              const url = currentHlsUrlRef.current;
              // Force reload by toggling off/on
              setCurrentHlsUrl(null);
              setTimeout(() => {
                if (mountedRef.current) {
                  setCurrentHlsUrl(url);
                }
              }, 100);
            }
          }, delay);

          return {
            attempt: newAttempts,
            lastError: error?.message ?? "Unknown error",
            isRecovering: true,
          };
        });
        return;
      }

      // Fatal — try fallback
      attemptFallback(globalFallbackPlaybackId);
    },
    [attemptFallback]
  );

  const advanceToNext = useCallback(
    (upcoming: QueueItem[]) => {
      if (upcoming.length > 0) {
        const next = upcoming[0];
        if (next) {
          loadItem(next);
        }
      } else {
        setPlayerState("ended");
        setCurrentItem(null);
        setCurrentHlsUrl(null);
      }
    },
    [loadItem]
  );

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const setVolumeLevel = useCallback((level: number) => {
    setVolume(Math.max(0, Math.min(1, level)));
  }, []);

  return {
    playerState,
    currentItem,
    currentHlsUrl,
    retryState,
    isFullscreen,
    volume,
    currentTime,
    duration,
    errorMessage,
    loadItem,
    handlePlayerError,
    advanceToNext,
    handleTimeUpdate,
    handleDurationChange,
    toggleFullscreen,
    setVolumeLevel,
  };
}