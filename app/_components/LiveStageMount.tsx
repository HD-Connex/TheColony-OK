"use client";

import LiveStage, { type StageItem } from "./LiveStage";

interface Props {
  items: StageItem[];
  /** null = 24/7 loop; undefined = auto-pick first live event */
  initialActiveId?: string | null;
  prefer247?: boolean;
  /** For teaser usage on home: hides redundant queue (sidebar provides schedule) to prevent layout overflow/overlap with following sections like Latest Dispatches */
  compact?: boolean;
  /** hideInteractivity: pages with custom sidebar (e.g. /live) render chat/poll outside the stage to keep player box clean */
  hideInteractivity?: boolean;
}

export default function LiveStageMount({ items, initialActiveId, prefer247, compact, hideInteractivity }: Props) {
  const liveItem = items.find((i) => i.isLive);
  let activeId: string | null;

  if (prefer247) {
    activeId = null;
  } else if (initialActiveId !== undefined) {
    activeId = initialActiveId;
  } else if (liveItem) {
    activeId = liveItem.id;
  } else {
    activeId = null;
  }

  return <LiveStage items={items} initialActiveId={activeId} compact={compact} hideInteractivity={hideInteractivity} />;
}