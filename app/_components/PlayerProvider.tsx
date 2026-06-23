"use client";

/**
 * PlayerProvider — global, persistent audio state for The Colony.
 *
 * Owns a SINGLE <audio> element mounted once at the app root, so playback
 * survives client-side navigation (the FOX-style persistent mini-player).
 * Any component inside the tree calls usePlayer().play(track) to start audio;
 * MiniPlayer renders the controls. Resume position persists per episode to
 * localStorage (colony:progress:<episodeId>), matching the per-page AudioPlayer
 * convention so progress carries across surfaces.
 *
 * Dependency-free. No new design tokens — MiniPlayer styles via app-shell.css.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface PlayerTrack {
  /** Audio source URL (HLS/MP3/etc). */
  src: string;
  title: string;
  /** Stable id for resume-position persistence + same-track toggle. */
  episodeId: string;
  /** Optional subtitle line, e.g. "THE COLONY REPORT · 49M". */
  meta?: string;
  /** Where the mini-player title links to (the full episode page). */
  href?: string;
  /** Optional square cover art. */
  coverUrl?: string;
}

interface PlayerContextValue {
  track: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** Load + play a track. If it's already the current track, toggles play/pause. */
  play: (track: PlayerTrack) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  /** Stop and dismiss the mini-player. */
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const progressKey = (id: string) => `colony:progress:${id}`;

export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const lastSaveRef = useRef(0);

  const play = useCallback(
    (next: PlayerTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Same track → toggle instead of reloading.
      if (track && next.episodeId === track.episodeId) {
        if (audio.paused) void audio.play().catch(() => {});
        else audio.pause();
        return;
      }

      // Hand-off: pause any other page media (e.g. an in-page EpisodePlayer) so
      // the global bar is the single source of sound — no double audio.
      document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((el) => {
        if (el !== audio) el.pause();
      });

      setTrack(next);
      audio.src = next.src;
      audio.load();

      // Restore resume position (shared key with the per-page player).
      let resume = 0;
      try {
        const saved = localStorage.getItem(progressKey(next.episodeId));
        if (saved) resume = parseFloat(saved) || 0;
      } catch {
        /* localStorage unavailable — start at 0 */
      }
      const start = () => {
        if (resume > 0 && resume < (audio.duration || Infinity)) {
          audio.currentTime = resume;
        }
        void audio.play().catch(() => {});
        audio.removeEventListener("loadedmetadata", start);
      };
      audio.addEventListener("loadedmetadata", start);
    },
    [track],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  }, [track]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Bind <audio> events once.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      // Throttle progress persistence to ~once/5s.
      const now = Date.now();
      if (track && now - lastSaveRef.current > 5000) {
        lastSaveRef.current = now;
        try {
          localStorage.setItem(progressKey(track.episodeId), String(audio.currentTime));
        } catch {
          /* ignore */
        }
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (track) {
        try {
          localStorage.removeItem(progressKey(track.episodeId));
        } catch {
          /* ignore */
        }
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [track]);

  return (
    <PlayerContext.Provider
      value={{ track, isPlaying, currentTime, duration, play, toggle, seek, close }}
    >
      {children}
      {/* Single global audio element — persists across navigation. */}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within <PlayerProvider>");
  }
  return ctx;
}
