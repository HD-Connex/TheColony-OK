/**
 * Reference seed script ported from TheColony (src/db/seed.ts).
 *
 * TheColony uses Drizzle ORM with a `people`, `series`, and `episodes` schema.
 * thecolony-app uses Supabase; adapt table/column names to your migrations
 * (see docs/phase7/seed-content.sql for SQL examples).
 *
 * Run (after wiring Drizzle or a Supabase client):
 *   npx tsx scripts/seed-thecolony.ts
 *
 * Mux playback ids below are illustrative. Replace with real assets,
 * or upload via Mux and let the webhook backfill mux_playback_id.
 */

// Example Drizzle imports — uncomment when db layer is ported:
// import { db } from "@/db";
// import { episodes, people, series } from "@/db/schema";

async function main() {
  console.log("🐝 Seeding The Colony…");

  // const [jake] = await db
  //   .insert(people)
  //   .values({
  //     slug: "jake-merrick",
  //     name: "Jake Merrick",
  //     role: "Founder & Host",
  //     bio: "Oklahoma businessman, veteran, and founder of The Colony OK.",
  //   })
  //   .onConflictDoNothing()
  //   .returning();

  const seriesSeed = [
    {
      slug: "the-colony-report",
      title: "The Colony Report",
      tagline: "Oklahoma's daily dose of unfiltered truth.",
      description:
        "The flagship daily news show — Oklahoma politics, culture, and the stories the legacy press ignores.",
      type: "podcast",
      status: "published",
      pillar: "truth",
      isOklahoma: true,
      tierRequired: "free",
      accentColor: "#f0b429",
      sortWeight: 100,
      spotifyUrl: "https://open.spotify.com",
      appleUrl: "https://podcasts.apple.com",
    },
    {
      slug: "faith-and-freedom",
      title: "Faith & Freedom",
      tagline: "Where Scripture meets the public square.",
      description:
        "A weekly exploration of the biblical foundations of liberty.",
      type: "podcast",
      status: "published",
      pillar: "faith",
      isOklahoma: true,
      tierRequired: "free",
      accentColor: "#d4a017",
      sortWeight: 90,
    },
    {
      slug: "the-patriot-hour",
      title: "The Patriot Hour",
      tagline: "One hour. Zero spin.",
      description:
        "National news and commentary from a pro-America, pro-liberty lens.",
      type: "show",
      status: "published",
      pillar: "freedom",
      isOklahoma: false,
      tierRequired: "settler",
      accentColor: "#c0392b",
      sortWeight: 80,
    },
    {
      slug: "frontier-investigations",
      title: "Frontier Investigations",
      tagline: "Following the story wherever it leads.",
      description:
        "Long-form investigative documentaries on corruption and courage.",
      type: "documentary",
      status: "published",
      pillar: "truth",
      isOklahoma: false,
      tierRequired: "patriot",
      accentColor: "#8e6f3a",
      sortWeight: 70,
    },
  ];

  const episodeSeed = [
    {
      seriesSlug: "the-colony-report",
      slug: "ep-101-the-truth-about-the-capitol",
      title: "Ep. 101 — The Truth About the Capitol",
      description: "What really happened this week under the dome in OKC.",
      seasonNumber: 1,
      episodeNumber: 101,
      status: "published",
      tierRequired: "free",
      muxPlaybackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe",
      muxPlaybackPolicy: "public",
      durationSeconds: 2940,
      badges: ["bonus"],
    },
    {
      seriesSlug: "the-colony-report",
      slug: "ep-102-members-only-deep-dive",
      title: "Ep. 102 — Members Deep Dive",
      description: "The extended cut, members only.",
      seasonNumber: 1,
      episodeNumber: 102,
      status: "published",
      tierRequired: "settler",
      muxPlaybackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe",
      muxPlaybackPolicy: "public",
      durationSeconds: 3600,
      badges: ["members-only"],
    },
  ];

  console.log(
    `Reference data: ${seriesSeed.length} series, ${episodeSeed.length} episodes.`
  );
  console.log(
    "Wire this script to Supabase or Drizzle before running in production."
  );
  console.log("See docs/phase7/seed-content.sql for SQL-based seeding.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});