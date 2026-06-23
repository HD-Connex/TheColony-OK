"use client";

/**
 * MiniPlayerButton — sends an episode to the global persistent mini-player.
 * Drop anywhere inside <PlayerProvider> (e.g. episode rows, show pages) to give
 * one-tap playback that survives navigation. Brutalist styling via app-shell /
 * buttons CSS; pass className to restyle per context.
 */

import { usePlayer, type PlayerTrack } from "./PlayerProvider";

interface Props {
  track: PlayerTrack;
  className?: string;
  label?: string;
}

export default function MiniPlayerButton({ track, className, label = "Mini" }: Props) {
  const { play, track: current, isPlaying } = usePlayer();
  const isCurrent = current?.episodeId === track.episodeId;

  return (
    <button
      type="button"
      className={className ?? "btn btn--outline btn--sm"}
      onClick={() => play(track)}
      aria-pressed={isCurrent && isPlaying}
      aria-label={`${isCurrent && isPlaying ? "Pause" : "Play"} ${track.title} in mini-player`}
    >
      {isCurrent && isPlaying ? "❚❚" : "▸"} {label}
    </button>
  );
}
