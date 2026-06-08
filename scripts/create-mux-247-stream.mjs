#!/usr/bin/env node
/** Create a Mux live stream for Colony 24/7 fallback. */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Mux from "@mux/mux-node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const stream = await mux.video.liveStreams.create({
  playback_policy: ["public"],
  new_asset_settings: { playback_policy: ["public"] },
  reconnect_window: 60,
  latency_mode: "low",
  passthrough: "colony-247",
});

const playbackId = stream.playback_ids?.[0]?.id;
console.log("Live stream created:");
console.log("  stream_id:", stream.id);
console.log("  status:", stream.status);
console.log("  rtmp:", stream.stream_key ? "(see Mux dashboard for ingest URL + stream key)" : "—");
if (playbackId) {
  console.log("  playback_id:", playbackId);
  console.log("\nAdd to .env.local and Vercel:");
  console.log(`  NEXT_PUBLIC_MUX_247_PLAYBACK_ID=${playbackId}`);
  console.log(`  HLS: https://stream.mux.com/${playbackId}.m3u8`);
}