"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { useAuth } from "@/lib/auth-client";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];
const DEFAULT_PREVIEW_S = 300; // 5-minute free preview for non-members

interface Props {
  src: string;
  title: string;
  episodeId: string;
  /** show subtitle line (e.g. "EPISODE 43 · 49M") */
  meta?: string;
  /** seconds of free preview before the member gate (0 = no gate) */
  previewSeconds?: number;
  /** Optional callback to expose the underlying <audio> element for parent-managed
   *  features like Web Audio Analyser (real visualizer in audio-only mode for video episodes)
   *  or cross-media time sync on mode switch. Parent must provide stable fn. */
  audioRefCallback?: (el: HTMLAudioElement | null) => void;
  /** For EpisodePlayer podcast dual-source: parent-driven seek on mode switch or chapters click
   *  so position is preserved across audio<->video without reset. Reports feed parent state. */
  seekTo?: number | null;
  onTimeChange?: (t: number) => void;
  onPlayingChange?: (p: boolean) => void;
}

/** Dependency-free HTML5 audio player styled by player.css. Non-members get a
 *  5-minute preview, then playback pauses behind a join gate. Resume position
 *  persists to localStorage per episode.
 *
 *  Supports optional audioRefCallback + seekTo/onTimeChange/onPlayingChange for
 *  EpisodePlayer (real visualizer + dual audio/video source sync on mode toggle
 *  + chapters seek without position loss). */
export default function AudioPlayer({ src, title, episodeId, meta, previewSeconds = DEFAULT_PREVIEW_S, audioRefCallback, seekTo, onTimeChange, onPlayingChange }: Props) {
  const ref = useRef<HTMLAudioElement>(null);
  const lastSeekRef = useRef<number | null>(null);
  const { isMember } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);
  const [gated, setGated] = useState(false);
  const storeKey = `colony:resume:${episodeId}`;

  const gatedFor = useCallback((t: number) => !isMember && previewSeconds > 0 && t >= previewSeconds, [isMember, previewSeconds]);

  // Expose audio element to parent (e.g. EpisodePlayer for WebAudio visualizer + dual-source sync).
  // Runs after mount so ref is populated; cleans on unmount or prop change.
  useEffect(() => {
    audioRefCallback?.(ref.current);
    return () => {
      audioRefCallback?.(null);
    };
  }, [audioRefCallback]);

  // Podcast sync (slice 2): external seekTo from mode switch / chapters (preserves pos across audio/video).
  // Reports to parent for handoff.
  useEffect(() => {
    const el = ref.current;
    if (!el || seekTo == null) return;
    if (seekTo !== lastSeekRef.current) {
      const clamped = Math.max(0, Math.min(seekTo, (el.duration || seekTo) as number));
      el.currentTime = clamped;
      lastSeekRef.current = seekTo;
      onTimeChange?.(clamped);
    }
  }, [seekTo, onTimeChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onTimeChange?.(el.currentTime || 0);
    const playR = () => onPlayingChange?.(true);
    const pauseR = () => onPlayingChange?.(false);
    el.addEventListener("timeupdate", report);
    el.addEventListener("play", playR);
    el.addEventListener("pause", pauseR);
    return () => {
      el.removeEventListener("timeupdate", report);
      el.removeEventListener("play", playR);
      el.removeEventListener("pause", pauseR);
    };
  }, [onTimeChange, onPlayingChange]);

  const skip = useCallback((delta: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || Infinity, el.currentTime + delta));
  }, []);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      if (gatedFor(el.currentTime)) { setGated(true); return; }
      void el.play();
    } else el.pause();
  }, []);

  const cycleSpeed = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    el.playbackRate = next;
    setSpeed(next);
  }, [speed]);

  // Restore saved position once metadata (duration) is known.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoaded = () => {
      setDuration(el.duration || 0);
      setReady(true);
      const saved = Number(localStorage.getItem(storeKey));
      if (saved > 5 && saved < (el.duration || 0) - 5) el.currentTime = saved;
    };
    const onTime = () => {
      setTime(el.currentTime);
      if (gatedFor(el.currentTime)) {
        el.pause();
        el.currentTime = previewSeconds;
        setTime(previewSeconds);
        setGated(true);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [storeKey]);

  // Persist position (throttled) + on page hide.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const save = () => { if (Number.isFinite(el.currentTime)) localStorage.setItem(storeKey, String(el.currentTime)); };
    const id = window.setInterval(save, 5000);
    window.addEventListener("pagehide", save);
    return () => { window.clearInterval(id); save(); window.removeEventListener("pagehide", save); };
  }, [storeKey]);

  const onScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    let value = Number(e.target.value);
    if (!isMember && previewSeconds > 0 && value > previewSeconds) value = previewSeconds; // can't seek past the preview
    el.currentTime = value;
  };

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className="aplayer" onKeyDown={(e) => {
      if (e.key === " ") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "j") skip(-15);
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "l") skip(15);
    }} tabIndex={0} role="group" aria-label={`Audio player — ${title}`}>
      <audio ref={ref} src={src} preload="metadata" />

      <div className="aplayer__head">
        <span className="aplayer__eyebrow">▶ NOW PLAYING</span>
        <span className="aplayer__title">{title}</span>
        {meta && <span className="aplayer__meta">{meta}</span>}
      </div>

      <div className="aplayer__scrub">
        <span className="aplayer__time">{formatDuration(time)}</span>
        <input
          className="aplayer__range"
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={time}
          onChange={onScrub}
          aria-label="Seek"
          style={{ background: `linear-gradient(to right, var(--color-alarm) ${pct}%, var(--color-rule) ${pct}%)` }}
        />
        <span className="aplayer__time">{ready ? formatDuration(duration) : "--:--"}</span>
      </div>

      <div className="aplayer__controls">
        <button type="button" className="aplayer__btn" onClick={() => skip(-15)} aria-label="Back 15 seconds">« 15</button>
        <button type="button" className="aplayer__btn aplayer__btn--play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button type="button" className="aplayer__btn" onClick={() => skip(15)} aria-label="Forward 15 seconds">15 »</button>
        <button type="button" className="aplayer__btn aplayer__btn--speed" onClick={cycleSpeed} aria-label="Playback speed">{speed}×</button>
        <a className="aplayer__btn aplayer__dl" href={src} download aria-label="Download episode">↓</a>
      </div>

      {gated && !isMember && (
        <div className="aplayer__paywall" role="region" aria-label="Members only">
          <span className="aplayer__paywall-eyebrow">▼ 5-MINUTE PREVIEW OVER</span>
          <p className="aplayer__paywall-copy">Members hear every minute. Join for full episodes across all four shows — $4.99/mo.</p>
          <div className="aplayer__paywall-actions">
            <Link className="btn btn--primary btn--sm" href="/membership">Join — $4.99/mo</Link>
            <Link className="btn btn--outline btn--sm" href="/membership/account">Sign In</Link>
          </div>
        </div>
      )}
    </div>
  );
}
