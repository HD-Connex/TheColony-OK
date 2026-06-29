import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { PlayerControls } from "./PlayerControls";
import type { PlayerState } from "@/types";

interface VideoPlayerProps {
  source: string | null;
  title: string;
  isLive?: boolean;
  onStateChange?: (state: PlayerState) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: (error: any) => void;
  onNextProgram?: () => void;
  onPreviousProgram?: () => void;
  isFullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  autoPlay?: boolean;
  allowsPiP?: boolean;
}

/**
 * Native video player built on expo-video (SDK 56).
 * Handles HLS playback from Mux streams natively.
 */
export function VideoPlayer({
  source,
  title,
  isLive = false,
  onStateChange,
  onTimeUpdate,
  onDurationChange,
  onError,
  onNextProgram,
  onPreviousProgram,
  isFullscreen = false,
  onFullscreenChange,
  volume = 1,
  onVolumeChange,
  autoPlay = true,
  allowsPiP = true,
}: VideoPlayerProps) {
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // expo-video useVideoPlayer hook
  const videoSource = useMemo(() => {
    if (!source) return undefined;
    return { uri: source } as any;
  }, [source]);

  const player = useVideoPlayer(videoSource as any, (playerInstance) => {
    if (autoPlay && source) {
      playerInstance.play();
    }
  });

  // Reset player when source changes
  useEffect(() => {
    if (!source && player) {
      (player as any).replace?.("");
    } else if (source && player) {
      (player as any).replace?.(source);
      if (autoPlay) {
        player.play();
      }
    }
  }, [source, player, autoPlay]);

  // Sync volume
  useEffect(() => {
    if (player) {
      player.volume = volume;
    }
  }, [volume, player]);

  // Listen for status changes
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("statusChange", (payload: any) => {
      const status = payload?.status ?? payload;
      let newState: PlayerState;
      switch (status) {
        case "idle":
        case "loading":
        case "readyToPlay":
          newState = "loading";
          break;
        case "playing":
        case "play":
          newState = "playing";
          break;
        case "paused":
        case "pause":
          newState = "paused";
          break;
        default:
          newState = "loading";
      }
      setPlayerState(newState);
      onStateChange?.(newState);
    });

    return () => subscription.remove();
  }, [player, onStateChange]);

  // Listen for time updates
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("timeUpdate", (event: any) => {
      const time = event?.currentTime ?? 0;
      const dur = event?.duration ?? 0;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      if (dur !== duration) {
        setDuration(dur);
        onDurationChange?.(dur);
      }
    });

    return () => subscription.remove();
  }, [player, onTimeUpdate, onDurationChange, duration]);

  // Listen for player errors
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("error" as any, (event: any) => {
      console.error("[VideoPlayer] Error:", event?.message ?? event);
      setPlayerState("error");
      onError?.(event);
    });

    return () => subscription.remove();
  }, [player, onError]);

  // Auto-hide controls after 4s
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    resetControlsTimer();
  }, [player, resetControlsTimer]);

  const handleSeek = useCallback(
    (time: number) => {
      if (player) {
        (player as any).seekTo?.(time);
        setCurrentTime(time);
      }
      resetControlsTimer();
    },
    [player, resetControlsTimer]
  );

  const handleSkipForward = useCallback(() => {
    if (player) {
      (player as any).seekTo?.(Math.min(currentTime + 15, duration));
    }
    resetControlsTimer();
  }, [player, currentTime, duration, resetControlsTimer]);

  const handleSkipBackward = useCallback(() => {
    if (player) {
      (player as any).seekTo?.(Math.max(currentTime - 15, 0));
    }
    resetControlsTimer();
  }, [player, currentTime, resetControlsTimer]);

  const handleFullscreenToggle = useCallback(() => {
    onFullscreenChange?.(!isFullscreen);
    resetControlsTimer();
  }, [isFullscreen, onFullscreenChange, resetControlsTimer]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      onVolumeChange?.(newVolume);
      resetControlsTimer();
    },
    [onVolumeChange, resetControlsTimer]
  );

  if (!source) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyState}>
          <PlayerControls
            playerState="loading"
            currentTime={0}
            duration={0}
            volume={volume}
            isFullscreen={isFullscreen}
            isLive={isLive}
            title={title}
            onPlayPause={() => {}}
            onSeek={() => {}}
            onVolumeChange={() => {}}
            onFullscreenToggle={() => {}}
            onSkipForward={() => {}}
            onSkipBackward={() => {}}
            onNextProgram={onNextProgram ?? (() => {})}
            onPreviousProgram={onPreviousProgram ?? (() => {})}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        allowsPictureInPicture={allowsPiP}
      />

      {/* Custom controls overlay */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          <PlayerControls
            playerState={playerState}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isFullscreen={isFullscreen}
            isLive={isLive}
            title={title}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onFullscreenToggle={handleFullscreenToggle}
            onSkipForward={handleSkipForward}
            onSkipBackward={handleSkipBackward}
            onNextProgram={onNextProgram ?? (() => {})}
            onPreviousProgram={onPreviousProgram ?? (() => {})}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  video: {
    flex: 1,
    width: "100%",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});