import type { StageItem } from "@/app/_components/LiveStage";

/**
 * Recent Streams data for the live hub archive queue / replays.
 * Populated from known Colony Report, Patriot Hour, OK Underground and related
 * live broadcasts (titles and schedule patterns from the platform / seeded data).
 * 
 * Replace the `src` values with actual recent full episode VOD URLs (YouTube, Rumble, or self-hosted HLS/Mux) from archive.
 * The LiveStage player supports YouTube/Rumble embeds and direct video.
 *
 * "Recent Streams" section / data for /live (cleaned of dev/demo labels per P4).
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
