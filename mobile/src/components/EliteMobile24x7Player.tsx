import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { use24x7Schedule } from "@/hooks/use24x7Schedule";
import { usePlaybackAnalytics } from "@/hooks/usePlaybackAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { VideoPlayer } from "./VideoPlayer";
import { PlayerSkeleton } from "./LoadingSkeleton";
import type { PlayerState, QueueItem } from "@/types";

interface EliteMobile24x7PlayerProps {
  showInfo?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
}

/**
 * EliteMobile24x7Player — 24/7 continuous playback for mobile.
 * Ported from web's EliteMux24x7Player. Same data, same Realtime, same resilience.
 */
export function EliteMobile24x7Player({
  showInfo = true,
  onFullscreenChange,
}: EliteMobile24x7PlayerProps) {
  const { current, upcoming, config, isLoading, error, refresh } = use24x7Schedule();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [currentHlsUrl, setCurrentHlsUrl] = useState<string | null>(null);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);

  const previousItemRef = useRef<string | null>(null);

  const analytics = usePlaybackAnalytics(
    playbackId,
    currentItem?.programId ?? null,
    user?.id ?? null
  );

  const buildUrl = useCallback((pId: string): string => {
    return `https://stream.mux.com/${pId}.m3u8`;
  }, []);

  const loadProgram = useCallback(
    (item: QueueItem) => {
      if (item.programId === previousItemRef.current) return;
      previousItemRef.current = item.programId;
      setCurrentItem(item);
      setPlaybackId(item.playbackId);
      setCurrentHlsUrl(buildUrl(item.playbackId));
      setPlayerState("loading");
      setErrorMessage(null);
    },
    [buildUrl]
  );

  // When schedule loads, set current program
  useEffect(() => {
    if (current && !currentItem) {
      loadProgram(current);
    }
  }, [current, currentItem, loadProgram]);

  const handleStateChange = useCallback(
    (state: PlayerState) => {
      setPlayerState(state);
      if (state === "ended" && upcoming.length > 0) {
        const next = upcoming[0];
        if (next) loadProgram(next);
      }
    },
    [upcoming, loadProgram]
  );

  const handlePlayerError = useCallback(
    (error: any) => {
      analytics.onError(error?.code ?? "PLAYER_ERROR");
      if (!currentItem) return;

      const fallbackId =
        currentItem.fallbackPlaybackId ??
        config?.global_fallback_playback_id;

      if (fallbackId && currentHlsUrl !== buildUrl(fallbackId)) {
        setCurrentHlsUrl(buildUrl(fallbackId));
        setPlaybackId(fallbackId);
        setErrorMessage("Switching to backup source...");
        setPlayerState("loading");
      } else {
        setPlayerState("error");
        setErrorMessage("Playback unavailable. Please try again.");
      }
    },
    [currentItem, config, currentHlsUrl, buildUrl, analytics]
  );

  // Auto-resume on network reconnection
  useEffect(() => {
    if (isOnline && playerState === "offline" && currentItem) {
      setPlayerState("loading");
      setCurrentHlsUrl(null);
      setTimeout(() => {
        setCurrentHlsUrl(buildUrl(currentItem.playbackId));
      }, 100);
    }
  }, [isOnline, playerState, currentItem, buildUrl]);

  const handleNextProgram = useCallback(() => {
    if (upcoming.length > 0) {
      const next = upcoming[0];
      if (next) loadProgram(next);
    }
  }, [upcoming, loadProgram]);

  const handlePreviousProgram = useCallback(() => {
    // No history buffer — future enhancement
  }, []);

  const handleFullscreenChange = useCallback(
    (fullscreen: boolean) => {
      setIsFullscreen(fullscreen);
      onFullscreenChange?.(fullscreen);
    },
    [onFullscreenChange]
  );

  // Detect offline from network hook
  useEffect(() => {
    if (!isOnline && playerState !== "offline" && playerState !== "loading") {
      setPlayerState("offline");
      setErrorMessage("Network connection lost.");
    }
  }, [isOnline, playerState]);

  // --- Loading ---
  if (isLoading && !currentItem) {
    return <PlayerSkeleton />;
  }

  // --- Error (schedule) ---
  if (error && !currentItem) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={styles.errorTitle}>Unable to load schedule</Text>
        <Text style={styles.errorMessage}>
          {error === "stale"
            ? "Showing cached schedule. Some data may be outdated."
            : error}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={styles.retryButton}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- No current program ---
  if (!currentItem) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Off Air</Text>
        <Text style={styles.emptyMessage}>No program is currently scheduled.</Text>
      </View>
    );
  }

  const nextProgram = upcoming[0];

  return (
    <View style={styles.container}>
      <VideoPlayer
        source={currentHlsUrl}
        title={currentItem.title}
        isLive={false}
        onStateChange={handleStateChange}
        onError={handlePlayerError}
        onNextProgram={handleNextProgram}
        onPreviousProgram={handlePreviousProgram}
        isFullscreen={isFullscreen}
        onFullscreenChange={handleFullscreenChange}
        volume={volume}
        onVolumeChange={setVolume}
        autoPlay={true}
        allowsPiP={true}
      />

      {errorMessage && playerState !== "playing" && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}

      {showInfo && nextProgram && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoLabel}>Up Next</Text>
          <Text style={styles.infoTitle} numberOfLines={1}>
            {nextProgram.title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorIcon: {
    color: "#f87171",
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#a3a3a3",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#0c8ee7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyMessage: {
    color: "#a3a3a3",
    fontSize: 14,
    textAlign: "center",
  },
  errorBanner: {
    position: "absolute",
    top: 48,
    left: 16,
    right: 16,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 20,
  },
  errorBannerText: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  infoOverlay: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 15,
  },
  infoLabel: {
    color: "#a3a3a3",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});