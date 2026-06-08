import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";

export const metadata: Metadata = {
  title: "The Colony vs BlazeTV",
  description:
    "Compare The Colony OK and BlazeTV: pricing, privacy, Oklahoma roots, and independent conservative media without corporate gatekeepers.",
};

const COMPARISON = [
  {
    label: "Starting price",
    colony: "$4.99/mo (Settler founding tier)",
    blaze: "$9.99/mo+",
  },
  {
    label: "Ads & tracking",
    colony: "Ad-free, no behavioral tracking",
    blaze: "Ad-supported tiers; premium for ad-free",
  },
  {
    label: "Data privacy",
    colony: "Private by design — we don't sell your data",
    blaze: "Corporate-owned platform policies",
  },
  {
    label: "Editorial focus",
    colony: "Oklahoma-rooted, community-first journalism",
    blaze: "National cable-style commentary network",
  },
  {
    label: "Live & podcasts",
    colony: "Live broadcasts, podcasts, and on-demand library",
    blaze: "Shows and live events on BlazeTV platform",
  },
  {
    label: "Cancel anytime",
    colony: "Self-serve billing portal",
    blaze: "Standard subscription management",
  },
];

export default function VsBlazePage() {
  return (
    <main id="main">
      <div className="container">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "The Colony vs BlazeTV" }]} />
        <PageHeader
          eyebrow="▼ COMPARE"
          title="The Colony vs BlazeTV"
          lede="Both serve audiences who want conservative and faith-aligned media. The Colony is built lean, Oklahoma-rooted, and private — with a founding membership price that honors where we started."
        />

        <section aria-label="Feature comparison" style={{ margin: "var(--space-8) 0" }}>
          <div
            style={{
              display: "grid",
              gap: "1px",
              background: "var(--color-border)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1fr",
                gap: "1px",
                background: "var(--color-border)",
                fontFamily: "var(--font-mono)",
                fontSize: ".75rem",
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              <div style={{ padding: "1rem", background: "var(--color-surface)" }} />
              <div style={{ padding: "1rem", background: "var(--color-surface)", color: "var(--honey)" }}>
                The Colony
              </div>
              <div style={{ padding: "1rem", background: "var(--color-surface)", color: "var(--muted-foreground)" }}>
                BlazeTV
              </div>
            </div>
            {COMPARISON.map((row) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  gap: "1px",
                  background: "var(--color-border)",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    background: "var(--color-surface)",
                    fontWeight: 600,
                    fontSize: ".9rem",
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    background: "var(--color-surface)",
                    fontSize: ".9rem",
                    lineHeight: 1.5,
                  }}
                >
                  {row.colony}
                </div>
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    background: "var(--color-surface)",
                    fontSize: ".9rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {row.blaze}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ margin: "var(--space-8) 0", maxWidth: "42rem" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", margin: "0 0 1rem" }}>
            Why members choose The Colony
          </h2>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6, margin: "0 0 1rem" }}>
            BlazeTV is a well-known national platform. The Colony is different by design: independent press funded by
            readers, rooted in Oklahoma, and built without the overhead of a cable network. You get investigative
            journalism, documentaries, podcasts, and live programming — ad-free and uncensored — at a price that
            reflects community-first values.
          </p>
          <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>
            If you want national punditry at scale, BlazeTV may fit. If you want private, faith-aligned media with
            local accountability and a founding $4.99/mo tier, The Colony is built for you.
          </p>
        </section>

        <section
          style={{
            margin: "var(--space-8) 0 var(--space-12)",
            padding: "1.5rem",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", margin: "0 0 .5rem" }}>
            Try The Colony
          </h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "0 0 1.25rem", fontSize: ".9rem" }}>
            Start free with our public library, or join as a Settler from $4.99/mo.
          </p>
          <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn btn--primary" href="/pricing">
              View membership
            </Link>
            <Link className="btn btn--outline" href="/shows">
              Browse shows
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}