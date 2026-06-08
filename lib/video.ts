// Video helpers: third-party embed URL parsing (now) + a self-hosted HLS
// provider abstraction (scaffolded for later). The VideoPlayer component already
// plays HLS, so enabling self-hosting later is just feeding it a .m3u8 URL.

export type VideoProvider = "youtube" | "rumble" | "vimeo" | "x" | "file" | "hls" | "unknown";

export function detectProvider(url: string): VideoProvider {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
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
    const id =
      url.match(/[?&]v=([^&]+)/)?.[1] ||
      url.match(/youtu\.be\/([^?]+)/)?.[1] ||
      url.match(/embed\/([^?]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
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
