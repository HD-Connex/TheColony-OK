"use client";

import React, { useEffect, useRef, useState } from "react";

interface ReelItem {
  id: string;
  title: string;
  src?: string | null;
}

interface YouTubeDemoReelProps {
  items: ReelItem[];
  onExit?: () => void;
}

/**
 * YouTubeDemoReel
 * Renders a continuous, autoplaying, auto-advancing reel of YouTube videos
 * using the official IFrame Player API.
 *
 * - Starts immediately on mount (the parent demo button click satisfies user gesture requirements).
 * - Autoplays with minimal/no player chrome (controls:0, no keyboard, no related, etc.).
 * - On video end, automatically loads + plays the next in the list (cycles forever).
 * - Looks and behaves like a "live stream" feed for investor/demo purposes.
 * - No play/pause/skip UI exposed in the player itself.
 *
 * NOTE: This is the *archive reel* (multi-item from queue). The primary live TV 24/7 player
 * (is247) ALWAYS runs the Jake Merrick YouTube stream directly (lib/live-247.ts default to
 * JAKE_MERRICK_CHANNEL_URL or NEXT_PUBLIC_247_YOUTUBE_URL -> LiveStage isEmbed -> VideoEmbed).
 * No changes needed here for the "run the youtube stream" 24/7 behavior.
 */
export default function YouTubeDemoReel({ items, onExit }: YouTubeDemoReelProps) {
  const playerRef = useRef<any>(null);
  const containerId = "yt-demo-reel-player";
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Extract clean YouTube video IDs from the src (watch?v= or youtu.be/)
  const videoIds = React.useMemo(() => {
    return items
      .map((item) => {
        const url = item.src || "";
        // watch?v= or youtu.be/
        const watchMatch = url.match(/[?&]v=([^&]+)/);
        if (watchMatch) return watchMatch[1];
        const shortMatch = url.match(/youtu\.be\/([^?&#/]+)/);
        if (shortMatch) return shortMatch[1];
        return null;
      })
      .filter((id): id is string => !!id);
  }, [items]);

  const titles = React.useMemo(() => items.map((i) => i.title), [items]);

  useEffect(() => {
    if (videoIds.length === 0) return;

    let player: any = null;
    let destroyed = false;

    const createPlayer = () => {
      if (destroyed) return;

      // Clean previous if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      const YT = (window as any).YT;
      if (!YT || !YT.Player) {
        // API not ready yet — will be called again via global callback
        return;
      }

      playerRef.current = new YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoIds[0],
        playerVars: {
          autoplay: 1,
          controls: 0,            // no playbar / buttons
          disablekb: 1,           // no keyboard shortcuts
          fs: 0,                  // no fullscreen button
          iv_load_policy: 3,      // no annotations
          modestbranding: 1,      // minimal YT branding
          rel: 0,                 // no related videos at end
          mute: 0,                // try with sound (gesture from activation button helps)
          // loop is handled manually for multi-video sequence
        },
        events: {
          onReady: (event: any) => {
            // Start playing right away
            try {
              event.target.playVideo();
            } catch (e) {
              // ignore
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED === 0
            if (event.data === YT.PlayerState.ENDED) {
              // Advance to next (cycle)
              const next = (currentIndexRef.current + 1) % videoIds.length;
              currentIndexRef.current = next;
              setCurrentIndex(next);

              const nextId = videoIds[next];
              if (nextId && playerRef.current) {
                try {
                  playerRef.current.loadVideoById(nextId);
                  setTimeout(() => {
                    if (playerRef.current && !destroyed) {
                      try {
                        playerRef.current.playVideo();
                      } catch {}
                    }
                  }, 250);
                } catch {}
              }
            }
          },
          onError: (e: any) => {
            // On error (e.g. video unavailable), skip to next
            console.warn("[YouTubeDemoReel] YT error, advancing...", e);
            currentIndexRef.current = (currentIndexRef.current + 1) % videoIds.length;
            const nextId = videoIds[currentIndexRef.current];
            if (nextId && playerRef.current) {
              try {
                playerRef.current.loadVideoById(nextId);
              } catch {}
            }
          },
        },
      });

      player = playerRef.current;
    };

    // Load the YT IFrame API if not already present
    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }

    // Global callback that YT calls when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      createPlayer();
    };

    // If the API is already loaded (e.g. previous demo), create immediately
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    }

    // Cleanup
    return () => {
      destroyed = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
      // Do not delete the global onYouTubeIframeAPIReady — other potential uses or future loads
    };
  }, [videoIds]); // re-init if the list of IDs changes

  if (videoIds.length === 0) {
    return (
      <div className="live-player__offline">
        <p>No demo videos configured.</p>
      </div>
    );
  }

  return (
    <div className="live-player reel-container">
      {/* The YT player mounts here */}
      <div id={containerId} className="reel-player-frame" />

      {/* Subtle "as-live" overlay — archive continuity indicator (purged investor/demo labels) */}
      <div className="reel-overlay-top">
        ARCHIVE REEL • THE COLONY OK
      </div>

      {/* Current title overlay (shows which archived broadcast is "on air" right now) */}
      <div className="reel-overlay-bottom">
        {titles[currentIndex] || "Archived Broadcast"}
      </div>

      {/* Exit control — functional for demo-reel mode only */}
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="reel-exit"
          title="Exit the archive reel and return to normal schedule"
        >
          EXIT REEL
        </button>
      )}

      {/* Small progress hint (no AUTO pollution) */}
      <div className="reel-progress">
        {currentIndex + 1} / {videoIds.length}
      </div>
    </div>
  );
}
