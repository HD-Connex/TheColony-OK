#!/usr/bin/env node
/**
 * Dissolve TheColony into thecolony-app after schema consolidation.
 *
 * Documents what was migrated from D:\1Projects\TheColony and optionally
 * renames that repo to D:\1Projects\_archived_TheColony.
 *
 * Usage:
 *   node scripts/dissolve-thecolony.mjs           # report only (dry-run)
 *   node scripts/dissolve-thecolony.mjs --execute # rename TheColony → _archived_TheColony
 */

import { renameSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(__dirname, "..");
const SOURCE = resolve(APP_ROOT, "..", "TheColony");
const ARCHIVE = resolve(APP_ROOT, "..", "_archived_TheColony");

const MIGRATED = {
  source: {
    schema: "D:/1Projects/TheColony/src/db/schema.ts",
    migration: "D:/1Projects/TheColony/src/db/migrations/0000_init.sql",
    seed: "D:/1Projects/TheColony/src/db/seed.ts",
    stripeWebhook: "D:/1Projects/TheColony/src/app/api/webhooks/stripe/route.ts",
  },
  targetMigrations: [
    {
      file: "supabase/migrations/0006_members_stripe.sql",
      tables: ["members"],
      fromTheColony: ["users.stripe_customer_id", "subscriptions (stripe_*, status, tier)"],
      notes:
        "Adapted for Supabase auth.users; lib/auth-client.ts reads is_member + status.",
    },
    {
      file: "supabase/migrations/0007_video_catalog.sql",
      tables: ["series", "video_episodes"],
      fromTheColony: ["series", "episodes (video fields)"],
      notes:
        "Video catalog only; podcast RSS stays in existing episodes/shows tables.",
    },
    {
      file: "supabase/migrations/0008_watch_progress.sql",
      tables: ["watch_progress"],
      fromTheColony: ["watch_progress"],
      notes:
        "Continue-watching; episode_id references video_episodes or podcast episodes.",
    },
    {
      file: "supabase/migrations/0009_articles_stub.sql",
      tables: ["articles"],
      fromTheColony: [],
      notes: "New stub for lib/articles.ts; TheColony had no articles table.",
    },
  ],
  alreadyInApp: [
    "supabase/migrations/0001_live_events.sql — live_events (simplified vs TheColony)",
    "supabase/migrations/0003_episode_data_refinements.sql — podcast episodes video fields",
    "supabase/migrations/0004_realtime_chat_polls.sql — live chat/polls",
    "scripts/seed-thecolony.ts — reference seed ported from TheColony",
  ],
  notMigrated: [
    "users (Clerk) — replaced by Supabase auth.users + members",
    "subscriptions — folded into members stripe fields",
    "people — thecolony-app uses contributors table",
    "transcripts, content_embeddings (pgvector), watchlist, downloads",
    "Drizzle ORM layer — thecolony-app uses Supabase client + SQL migrations",
    "Clerk auth, Mux webhooks, Stripe checkout actions — wire separately in thecolony-app",
  ],
};

function printReport() {
  console.log("═".repeat(72));
  console.log("TheColony → thecolony-app consolidation report");
  console.log("═".repeat(72));
  console.log();
  console.log("Source repo:", SOURCE);
  console.log("Target app: ", APP_ROOT);
  console.log();
  console.log("── New migrations ──");
  for (const m of MIGRATED.targetMigrations) {
    console.log(`  ${m.file}`);
    console.log(`    Tables: ${m.tables.join(", ")}`);
    if (m.fromTheColony.length) {
      console.log(`    From TheColony: ${m.fromTheColony.join(", ")}`);
    }
    console.log(`    ${m.notes}`);
    console.log();
  }
  console.log("── Already present in thecolony-app ──");
  for (const line of MIGRATED.alreadyInApp) {
    console.log(`  • ${line}`);
  }
  console.log();
  console.log("── Intentionally not migrated ──");
  for (const line of MIGRATED.notMigrated) {
    console.log(`  • ${line}`);
  }
  console.log();
}

function archiveTheColony() {
  if (!existsSync(SOURCE)) {
    console.error(`Source not found: ${SOURCE}`);
    console.error("Nothing to archive.");
    process.exit(1);
  }
  if (existsSync(ARCHIVE)) {
    console.error(`Archive path already exists: ${ARCHIVE}`);
    console.error("Rename or remove it before running --execute.");
    process.exit(1);
  }
  renameSync(SOURCE, ARCHIVE);
  console.log(`Renamed:\n  ${SOURCE}\n  → ${ARCHIVE}`);
}

const execute = process.argv.includes("--execute");

printReport();

if (execute) {
  console.log("── Archiving TheColony ──");
  archiveTheColony();
  console.log("Done.");
} else {
  console.log("Dry-run only. Pass --execute to rename TheColony → _archived_TheColony.");
}