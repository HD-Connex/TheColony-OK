import type { Metadata } from "next";
import Breadcrumbs from "../_components/Breadcrumbs";
import PageHeader from "../_components/PageHeader";
import JsonLd from "../_components/JsonLd";
import Countdown from "../_components/Countdown";
import LiveStage, { type StageItem } from "../_components/LiveStage";
import { getLiveEvents, eventsToStageItems, tierLocked, tierLabel, type LiveEvent } from "@/lib/live-events";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Watch Live",
  description: "Live broadcasts and replays from The Colony — Oklahoma news, live events, and the full archive. Streamed free and members-only.",
  alternates: { canonical: "/live" },
};

function whenLabel(e: LiveEvent): string {
  const iso = e.status === "ended" ? e.ended_at ?? e.scheduled_start : e.scheduled_start;
  if (!iso) return e.status === "live" ? "LIVE NOW" : "";
  const d = new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).toUpperCase();
  return e.status === "live" ? `LIVE NOW · ${d}` : e.status === "ended" ? `REPLAY · ${d}` : d;
}

export default async function LivePage() {
  const { live, upcoming, replays } = await getLiveEvents();

  const items: StageItem[] = eventsToStageItems([...live, ...replays], whenLabel);

  const nextUp = upcoming[0];

  return (
    <>
      {live[0] && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "BroadcastEvent",
          name: live[0].title,
          description: live[0].description ?? undefined,
          startDate: live[0].actual_start ?? live[0].scheduled_start ?? undefined,
          isLiveBroadcast: true,
          publisher: { "@id": "https://thecolonyok.com/#organization" },
        }} />
      )}

      <main id="main">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Watch Live" }]} />
          <PageHeader
            eyebrow="▼ SECTION N°03 · ON AIR"
            title="Watch Live"
            lede="Live broadcasts and the full replay archive. Tune in free, or join for members-only events. We mirror the stream across YouTube, Rumble, and Locals."
          />

          <LiveStage items={items} initialActiveId={live[0]?.id ?? null} />

          {items.length === 0 && (
            <section className="live-section" style={{ marginBottom: "var(--space-12)" }}>
              <div className="live-player">
                <div className="live-player__offline">
                  <div className="live-player__offline-icon">
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20" fill="currentColor" /></svg>
                  </div>
                  <span className="live-player__status">▼ OFF AIR · CHECK THE SCHEDULE</span>
                </div>
              </div>
              <div className="live-sidebar">
                <div className="live-status"><span className="badge badge--new">NEXT UP</span></div>
                <h2 className="live-status__title">{nextUp?.title ?? "Schedule coming soon"}</h2>
                {nextUp?.description && <p className="live-status__description">{nextUp.description}</p>}
                {nextUp?.scheduled_start && <Countdown target={nextUp.scheduled_start} label="▼ COUNTDOWN" />}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="section" aria-label="Upcoming broadcasts">
              <header className="section-header">
                <span className="section-header__number">N°01</span>
                <div className="section-header__group">
                  <h2 className="section-title">Upcoming</h2>
                  <span className="section-header__dateline">{upcoming.length} SCHEDULED</span>
                </div>
              </header>
              <div className="grid-4">
                {upcoming.map((e) => (
                  <div className="schedule-tile" key={e.id}>
                    <div className="schedule-tile__day">{whenLabel(e)}</div>
                    <h3 className="schedule-tile__title">{e.title}</h3>
                    {tierLocked(e.tier_required) && <span className="badge badge--members">{tierLabel(e.tier_required)}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
