import type { StageItem } from "@/app/_components/LiveStage";

/**
 * "Recent 5" database of past live streams / replays for investor demo.
 * Populated from known Colony Report, Patriot Hour, OK Underground and related
 * live broadcasts (titles and schedule patterns from the platform).
 * 
 * For real investor demos, replace the `src` values with actual recent full
 * episode VOD URLs (YouTube, Rumble, or self-hosted HLS/Mux) from your archive.
 * The LiveStage player already supports YouTube/Rumble embeds and direct video.
 *
 * Use the "Investor Demo: Recent 5" button on the /live page to load these into
 * the main player queue and play them sequentially on "live tv".
 */
export const RECENT_LIVE_STREAMS: StageItem[] = [
  {
    id: "recent-1",
    title: "The Colony Report — Live with Jake Merrick (Governor's Race)",
    kind: "embed",
    src: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    isLive: false,
    when: "REPLAY · MAY 28, 2026",
    locked: false,
  },
  {
    id: "recent-2",
    title: "Patriot Hour — Live Q&A with Marcus Webb",
    kind: "embed",
    src: "https://www.youtube.com/watch?v=yEjlzfS4k1s",
    isLive: false,
    when: "REPLAY · MAY 26, 2026",
    locked: false,
  },
  {
    id: "recent-3",
    title: "OK Underground — Field Report: Lobbyist Network",
    kind: "embed",
    src: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    isLive: false,
    when: "REPLAY · MAY 23, 2026",
    locked: true,
    tierLabel: "Members",
  },
  {
    id: "recent-4",
    title: "The Colony Report — Live with Jake Merrick (Budget Crisis Special)",
    kind: "embed",
    src: "https://www.youtube.com/watch?v=yEjlzfS4k1s",
    isLive: false,
    when: "REPLAY · MAY 21, 2026",
    locked: false,
  },
  {
    id: "recent-5",
    title: "Faith & Freedom — Live Town Hall",
    kind: "embed",
    src: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    isLive: false,
    when: "REPLAY · MAY 19, 2026",
    locked: false,
  },
];

export default RECENT_LIVE_STREAMS;
