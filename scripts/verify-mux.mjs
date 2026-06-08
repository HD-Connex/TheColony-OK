#!/usr/bin/env node
/**
 * Verify MUX_TOKEN_ID / MUX_TOKEN_SECRET and list live streams + recent assets.
 * Usage: node scripts/verify-mux.mjs
 * Loads .env.local (simple parse, no dotenv dep).
 */
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

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

if (!tokenId || !tokenSecret) {
  console.error("Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in .env.local");
  process.exit(1);
}

const mux = new Mux({ tokenId, tokenSecret });

try {
  const [liveList, assetList] = await Promise.all([
    mux.video.liveStreams.list({ limit: 5 }),
    mux.video.assets.list({ limit: 5 }),
  ]);

  console.log("Mux API: OK");
  console.log("\nLive streams (for 24/7 / scheduled live):");
  if (!liveList.data?.length) {
    console.log("  (none yet — create one in Mux dashboard → Live Streams)");
  } else {
    for (const s of liveList.data) {
      const pb = s.playback_ids?.[0]?.id ?? "—";
      console.log(`  - ${s.id}  status=${s.status}  playback_id=${pb}`);
    }
  }

  console.log("\nRecent assets (VOD):");
  if (!assetList.data?.length) {
    console.log("  (none yet — upload a video in Mux dashboard)");
  } else {
    for (const a of assetList.data) {
      const pb = a.playback_ids?.[0]?.id ?? "—";
      console.log(`  - ${a.id}  status=${a.status}  playback_id=${pb}`);
    }
  }

  const firstLivePb = liveList.data?.[0]?.playback_ids?.[0]?.id;
  if (firstLivePb) {
    console.log(`\nSuggested env for 24/7:\n  NEXT_PUBLIC_MUX_247_PLAYBACK_ID=${firstLivePb}`);
  }
} catch (err) {
  console.error("Mux API failed:", err.message ?? err);
  process.exit(1);
}