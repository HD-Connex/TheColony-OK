"use client";

/**
 * MiniPlayer — persistent audio bar driven by PlayerProvider.
 *
 * Renders nothing until a track is loaded via usePlayer().play(). Sits above the
 * BottomTabBar on mobile and at the bottom edge on desktop. Brutalist DS: ink bar,
 * alarm rule, mono labels, zero-radius. Styles live in app-shell.css.
 */

import Link from "next/link";
import Image from "next/image";
import { usePlayer } from "./PlayerProvider";

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const { track, isPlaying, currentTime, duration, toggle, seek, close } = usePlayer();

  if (!track) return null;

  return (
    <div className="miniplayer" role="region" aria-label="Now playing">
      <button
        type="button"
        className="miniplayer__toggle"
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
      </button>

      {track.coverUrl ? (
        <div className="miniplayer__art">
          <Image src={track.coverUrl} alt={track.title ? `Cover art for ${track.title}` : "Cover art"} fill sizes="40px" className="img-cover" />
        </div>
      ) : null}

      <div className="miniplayer__info">
        {track.href ? (
          <Link href={track.href} className="miniplayer__title">
            {track.title}
          </Link>
        ) : (
          <div className="miniplayer__title">{track.title}</div>
        )}
        <div className="miniplayer__meta">
          <span>{fmt(currentTime)}</span>
          {track.meta ? <span className="miniplayer__metalabel">{track.meta}</span> : null}
          <span>{fmt(duration)}</span>
        </div>
        <input
          className="miniplayer__scrubber"
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
        />
      </div>

      <button
        type="button"
        className="miniplayer__close"
        onClick={close}
        aria-label="Close player"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>
    </div>
  );
}
