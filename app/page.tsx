import Link from "next/link";
import JsonLd from "./_components/JsonLd";
import Countdown from "./_components/Countdown";
import StoryCard from "./_components/StoryCard";
import LiveStage, { type StageItem } from "./_components/LiveStage";
import { getArticles, getTierArticles, type Article } from "@/lib/articles";
import { getShowsWithEpisodeCounts } from "@/lib/podcasts";
import { getLiveEvents, playbackFor, tierLocked, tierLabel, type LiveEvent } from "@/lib/live-events";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

const SITE_URL = "https://thecolonyok.com";

export default async function HomePage() {
  const [latest, headliners, podcast, live] = await Promise.all([
    getArticles({ limit: 8 }),
    getTierArticles("headliner", 3),
    getShowsWithEpisodeCounts(4),
    getLiveEvents(),
  ]);

  const hero = latest[0] ?? null;
  const topLead = latest[1] ?? latest[0] ?? null;
  const topSecondary = latest.slice(topLead === latest[0] ? 1 : 2, topLead === latest[0] ? 4 : 5);
  const newsItems = latest.slice(5, 8);
  const ticker = latest.slice(0, 6);

  const nextLive: LiveEvent | undefined = live.live[0] ?? live.upcoming[0];
  const schedule = [...live.live, ...live.upcoming].slice(0, 3);

  // Build StageItems for playable LiveStage embed on home (reuse same mapping as /live).
  function whenLabel(e: LiveEvent): string {
    const iso = e.status === "ended" ? e.ended_at ?? e.scheduled_start : e.scheduled_start;
    if (!iso) return e.status === "live" ? "LIVE NOW" : "";
    const d = new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).toUpperCase();
    return e.status === "live" ? `LIVE NOW · ${d}` : e.status === "ended" ? `REPLAY · ${d}` : d;
  }
  const liveItems: StageItem[] = [...live.live, ...live.replays].map((e) => {
    const pb = playbackFor(e);
    return {
      id: e.id,
      title: e.title,
      kind: pb.kind,
      src: pb.src,
      isLive: e.status === "live",
      when: whenLabel(e),
      locked: tierLocked(e.tier_required),
      tierLabel: tierLabel(e.tier_required),
    };
  });

  // ... (rest of homepage content for news/podcasts/spotlight would be here in full; stubbed for core live/video test focus)
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", "name": "The Colony OK" }} />
      <main>
        <div className="container">
          {/* Hero / ticker / news sections (minimal for test) */}
          <section>
            <h1>The Colony OK</h1>
            <p>Independent Oklahoma press — video, live, podcasts with realtime.</p>
          </section>

          {/* Live embed on home for testing 24/7 + framer + realtime */}
          {liveItems.length > 0 && (
            <section className="home-live">
              <h2>Live Now / 24/7</h2>
              <LiveStage items={liveItems} />
            </section>
          )}

          {/* Podcast preview for per-ep video test */}
          <section>
            <h2>Podcasts</h2>
            <p>Visit /podcasts/colony-report (after seed) for video toggle + viz + chapters + PiP.</p>
            <Link href="/podcasts">All Podcasts →</Link>
          </section>

          {/* Images spotlight note in rail (per-ep or contrib) */}
        </div>
      </main>
    </>
  );
}
