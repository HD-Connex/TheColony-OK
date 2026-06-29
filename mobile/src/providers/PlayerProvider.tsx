import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { QueueItem } from "@/types";

interface PlayerContextValue {
  /** The currently loaded item in the global player */
  currentItem: QueueItem | null;
  /** Whether the global player is active (showing at bottom of screen) */
  isActive: boolean;
  /** Load a program into the global player */
  play: (item: QueueItem) => void;
  /** Close the global player */
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * PlayerProvider — Global player context for persistent mini-player.
 *
 * Analogous to web's PlayerProvider (app/_components/PlayerProvider.tsx).
 * Allows any screen to hand off playback to the global 24/7 player instance.
 * Currently a minimal implementation; extend for background audio, PiP, etc.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null);
  const [isActive, setIsActive] = useState(false);

  const play = useCallback((item: QueueItem) => {
    setCurrentItem(item);
    setIsActive(true);
  }, []);

  const close = useCallback(() => {
    setCurrentItem(null);
    setIsActive(false);
  }, []);

  return (
    <PlayerContext.Provider value={{ currentItem, isActive, play, close }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayerContext must be used within PlayerProvider");
  }
  return ctx;
}
