import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import type { PlayerState } from "@/types";

interface PlayerControlsProps {
  playerState: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  isFullscreen: boolean;
  isLive: boolean;
  title: string;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onFullscreenToggle: () => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  onNextProgram: () => void;
  onPreviousProgram: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Custom on-screen controls for the 24/7 player.
 *
 * Design mirrors the web Mux Player UX with mobile-native touch targets.
 * Shows play/pause, seek bar, time display, volume, fullscreen, skip buttons.
 * In live mode, shows a "LIVE" badge instead of seek bar.
 */
export function PlayerControls({
  playerState,
  currentTime,
  duration,
  volume,
  isFullscreen,
  isLive,
  title,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onFullscreenToggle,
  onSkipForward,
  onSkipBackward,
  onNextProgram,
  onPreviousProgram,
}: PlayerControlsProps) {
  const showControls = playerState !== "loading" && playerState !== "offline";
  const isPlaying = playerState === "playing";
  const isBuffering = playerState === "buffering";
  const showSeekBar = !isLive && duration > 0;

  return (
    <View style={styles.overlay}>
      {/* Top area: title */}
      <View style={styles.topArea}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Center: big play/pause button */}
      {showControls && (
        <TouchableOpacity
          onPress={onPlayPause}
          style={styles.centerPlayButton}
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={styles.centerPlayIcon}>
            {isBuffering ? "..." : isPlaying ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Bottom: controls bar */}
      <View style={styles.bottomBar}>
        {/* Skip buttons */}
        <View style={styles.skipRow}>
          <TouchableOpacity
            onPress={onPreviousProgram}
            style={styles.skipButton}
            accessibilityLabel="Previous program"
          >
            <Text style={styles.skipIcon}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSkipBackward}
            style={styles.skipButton}
            accessibilityLabel="Rewind 15 seconds"
          >
            <Text style={styles.skipIcon}>↺ 15</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSkipForward}
            style={styles.skipButton}
            accessibilityLabel="Fast forward 15 seconds"
          >
            <Text style={styles.skipIcon}>15 ↻</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNextProgram}
            style={styles.skipButton}
            accessibilityLabel="Next program"
          >
            <Text style={styles.skipIcon}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Seek bar */}
        {showSeekBar && (
          <View style={styles.seekRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Slider
              style={styles.seekBar}
              minimumValue={0}
              maximumValue={duration}
              value={currentTime}
              onSlidingComplete={onSeek}
              minimumTrackTintColor="#0c8ee7"
              maximumTrackTintColor="#525252"
              thumbTintColor="#ffffff"
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        )}

        {/* Bottom row: volume, fullscreen, play/pause */}
        <View style={styles.bottomRow}>
          <View style={styles.volumeRow}>
            <Text style={styles.controlIcon}>
              {volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={onVolumeChange}
              minimumTrackTintColor="#ffffff"
              maximumTrackTintColor="#525252"
              thumbTintColor="#ffffff"
            />
          </View>
          <TouchableOpacity
            onPress={onFullscreenToggle}
            style={styles.fullscreenButton}
            accessibilityLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Text style={styles.controlIcon}>
              {isFullscreen ? "⛶" : "⛶"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* State overlay messages */}
      {playerState === "buffering" && (
        <View style={styles.stateOverlay}>
          <Text style={styles.stateText}>Buffering...</Text>
        </View>
      )}
      {playerState === "offline" && (
        <View style={styles.stateOverlay}>
          <Text style={styles.stateText}>
            No internet connection. Waiting...
          </Text>
        </View>
      )}
      {playerState === "error" && (
        <View style={styles.stateOverlay}>
          <Text style={styles.stateText}>
            Playback error. Trying backup source...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topArea: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    marginRight: 4,
  },
  liveText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  centerPlayButton: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerPlayIcon: {
    color: "#ffffff",
    fontSize: 28,
  },
  bottomBar: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  skipRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 16,
  },
  skipButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  skipIcon: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  seekRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  seekBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  timeText: {
    color: "#d4d4d4",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  controlIcon: {
    color: "#ffffff",
    fontSize: 16,
  },
  volumeSlider: {
    width: 80,
    height: 40,
    marginLeft: 8,
  },
  fullscreenButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  stateOverlay: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    marginTop: -12,
  },
  stateText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
});
