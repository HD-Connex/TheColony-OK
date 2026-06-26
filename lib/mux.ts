import "server-only";
import Mux from "@mux/mux-node";

/**
 * Mux video infrastructure.
 *  - Public playback IDs => free previews, instant HLS.
 *  - Signed playback IDs => members-only; we mint short-lived JWTs
 *    server-side so paid content URLs can't be shared/scraped.
 */
let _mux: Mux | null = null;

export function mux(): Mux {
  if (_mux) return _mux;
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error("Mux credentials missing. See .env.example.");
  }
  _mux = new Mux({ tokenId, tokenSecret });
  return _mux;
}

/** Mint a signed playback token for members-only assets. */
export async function signPlaybackToken(playbackId: string, expiresIn = "2h") {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keySecret = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keySecret) {
    throw new Error("Mux signing key missing. Required for members-only playback.");
  }
  const token = await mux().jwt.signPlaybackId(playbackId, {
    keyId,
    keySecret,
    expiration: expiresIn,
    type: "video",
  });
  return token;
}

/** Build a poster/thumbnail URL from a Mux playback id. */
export function muxThumbnail(playbackId: string, opts: { time?: number; width?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.time != null) params.set("time", String(opts.time));
  if (opts.width != null) params.set("width", String(opts.width));
  const q = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.webp${q ? `?${q}` : ""}`;
}

/** Create a Mux live stream (for the Live page broadcasts).
 * Returns the full object containing id, stream_key (RTMP ingest), playback_ids, etc.
 * Store mux_live_stream_id + stream_key (admin only) + mux_playback_id on live_events.
 */
export async function createLiveStream() {
  return mux().video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: { playback_policy: ["public"] },
    reconnect_window: 60,
    latency_mode: "low",
    // Auto record for VOD on end is controlled in webhook + Mux dashboard settings for the live.
  });
}

/** Fetch a live stream by Mux id (for status polling or admin). */
export async function getLiveStream(liveStreamId: string) {
  return mux().video.liveStreams.retrieve(liveStreamId);
}

/** Enable generated subtitles/captions on a Mux asset (for auto-transcripts on VOD/live recordings). */
export async function enableGeneratedSubtitles(assetId: string, language = "en") {
  try {
    // Mux SDK v14: createTrack on the asset to trigger auto-generated subtitles
    await (mux().video as any).assets.createTrack(assetId, {
      language_code: language,
      type: "text",
      text_type: "subtitles",
      closed_captions: false,
    });
  } catch (e) {
    // Non-fatal — captions are nice-to-have
    console.warn("[mux] generated_subtitles enable failed (may already be on or not supported)", e);
  }
}

/**
 * Phase 3: Attach simulcast targets to a live stream (YouTube, Rumble, X, FB via their RTMP keys).
 * Call from admin "Go Live + simulcast" with array of {url, stream_key} from the external platforms.
 * Paywalled full show stays native; free simulcast funnels viewers to clips/membership.
 */
export async function addSimulcastTargets(liveStreamId: string, targets: Array<{ url: string; stream_key: string }>) {
  for (const t of targets) {
    try {
      await (mux().video as any).liveStreams.createSimulcastTarget(liveStreamId, {
        url: t.url,
        stream_key: t.stream_key,
      });
    } catch (e) {
      console.warn("[mux] simulcast target failed", e);
    }
  }
}