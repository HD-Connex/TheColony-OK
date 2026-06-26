"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AudioPlayer from "./AudioPlayer";
import MiniPlayerButton from "./MiniPlayerButton";
import { usePlayer } from "./PlayerProvider";
import VideoPlayer from "./VideoPlayer";
import VideoEmbed from "./VideoEmbed";
import { formatDate, formatDuration, formatDurationLabel } from "@/lib/format";
import type { Transcript, TranscriptSegment } from "@/lib/transcripts";
import { searchTranscript, formatTranscriptTime, exportSrt } from "@/lib/transcripts";
import TranscriptClipper from "./TranscriptClipper"; // Phase 2: one-click moments from transcript segments in player

export interface PlayableEpisode {
  id: string;
  title: string;
  episode_no: number | null;
  pub_date: string;
  duration_s: number | null;
  audio_url: string | null;
  // Optional video support for Spotify-style "video version" of podcast episodes.
  // When present, EpisodePlayer offers an Audio-only / Video toggle (like Spotify video podcasts).
  video_url?: string | null;
  mux_playback_id?: string | null;
  // Chapters stub (see slice 3). Array of { t: seconds, label: string }.
  // Future schema (add to episodes table + RSS parser): chapters jsonb or separate table
  // e.g. [{ "t": 0, "label": "Intro" }, ...]. Used for clickable seek in player.
  chapters?: Array<{ t: number; label: string }>;
}

/** Shared player (audio + optional video mode like Spotify) + clickable episode library.
 *  Clicking a row loads that episode. When a video source is available the player
 *  surfaces a mode toggle (Video / Audio only) with a visual stage for video and
 *  real Web Audio visualizer (Analyser + canvas freq bars) + full controls for audio-only.
 *
 *  Design per design skill: player anatomy includes mode tabs, video-stage (live-player box),
 *  audio block (aplayer), visualizer overlay, seekbar (inside aplayer), chapters list (clickable).
 *  Motion: prepared for framer AnimatePresence on stage switch (150-300ms, editorial).
 *
 *  Sliced per implement-and-review: visualizer (1), dual-source sync (2), chapters stub (3).
 *  Notes for per-ep pages: the "podcast-player" block + mode/visualizer/sync logic can be
 *  extracted to a reusable <PodcastMediaPlayer episode={active} ... /> for /podcasts/[slug]/[ep]
 *  routes; the episode-list below is the "library" part. EpisodePlayer wires demo data.
 *
 *  Full data model now wired (video_url etc on episodes table + parser + admin + seed).
 *  Real video podcast episodes (e.g. colony-report video demo) surface toggle, VIDEO badge, visualizer, chapters from DB. */
export default function EpisodePlayer({ episodes: episodesProp, episode: episodeProp, transcript }: { episodes?: PlayableEpisode[]; episode?: PlayableEpisode; transcript?: Transcript | null }) {
  // Support singular for per-ep dedicated page + array for library
  const episodes = useMemo(() => episodesProp || (episodeProp ? [episodeProp] : []), [episodesProp, episodeProp]);
  const firstPlayable = useMemo(() => episodes.find((e) => e.audio_url) ?? null, [episodes]);
  const [activeId, setActiveId] = useState<string | null>(firstPlayable?.id ?? null);
  const [mode, setMode] = useState<"video" | "audio">("video"); // default video when available
  const playerRef = useRef<HTMLDivElement>(null);

  const active = episodes.find((e) => e.id === activeId) ?? firstPlayable;
  const hasVideo = !!(active && (active.video_url || active.mux_playback_id));

  // Auto-prefer video mode when the active episode has video
  const effectiveMode = hasVideo ? mode : "audio";

  // ─── Dual source sync state (slice 2) ───
  // mediaTime / mediaPlaying lifted so mode switch can capture current pos from whichever
  // is mounted and hand it to the other via seekCmd without reset.
  // seekCmd uses a counter so same-time seeks (e.g. clicking same chapter twice) trigger re-seek.
  const [seekCmd, setSeekCmd] = useState<{ time: number; counter: number } | null>(null);
  const [mediaTime, setMediaTime] = useState(0);
  const [mediaPlaying, setMediaPlaying] = useState(false);

  // Phase 2 transcript panel local search (client only)
  const [transcriptQuery, setTranscriptQuery] = useState("");

  // Sync handoff on mode change (pause implicit on unmount; seek the incoming at captured t)
  const requestMode = useCallback((newMode: "video" | "audio") => {
    if (!hasVideo || newMode === effectiveMode) return;
    const t = mediaTime || 0;
    setSeekCmd(prev => ({ time: t, counter: (prev?.counter ?? 0) + 1 }));
    setMode(newMode);
  }, [hasVideo, effectiveMode, mediaTime]);

  // Chapters from DB (episodes.chapters jsonb): set seekCmd so whichever source is currently active (audio or native video)
  // jumps without full reset. Works with the same sync plumbing. Position handoff best-effort for embeds (YT).
  const seekToChapter = useCallback((t: number) => {
    setSeekCmd(prev => ({ time: Math.max(0, t), counter: (prev?.counter ?? 0) + 1 }));
  }, []);

  // ─── Real Web Audio visualizer (slice 1 per implement-and-review + design skill) ───
  // Attached only in audio-only mode *when the episode also has a video source* (dual).
  // Uses AnalyserNode + rAF canvas draw for frequency bars. Restrained aesthetic:
  // small canvas, alarm-red thin bars, low fft, smoothing; matches ui-ux-pro-max-skill
  // "Podcast Platform" / editorial motion restraint (data-driven, no gratuitous CSS loops;
  // respects spirit of 150-300ms, transform/opacity, reduced-motion via perf).
  // Canvas replaces the old 5-bar CSS stub. Parent manages because dual sources + sync prep.
  // (Per browser-and-verification: will test mode switch + viz reacting to real audio playback.)
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const drawVisualizerRef = useRef<(() => void) | null>(null);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const c = canvas.getContext("2d", { alpha: true });
    if (!c) return;
    const w = canvas.width;
    const h = canvas.height;
    const binCount = analyser.frequencyBinCount;
    const freq = new Uint8Array(binCount);
    analyser.getByteFrequencyData(freq);

    c.clearRect(0, 0, w, h);
    const barCount = Math.min(24, binCount);
    const barW = Math.max(1.5, (w / barCount) * 0.55);
    const gap = 1.5;
    const usableW = barCount * barW + (barCount - 1) * gap;
    let x = Math.max(0, (w - usableW) / 2);
    const maxBarH = h * 0.9;
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * binCount);
      const v = freq[idx] / 255;
      const bh = Math.max(1.5, v * maxBarH);
      try {
        const varAlarm = (typeof document !== 'undefined')
          ? getComputedStyle(document.documentElement).getPropertyValue('--color-alarm').trim()
          : '';
        c.fillStyle = varAlarm || '#ec1024';
      } catch {
        c.fillStyle = '#ec1024';
      }
      c.fillRect(x, h - bh, barW, bh);
      x += barW + gap;
    }
    rafRef.current = requestAnimationFrame(drawVisualizerRef.current!);
  }, []);

  useEffect(() => { drawVisualizerRef.current = drawVisualizer; }, [drawVisualizer]);

  const initVisualizer = useCallback((audio: HTMLAudioElement) => {
    stopVisualizer();
    if (!audio) return;
    try {
      const CtxCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      if (!CtxCtor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new CtxCtor();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();

      if (!sourceRef.current || (sourceRef.current as any).mediaElement !== audio) {
        try { sourceRef.current?.disconnect(); } catch {}
        sourceRef.current = ctx.createMediaElementSource(audio);
      }
      const source = sourceRef.current;

      if (!analyserRef.current) {
        const an = ctx.createAnalyser();
        an.fftSize = 64; // 32 bins → draw ~24 bars; small & tasteful
        an.smoothingTimeConstant = 0.78;
        analyserRef.current = an;
      }
      const analyser = analyserRef.current;

      source.disconnect();
      analyser.disconnect();
      source.connect(analyser);
      analyser.connect(ctx.destination); // keep audible

      drawVisualizer();
    } catch (err) {
      // graceful degrade (e.g. no web audio in some envs); css stub would have been here
      if (process.env.NODE_ENV !== "production") console.warn("[EpisodePlayer] visualizer init failed:", err);
    }
  }, [drawVisualizer, stopVisualizer]);

  // React to mode / hasVideo changes to (re)attach or stop viz (only for dual-source eps)
  useEffect(() => {
    const el = audioElRef.current;
    if (effectiveMode === "audio" && hasVideo && el) {
      initVisualizer(el);
    } else {
      stopVisualizer();
    }
  }, [effectiveMode, hasVideo, initVisualizer, stopVisualizer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualizer();
      try { analyserRef.current?.disconnect(); } catch {}
      try { sourceRef.current?.disconnect(); } catch {}
      // leave ctx open (cheap); full close would kill future audio on same page
    };
  }, [stopVisualizer]);

  // Stable callback passed to AudioPlayer so we get the el for analyser (and future sync)
  const setAudioEl = useCallback((el: HTMLAudioElement | null) => {
    audioElRef.current = el;
    if (el && effectiveMode === "audio" && hasVideo) {
      initVisualizer(el);
    } else if (!el) {
      stopVisualizer();
    }
  }, [effectiveMode, hasVideo, initVisualizer, stopVisualizer]);

  const play = (id: string) => {
    setActiveId(id);
    setMediaTime(0);
    setMediaPlaying(false);
    setSeekCmd(null);
    // Reset to video preference for episodes that support it
    const next = episodes.find((e) => e.id === id);
    if (next && (next.video_url || next.mux_playback_id)) setMode("video");
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  // ─── Provider unification: hand the in-page player off to the global mini-player ───
  // When the user navigates away while this episode is playing, audio continues in the
  // persistent bar from the same position (Spotify "continue listening"). We mirror the
  // latest state into a ref so the unmount cleanup runs exactly once with fresh values,
  // and skip the handoff if the bar already owns this track (avoids re-toggling it off).
  const { play: miniPlay, track: globalTrack } = usePlayer();
  const handoffRef = useRef<{
    playing: boolean;
    time: number;
    episode: PlayableEpisode | null;
    globalId: string | null;
  }>({ playing: false, time: 0, episode: null, globalId: null });

  useEffect(() => {
    handoffRef.current = {
      playing: mediaPlaying,
      time: mediaTime,
      episode: active ?? null,
      globalId: globalTrack?.episodeId ?? null,
    };
  }, [mediaPlaying, mediaTime, active, globalTrack?.episodeId]);

  const miniPlayRef = useRef(miniPlay);
  useEffect(() => { miniPlayRef.current = miniPlay; }, [miniPlay]);

  useEffect(() => {
    return () => {
      const { playing, time, episode, globalId } = handoffRef.current;
      if (!playing || !episode?.audio_url || episode.id === globalId) return;
      try {
        localStorage.setItem(`colony:progress:${episode.id}`, String(time));
      } catch {
        /* localStorage unavailable — bar will start from 0 */
      }
      miniPlayRef.current({
        src: episode.audio_url,
        title: episode.title,
        episodeId: episode.id,
        meta: `EPISODE ${episode.episode_no ?? "—"}`,
      });
    };
  }, []);

  // Resolve a playable video src (reuse the same logic the shows use)
  const videoSrc = active?.video_url || (active?.mux_playback_id ? `https://stream.mux.com/${active.mux_playback_id}.m3u8` : null);
  const isEmbedVideo = videoSrc && !videoSrc.includes(".m3u8");

  return (
    <>
      <div ref={playerRef}>
        {active && (active.audio_url || hasVideo) ? (
          <div className="podcast-player">
            {/* Mode toggle — Spotify-style Audio only / Video (only shown when video is available for this ep) */}
            {hasVideo && (
              <div className="podcast-player__modes" role="tablist" aria-label="Playback mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveMode === "video"}
                  className={`podcast-player__mode ${effectiveMode === "video" ? "is-active" : ""}`}
                  onClick={() => requestMode("video")}
                >
                  ▶ Video
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={effectiveMode === "audio"}
                  className={`podcast-player__mode ${effectiveMode === "audio" ? "is-active" : ""}`}
                  onClick={() => requestMode("audio")}
                >
                  ♪ Audio only
                </button>
              </div>
            )}

            {/* Video stage (when in video mode and video available) — wrapped for framer transition per design/ui-ux-pro-max-skill */}
            <AnimatePresence mode="wait">
              {effectiveMode === "video" && hasVideo && videoSrc && (
                <motion.div
                  key="video-stage"
                  className="podcast-player__video-stage"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isEmbedVideo ? (
                    <VideoEmbed url={videoSrc} title={active.title} />
                  ) : (
                    <VideoPlayer
                      src={videoSrc}
                      title={active.title}
                      episodeId={active.id}
                      seekTo={seekCmd}
                      onTimeChange={setMediaTime}
                      onPlayingChange={setMediaPlaying}
                    />
                  )}
                </motion.div>
              )}

              {/* Audio player (always available; shown in audio mode or when no video) */}
              {(effectiveMode === "audio" || !hasVideo) && active.audio_url && (
                <motion.div
                  key="audio-block"
                  className="podcast-player__audio"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <AudioPlayer
                    key={active.id}
                    src={active.audio_url}
                    title={active.title}
                    episodeId={active.id}
                    meta={`EPISODE ${active.episode_no ?? "—"} · ${formatDurationLabel(active.duration_s)}`}
                    audioRefCallback={setAudioEl}
                    seekTo={seekCmd}
                    onTimeChange={setMediaTime}
                    onPlayingChange={setMediaPlaying}
                  />
                  {/* Real visualizer (Web Audio AnalyserNode + rAF canvas) — only for episodes with video_url when in audio-only.
                     Replaces prior CSS stub. Follows design skill player anatomy + ui-ux-pro-max-skill restraint. */}
                  {effectiveMode === "audio" && hasVideo && (
                    <div className="podcast-player__visualizer" aria-hidden>
                      <canvas ref={canvasRef} width={240} height={28} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chapters (basic list + clickable seek). Per design skill player anatomy (seekbar with chapters support).
               Data from episodes.chapters (jsonb via admin/seed/RSS). Clicking seeks the active media source via the shared sync cmd (works for audio + native video). */}
            {active?.chapters && active.chapters.length > 0 && (
              <div className="podcast-player__chapters" aria-label="Chapters">
                <div className="podcast-player__chapters-label">▼ CHAPTERS</div>
                <div className="podcast-player__chapters-list" role="list">
                  {active.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chapter-btn"
                      onClick={() => seekToChapter(ch.t)}
                      aria-label={`Seek to ${formatDuration(ch.t)} — ${ch.label}`}
                    >
                      <span className="chapter-time">{formatDuration(ch.t)}</span>
                      <span className="chapter-label">{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 2 Full AI: Transcript panel. Real segments from DB (or generated on first view via getOrGenerate). Searchable, timestamped, seek + TranscriptClipper for auto moment clips. Gated: if no transcript prop (no key), hidden. Brutalist grain style matching design system. */}
            {transcript && transcript.segments && transcript.segments.length > 0 && (
              <div className="podcast-player__transcript grain" style={{ marginTop: "var(--space-3)", border: "1px solid var(--color-brass)", padding: "var(--space-2)", background: "var(--color-paper)" }} aria-label="Transcript">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                  <div className="podcast-player__chapters-label">▼ TRANSCRIPT — {transcript.provider.toUpperCase()} {transcript.language?.toUpperCase()}</div>
                  {transcript.srt && (
                    <button
                      type="button"
                      className="btn btn--sm btn--outline"
                      onClick={() => {
                        const srt = exportSrt(transcript);
                        const blob = new Blob([srt], { type: "text/srt" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `transcript-${active?.id || "ep"}.srt`;
                        a.click();
                      }}
                    >
                      Download SRT
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Search transcript…"
                  className="search-input"
                  style={{ width: "100%", marginBottom: "var(--space-2)", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
                  onChange={(e) => setTranscriptQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  style={{ fontSize: "10px", marginBottom: "var(--space-1)" }}
                  onClick={() => {
                    // Phase 2: AI-suggest moments via quote detection heuristic (", ?, impactful phrases) from real transcript segments. One-click clipper below does Blob + caption.
                    const q = transcript.segments
                      .filter((s: any) => /["“”'‘’]/.test(s.text) || /\?|!/.test(s.text) || s.text.length > 70)
                      .map((s: any) => s.text.slice(0, 40))
                      .join(" ");
                    setTranscriptQuery(q || "the ");
                  }}
                >
                  Suggest AI quote moments
                </button>

                <div style={{ maxHeight: 280, overflow: "auto", fontSize: "var(--text-xs)", lineHeight: 1.35, fontFamily: "var(--font-mono)" }}>
                  {(transcriptQuery ? searchTranscript(transcript, transcriptQuery) : transcript.segments).slice(0, 80).map((seg: TranscriptSegment, idx: number) => (
                    <div key={idx} style={{ padding: "4px 0", borderBottom: "1px dotted var(--color-border)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <button
                        type="button"
                        onClick={() => seekToChapter(seg.start)}
                        className="chapter-btn"
                        style={{ minWidth: 52, fontFamily: "var(--font-mono)" }}
                        aria-label={`Seek to ${formatTranscriptTime(seg.start)}`}
                      >
                        {formatTranscriptTime(seg.start)}
                      </button>
                      <span style={{ flex: 1 }}>{seg.text}</span>
                      <TranscriptClipper
                        href={`#t=${Math.floor(seg.start)}`}
                        title={seg.text.slice(0, 80)}
                        startTime={seg.start}
                        phrase={seg.text}
                        epId={active?.id}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: 4 }}>Click time to seek. Use clip button for shareable Citizen Dispatch moments (member). Real DB rows only.</div>
              </div>
            )}
          </div>
        ) : (
          <p className="aplayer__empty">▼ AUDIO PUBLISHES WITH EACH EPISODE · CHECK BACK SOON</p>
        )}
      </div>

      <div className="episode-list">
        {episodes.length === 0 && (
          <p className="episode-list__empty">▼ FEED LOADING · CRON RUNS EVERY 20 MINUTES</p>
        )}
        {episodes.map((ep) => {
          const isActive = ep.id === active?.id;
          const playable = !!ep.audio_url;
          const epHasVideo = !!(ep.video_url || ep.mux_playback_id);
          return (
            <div className={`episode-row${isActive ? " episode-row--active" : ""}`} key={ep.id}>
              <button
                type="button"
                className="episode-row__play"
                onClick={() => playable && play(ep.id)}
                disabled={!playable}
                aria-label={playable ? `Play ${ep.title}` : `${ep.title} (audio pending)`}
              >
                {isActive ? "❚❚" : "▶"}
              </button>
              <div className="episode-row__info">
                <div className="episode-row__title">
                  {ep.title}
                  {epHasVideo && <span className="episode-row__video-badge">VIDEO</span>}
                </div>
                <div className="episode-row__date">{formatDate(ep.pub_date)}</div>
              </div>
              {playable && ep.audio_url && (
                <MiniPlayerButton
                  className="episode-row__mini"
                  track={{
                    src: ep.audio_url,
                    title: ep.title,
                    episodeId: ep.id,
                    meta: `EPISODE ${ep.episode_no ?? "—"}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
