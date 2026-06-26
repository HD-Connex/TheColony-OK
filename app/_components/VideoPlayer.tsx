"use client";

import { useEffect, useRef, useState } from "react";
import { saveProgress } from "@/lib/viewer";
import { STOCK } from "@/lib/media-map";
// Note: for fully authenticated progress, prefer the /api/progress route (which has user context).
// viewer.saveProgress now supports an optional userId 4th arg to write to watch_progress table.

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

/** Native HTML5 video for direct MP4/HLS. For .m3u8 on browsers without native
 *  HLS (i.e. not Safari), hls.js is dynamically imported (bundled dependency) —
 *  code-split and served from our own origin. When `episodeId` is set, playback
 *  progress is saved for the signed-in viewer (continue-watching).
 *
 *  Enhanced with custom editorial chrome for live/replay...
 *
 *  Also accepts optional seekTo + onTimeChange/onPlayingChange for EpisodePlayer
 *  podcast dual audio/video sync (mode toggle preserves position) and chapters.
 *  (Only active for !isLive replay cases in podcast context.)
 */
export default function VideoPlayer({
  src,
  poster,
  title,
  episodeId,
  isLive = false,
  seekTo,
  onTimeChange,
  onPlayingChange,
}: {
  src: string;
  poster?: string;
  title?: string;
  episodeId?: string;
  isLive?: boolean;
  /** Support for podcast EpisodePlayer dual-source mode sync (pause+seek on toggle) and chapters seek.
   *  Only effective for native (non-embed) video sources. Optional to not affect series/live usage.
   *  Object with time in seconds and a counter to detect seek commands even for the same time value. */
  seekTo?: { time: number; counter: number } | null;
  onTimeChange?: (t: number) => void;
  onPlayingChange?: (p: boolean) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // UI state for custom chrome
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Array<{ idx: number; label: string }>>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto

  // Save watch progress (throttled) for the native player (replays/episodes).
  useEffect(() => {
    const video = ref.current;
    if (!video || !episodeId) return;
    let last = 0;
    const onTime = () => {
      const now = Date.now();
      if (now - last < 10000) return;
      last = now;
      if (video.currentTime > 3) saveProgress(episodeId, video.currentTime, video.duration);
    };
    const onPause = () => { if (video.currentTime > 3) saveProgress(episodeId, video.currentTime, video.duration); };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("pause", onPause);
    return () => { video.removeEventListener("timeupdate", onTime); video.removeEventListener("pause", onPause); };
  }, [episodeId]);

  // ─── Podcast dual-source sync support (slice 2) + reporting for parent (EpisodePlayer) ───
  // seekTo allows mode switch / chapters to hand off position without reset.
  // on*Change feed parent currentTime/playing so it can capture on toggle.
  // Uses seekTo.counter for change detection so same-time seeks (e.g. chapter twice) still work.
  useEffect(() => {
    const v = ref.current;
    if (!v || seekTo == null) return;
    const clamped = Math.max(0, Math.min(seekTo.time, (v.duration || seekTo.time) as number));
    v.currentTime = clamped;
    setCurrentTime(clamped);
    onTimeChange?.(clamped);
  }, [seekTo?.counter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Report time/playing state to parent (for sync handoff + chapters). Separate listeners so we don't
  // mutate the big attach effect.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reportTime = () => { onTimeChange?.(v.currentTime || 0); };
    const reportPlay = () => onPlayingChange?.(true);
    const reportPause = () => onPlayingChange?.(false);
    v.addEventListener("timeupdate", reportTime);
    v.addEventListener("play", reportPlay);
    v.addEventListener("pause", reportPause);
    return () => {
      v.removeEventListener("timeupdate", reportTime);
      v.removeEventListener("play", reportPlay);
      v.removeEventListener("pause", reportPause);
    };
  }, [onTimeChange, onPlayingChange]);

  // Core video + HLS attach + custom control listeners. Re-runs on src or manual reconnect (reloadToken).
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLatency(null);
    setLevels([]);
    setCurrentLevel(-1);
    hlsRef.current = null;

    const isHls = /\.m3u8(\?|$)/.test(src);

    const updateLatency = () => {
      if (!isLive || !video) {
        setLatency(null);
        return;
      }
      const hls = hlsRef.current;
      let lat: number | null = null;
      if (hls && typeof hls.liveSyncPosition === "number" && hls.liveSyncPosition > 0) {
        lat = Math.max(0, hls.liveSyncPosition - video.currentTime);
      } else if (video.buffered && video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        lat = Math.max(0, end - video.currentTime);
      }
      if (lat != null) setLatency(Math.round(lat * 10) / 10);
    };

    const onTime = () => {
      setCurrentTime(video.currentTime || 0);
      setDuration((prev) => (!prev && video.duration && isFinite(video.duration) ? video.duration : prev));
      updateLatency();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoaded = () => {
      if (video.duration && isFinite(video.duration)) setDuration(video.duration);
      updateLatency();
    };
    const onErr = () => {
      const msg = video.error?.message?.includes("Mux") || /stream\.mux\.com/.test(src)
        ? "Video asset not available (Mux playback error)"
        : "Stream error — tap reconnect";
      setError(msg);
    };
    const onProgress = () => updateLatency();

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onErr);
    video.addEventListener("progress", onProgress);

    // Attach source (native or hls.js)
    if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      // For native live-ish, still allow basic latency via buffer
      const natIv = setInterval(updateLatency, 1200);
      return () => {
        clearInterval(natIv);
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onErr);
        video.removeEventListener("progress", onProgress);
      };
    }

    // HLS path — hls.js is a bundled dependency, dynamically imported so it stays
    // code-split and is served from our own origin (cacheable by the service worker
    // for offline replay; no runtime CDN dependency). Native-HLS browsers (Safari/iOS)
    // never reach here — they took the canPlayType branch above.
    let cancelled = false;

    const attachHls = (Hls: new (config?: any) => HlsInstance) => {
      if (cancelled) return;
      // Mobile-tuned hls.js config:
      // - lowLatencyMode only for live (it's pointless and stall-prone on VOD/cellular).
      // - capLevelToPlayerSize avoids fetching renditions larger than the rendered
      //   player — a big data/battery win on phones.
      // - bounded forward/back buffers keep memory in check on low-end devices.
      const inst = new Hls({
        enableWorker: true,
        lowLatencyMode: isLive,
        capLevelToPlayerSize: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      inst.loadSource(src);
      inst.attachMedia(video);
      hlsRef.current = inst;

      // Capture quality levels + live edge
      const handleManifest = () => {
        if (!inst.levels || !inst.levels.length) return;
        const ls = inst.levels.map((l, idx) => ({
          idx,
          label: l.height ? `${l.height}p` : l.bitrate ? `${Math.round(l.bitrate / 1000)}k` : `L${idx}`,
        }));
        setLevels([{ idx: -1, label: "AUTO" }, ...ls]);
        setCurrentLevel(inst.currentLevel ?? -1);
      };
      inst.on("hlsManifestParsed" as any, handleManifest);
      inst.on("hlsLevelSwitched" as any, () => setCurrentLevel(inst.currentLevel ?? -1));
      inst.on("hlsError" as any, (_evt: any, data: any) => {
        if (data?.fatal) {
          const muxMsg = /stream\.mux\.com/.test(src)
            ? "Video asset not available (Mux playback error)"
            : "Stream error";
          setError(muxMsg);
        }
      });

      // Initial latency tick
      setTimeout(updateLatency, 800);
    };

    import("hls.js")
      .then((mod) => {
        if (cancelled) return;
        const Hls = mod.default as unknown as {
          isSupported: () => boolean;
          new (config?: any): HlsInstance;
        };
        if (Hls.isSupported()) {
          attachHls(Hls as unknown as new (config?: any) => HlsInstance);
        } else {
          setError("HLS not supported on this device");
        }
      })
      .catch(() => setError("HLS loader failed — tap reconnect"));

    return () => {
      cancelled = true;
      const h = hlsRef.current;
      if (h) {
        try { h.destroy(); } catch {}
        hlsRef.current = null;
      }
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onErr);
      video.removeEventListener("progress", onProgress);
    };
  }, [src, reloadToken, isLive]);

  // Pause live playback when the tab/app is backgrounded (saves battery + cellular
  // data on mobile); rejoin the live edge and resume on return. Replay/VOD is left
  // untouched (the user may intend to keep listening). To keep live AUDIO playing in
  // the background instead, remove the pause branch below.
  useEffect(() => {
    if (!isLive) return;
    const v = ref.current;
    if (!v) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (!v.paused) v.pause();
      } else {
        const h = hlsRef.current;
        if (h && typeof h.liveSyncPosition === "number" && h.liveSyncPosition > 0) {
          v.currentTime = h.liveSyncPosition;
        }
        void v.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isLive]);

  // --- Custom control actions ---
  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seek = (t: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
    setCurrentTime(v.currentTime);
  };

  const goLiveEdge = () => {
    const v = ref.current;
    const h = hlsRef.current;
    if (!v) return;
    if (h && typeof h.liveSyncPosition === "number" && h.liveSyncPosition > 0) {
      v.currentTime = h.liveSyncPosition;
    } else if (v.buffered && v.buffered.length > 0) {
      v.currentTime = Math.max(0, v.buffered.end(v.buffered.length - 1) - 0.5);
    } else if (v.duration && isFinite(v.duration)) {
      v.currentTime = Math.max(0, v.duration - 1);
    }
    if (v.paused) v.play().catch(() => {});
  };

  const reconnect = () => {
    const v = ref.current;
    const h = hlsRef.current;
    if (h) {
      try { h.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
    setError(null);
    setReloadToken((t) => t + 1); // re-run attach effect
  };

  const setQuality = (idx: number) => {
    const h = hlsRef.current;
    if (!h) return;
    h.currentLevel = idx; // -1 auto
    setCurrentLevel(idx);
  };

  const fmtTime = (t: number) => {
    if (!isFinite(t) || t <= 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const showSeek = !isLive && duration > 0;

  return (
    <div className="live-player live-player--custom">
      <video
        ref={ref}
        poster={poster || STOCK.slateDefault}
        title={title}
        playsInline
        muted
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Center play affordance (large, editorial, only when paused) */}
      {!isPlaying && !error && (
        <button
          type="button"
          className="live-player__center-play"
          onClick={togglePlay}
          aria-label="Play stream"
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </button>
      )}

      {/* Error state with reconnect */}
      {error && (
        <div className="live-player__offline live-player__error">
          <div className="live-player__offline-icon">!</div>
          <span className="live-player__status">{error}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={reconnect}>RECONNECT</button>
        </div>
      )}

      {/* Custom chrome bar (restrained, mono, alarm accents, token-driven) */}
      <div className="live-chrome" role="group" aria-label="Player controls">
        <button
          type="button"
          className="live-chrome__btn live-chrome__play"
          onClick={togglePlay}
          disabled={!!error}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
          )}
        </button>

        {showSeek && (
          <>
            <input
              type="range"
              className="live-chrome__seek"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || currentTime)}
              onChange={(e) => seek(parseFloat(e.target.value))}
              aria-label="Seek"
            />
            <span className="live-chrome__time">
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
          </>
        )}

        {isLive && (
          <div className="live-chrome__live">
            {latency != null ? <span className="live-chrome__latency">LAT {latency}s</span> : <span className="live-chrome__latency">LIVE</span>}
            <button type="button" className="live-chrome__btn live-chrome__go" onClick={goLiveEdge} disabled={!!error}>
              GO LIVE
            </button>
          </div>
        )}

        {levels.length > 1 && (
          <select
            className="live-chrome__quality"
            value={currentLevel}
            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
            aria-label="Quality"
          >
            {levels.map((l) => (
              <option key={l.idx} value={l.idx}>{l.label}</option>
            ))}
          </select>
        )}

        <button type="button" className="live-chrome__btn live-chrome__reconnect" onClick={reconnect} aria-label="Reconnect stream">
          ⟳
        </button>
      </div>
    </div>
  );
}
