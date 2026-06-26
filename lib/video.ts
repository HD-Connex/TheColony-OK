// Video helpers: third-party embed URL parsing (now) + a self-hosted HLS
// provider abstraction (scaffolded for later). The VideoPlayer component already
// plays HLS, so enabling self-hosting later is just feeding it a .m3u8 URL.

/** Jake Merrick YouTube — placeholder until Mux 247 ingest is wired.
 * NOW THE PERMANENT PRIMARY DEMO/24/7 FALLBACK for live TV player:
 * lib/live-247.ts resolve247StreamUrl() + COLONY_247 default to this (or NEXT_PUBLIC_247_YOUTUBE_URL override).
 * When used as 247 streamUrl, LiveStage detects isEmbed (YT) and renders via VideoEmbed bare.
 * /streams and @handle URLs resolve here to embed of the placeholder video ID for continuous demo playback.
 */
export const JAKE_MERRICK_CHANNEL_URL = "https://www.youtube.com/@jakemerrick212";
export const JAKE_MERRICK_CHANNEL_ID =
  process.env.NEXT_PUBLIC_YT_COLONY_CHANNEL_ID ?? "UCExrnzUQGrVZmO4WW9XJ-bA";
/** Latest VOD from the /streams tab (override via env when it changes). */
export const JAKE_MERRICK_PLACEHOLDER_VIDEO_ID =
  process.env.NEXT_PUBLIC_YT_PLACEHOLDER_VIDEO_ID ?? "jfKfPfyJRdk"; // continuous public demo stream ID (reliable for 24/7 YT fallback)

const YT_HANDLE_CHANNELS: Record<string, string> = {
  jakemerrick212: JAKE_MERRICK_CHANNEL_ID,
};

export type VideoProvider = "youtube" | "rumble" | "vimeo" | "x" | "file" | "hls" | "unknown";

function youtubeLiveEmbed(channelId: string): string {
  const params = new URLSearchParams({
    channel: channelId,
    autoplay: "1",
    mute: "1",
    rel: "0",
    modestbranding: "1",
    // playsinline=1: keep playback inline on iOS Safari instead of forcing native
    // fullscreen the moment the stream starts. Critical for the mobile live path.
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/live_stream?${params}`;
}

function resolveYoutubeChannelId(url: string): string | null {
  const channelPath = url.match(/youtube\.com\/channel\/(UC[\w-]+)/i)?.[1];
  if (channelPath) return channelPath;

  const handle = url.match(/youtube\.com\/@([^/?#]+)/i)?.[1];
  if (handle && YT_HANDLE_CHANNELS[handle]) return YT_HANDLE_CHANNELS[handle];

  return process.env.NEXT_PUBLIC_YT_COLONY_CHANNEL_ID ?? JAKE_MERRICK_CHANNEL_ID;
}

export function detectProvider(url: string): VideoProvider {
  if (/youtube\.com|youtu\.be|youtube-nocookie\.com/.test(url)) return "youtube";
  if (/rumble\.com/.test(url)) return "rumble";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/(twitter\.com|x\.com)/.test(url)) return "x";
  if (/\.m3u8(\?|$)/.test(url)) return "hls";
  if (/\.(mp4|webm|mov)(\?|$)/.test(url)) return "file";
  return "unknown";
}

/** Returns an iframe `src` for embeddable providers, or null if not embeddable. */
export function toEmbedSrc(url: string): string | null {
  const p = detectProvider(url);
  if (p === "youtube") {
    if (/youtube-nocookie\.com\/embed\//.test(url)) {
      return url;
    }

    const watchId = url.match(/[?&]v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?]+)/)?.[1];
    if (watchId) {
      const params = new URLSearchParams({ autoplay: "1", mute: "1", rel: "0", modestbranding: "1", playsinline: "1" });
      return `https://www.youtube-nocookie.com/embed/${watchId}?${params}`;
    }

    const embedId = url.match(/embed\/([^?]+)/)?.[1];
    if (embedId && embedId !== "live_stream") {
      const params = new URLSearchParams({ autoplay: "1", mute: "1", rel: "0", modestbranding: "1", playsinline: "1" });
      return `https://www.youtube-nocookie.com/embed/${embedId}?${params}`;
    }

    if (/\/live(?:\?|$|\/)/.test(url) || /\/channel\/UC[\w-]+\/live/.test(url)) {
      const channelId = resolveYoutubeChannelId(url);
      return channelId ? youtubeLiveEmbed(channelId) : null;
    }

    if (/\/streams(?:\?|$|\/)/.test(url)) {
      const videoId = JAKE_MERRICK_PLACEHOLDER_VIDEO_ID;
      const params = new URLSearchParams({ autoplay: "1", mute: "1", rel: "0", modestbranding: "1", playsinline: "1" });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    }

    if (/youtube\.com\/@[^/?#]+(?:\/|$)/.test(url)) {
      const channelId = resolveYoutubeChannelId(url);
      return channelId ? youtubeLiveEmbed(channelId) : null;
    }

    if (/youtube\.com\/channel\/UC[\w-]+/.test(url)) {
      const channelId = resolveYoutubeChannelId(url);
      return channelId ? youtubeLiveEmbed(channelId) : null;
    }

    return null;
  }
  if (p === "vimeo") {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (p === "rumble") {
    // Rumble embed urls look like https://rumble.com/embed/<id>/ — pass through if already embed form.
    return /rumble\.com\/embed\//.test(url) ? url : null;
  }
  return null;
}

// ─── Self-hosted HLS provider (scaffold — not wired) ───
// Set VIDEO_PROVIDER + provider creds in env to enable later. The app can then
// store an asset id on a row and resolve a playback URL here.
export type SelfHostProvider = "mux" | "bunny" | "cloudflare";

export function selfHostPlaybackUrl(assetId: string): string | null {
  const provider = process.env.VIDEO_PROVIDER as SelfHostProvider | undefined;
  if (!provider || !assetId) return null;
  switch (provider) {
    case "mux":
      return `https://stream.mux.com/${assetId}.m3u8`;
    case "bunny": {
      const host = process.env.BUNNY_STREAM_HOST; // e.g. vz-xxxx.b-cdn.net
      return host ? `https://${host}/${assetId}/playlist.m3u8` : null;
    }
    case "cloudflare": {
      const code = process.env.CLOUDFLARE_STREAM_CODE;
      return code ? `https://customer-${code}.cloudflarestream.com/${assetId}/manifest/video.m3u8` : null;
    }
    default:
      return null;
  }
}
