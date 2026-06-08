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

/** Create a Mux live stream (for the Live page broadcasts). */
export async function createLiveStream() {
  return mux().video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: { playback_policy: ["public"] },
    reconnect_window: 60,
    latency_mode: "low",
  });
}