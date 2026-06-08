"use client";

import { useEffect, useRef, useState } from "react";
import { saveProgress } from "@/lib/viewer";

const HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";

type HlsInstance = {
  loadSource: (s: string) => void;
  attachMedia: (v: HTMLVideoElement) => void;
  destroy: () => void;
  liveSyncPosition?: number | null;
  levels?: Array<{ height?: number; bitrate?: number }>;
  currentLevel?: number;
  on: (evt: string, fn: (...a: any[]) => void) => void;
  off?: (evt: string, fn: (...a: any[]) => void) => void;
};

type HlsGlobal = { Hls?: new (config?: any) => HlsInstance };

interface VideoPlayerProps {
  src?: string | null;
  muxPlaybackId?: string | null;
  poster?: string | null;
  episodeId?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onTimeUpdate?: (t: number) => void;
  onPlayChange?: (playing: boolean) => void;
  seekCmd?: { time: number; token: number } | null; // for sync from EpisodePlayer
}

export default function VideoPlayer({
  src,
  muxPlaybackId,
  poster,
  episodeId,
  autoPlay = false,
  controls = true,
  onTimeUpdate,
  onPlayChange,
  seekCmd,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveSrc = src || (muxPlaybackId ? `https://stream.mux.com/${muxPlaybackId}.m3u8` : null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveSrc) return;

    const isHls = effectiveSrc.includes('.m3u8');
    let hls: HlsInstance | null = null;

    const cleanupHls = () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };

    if (isHls && typeof window !== 'undefined') {
      const loadHls = async () => {
        try {
          if (!(window as any).Hls) {
            await new Promise((res, rej) => {
              const s = document.createElement('script');
              s.src = HLS_CDN;
              s.onload = res;
              s.onerror = rej;
              document.head.appendChild(s);
            });
          }
          const HlsCtor = (window as HlsGlobal).Hls;
          if (HlsCtor && HlsCtor.isSupported && HlsCtor.isSupported()) {
            cleanupHls();
            hls = new HlsCtor({ lowLatencyMode: true });
            hlsRef.current = hls;
            hls.loadSource(effectiveSrc);
            hls.attachMedia(video);
            hls.on('error', () => setError('HLS load error'));
          } else {
            video.src = effectiveSrc; // fallback native
          }
        } catch (e) {
          video.src = effectiveSrc;
        }
      };
      loadHls();
    } else if (effectiveSrc) {
      video.src = effectiveSrc;
    }

    const onTime = () => {
      if (onTimeUpdate) onTimeUpdate(video.currentTime);
      if (episodeId) saveProgress(episodeId, video.currentTime, video.duration || 0);
    };
    const onPlay = () => onPlayChange && onPlayChange(true);
    const onPause = () => onPlayChange && onPlayChange(false);
    const onErr = () => setError('Playback error');

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onErr);

    if (autoPlay) video.play().catch(() => {});

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onErr);
      cleanupHls();
    };
  }, [effectiveSrc, episodeId, autoPlay, onTimeUpdate, onPlayChange]);

  // Handle external seekCmd for sync (from EpisodePlayer dual mode)
  useEffect(() => {
    if (seekCmd && videoRef.current) {
      videoRef.current.currentTime = seekCmd.time;
    }
  }, [seekCmd]);

  if (!effectiveSrc) {
    return <div className="video-placeholder">No video source</div>;
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        poster={poster || undefined}
        controls={controls}
        playsInline
        className="w-full"
        aria-label="Video player"
      />
      {error && <div role="alert" className="video-error">{error}</div>}
    </div>
  );
}