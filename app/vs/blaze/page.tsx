import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "../../_components/Breadcrumbs";
import PageHeader from "../../_components/PageHeader";
import JsonLd from "../../_components/JsonLd";

export const metadata: Metadata = {
  title: "The Colony vs BlazeTV | Oklahoma Roots + Local Depth",
  description:
    "Why The Colony is the better fit for Oklahoma and rural America: hyper-local ag/energy/faith shows, reader-funded independence, ad-free privacy, and full hub integration vs BlazeTV national cable-style commentary.",
  alternates: { canonical: "/vs/blaze" },
  openGraph: {
    title: "The Colony vs BlazeTV: Local OK Wins",
    description:
      "National caliber with Oklahoma authenticity. Compare pricing, privacy, local depth, and community vs BlazeTV.",
    images: [
      {
        url: "/assets/images/hosts/dan-hollis.jpg",
        width: 1200,
        height: 630,
        alt: "The Colony vs BlazeTV — Dan Hollis on Oklahoma editorial",
      },
    ],
  },
};

const vsBlazeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "VideoObject",
      name: "The Colony vs BlazeTV — Why Local Wins",
      description:
        "Side-by-side comparison: Colony rural OK depth, member community, and reader-funded journalism vs BlazeTV national personalities.",
      thumbnailUrl: ["https://thecolonyok.com/assets/images/hosts/dan-hollis.jpg"],
      uploadDate: "2026-06-08",
      contentUrl: "https://thecolonyok.com/podcasts/colony-report/real-video-ep",
    },
    {
      "@type": "Person",
      name: "Dan Hollis",
      image: "https://thecolonyok.com/assets/images/hosts/dan-hollis.jpg",
      jobTitle: "Host",
      worksFor: { "@type": "Organization", name: "The Colony OK" },
    },
  ],
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

const WINS_MATRIX = [
  {
    dimension: "Local / rural depth",
    blaze: "National personalities only",
    colony: "OK ag/energy/faith shows + Farm Bureau partnerships + member clips",
    edge: "10 vs 2",
  },
  {
    dimension: "Community",
    blaze: "Weekly Off the Record chats",
    colony: "Threaded comments + continuous member clips featured on hub and live",
    edge: "9.5 vs 6",
  },
  {
    dimension: "Integration / hub",
    blaze: "Siloed apps and shows",
    colony: "Seamless live ↔ pods ↔ clips ↔ stories in one place",
    edge: "9.5 vs 4",
  },
  {
    dimension: "Funding / perks",
    blaze: "$15 subs, opaque corporate backing",
    colony: "Transparent reader-funded + OK rural event access",
    edge: "9 vs 5",
  },
  {
    dimension: "Mobile / offline",
    blaze: "App + TV platforms",
    colony: "PWA + TWA with rural low-bandwidth smart packs",
    edge: "9 vs 7",
  },
];

export default function VsBlazePage() {
  return (
    <>
      <JsonLd data={vsBlazeSchema} />

      <main id="main">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "The Colony vs BlazeTV" },
            ]}
          />
          <PageHeader
            eyebrow="▼ COMPARE"
            title="The Colony vs BlazeTV"
            lede="National reach meets Oklahoma roots. Both serve audiences who want conservative and faith-aligned media — The Colony is built lean, local, and private, with a founding membership price that honors where we started."
          />

          <section className="section compare-section" aria-label="Platform overview">
            <div className="grid-2">
              <div className="bio-card">
                <h2 className="bio-card__name">BlazeTV (National)</h2>
                <p className="bio-card__role">Cable-style commentary network</p>
                <ul className="bio-card__list">
                  <li>$15/mo or annual (~$10/mo) — bonus eps, docs, and movies</li>
                  <li>24/7 live + national personalities (Beck, Deace, Levin, and more)</li>
                  <li>Weekly &quot;Off the Record&quot; private live chats</li>
                  <li>Mobile app + TV apps (Roku, Apple TV, Fire, Chromecast)</li>
                  <li>National focus: entertainment and talk heavy; no OK/rural depth</li>
                  <li>Opaque funding; siloed experiences across app, site, and shows</li>
                </ul>
              </div>

              <div className="bio-card">
                <h2 className="bio-card__name">The Colony (OK + Local)</h2>
                <p className="bio-card__role">Reader-funded Oklahoma press</p>
                <ul className="bio-card__list">
                  <li>Founding tiers from $4.99/mo with transparent reader funding</li>
                  <li>Local rural shows: The Colony Report (flagship), Faith &amp; Freedom, Patriot Hour, OK Underground, Energy OK (Ag Report beats seeded)</li>
                  <li>Member clips and county forums — continuous community vs weekly chats</li>
                  <li>Full hub integration + PWA/TWA mobile with offline smart packs</li>
                  <li>
                    <strong>Hyper-local OK moat:</strong> ag/energy/faith partnerships with Farm Bureau, co-ops, and 4H
                  </li>
                  <li>Ad-free, uncensored journalism funded by readers — not advertisers</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="compare-section" aria-label="Feature comparison">
            <header className="section-header">
              <span className="section-header__number">N°01</span>
              <div className="section-header__group">
                <h2 className="section-title">Head-to-Head</h2>
                <span className="section-header__dateline">PRICING · PRIVACY · EDITORIAL</span>
              </div>
            </header>

            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th>The Colony</th>
                  <th>BlazeTV</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td>{row.colony}</td>
                    <td className="compare--secondary">{row.blaze}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="compare-section" aria-label="Key wins">
            <header className="section-header">
              <span className="section-header__number">N°02</span>
              <div className="section-header__group">
                <h2 className="section-title">Key Wins</h2>
                <span className="section-header__dateline">LOCAL DEPTH · INTEGRATION · COMMUNITY</span>
              </div>
            </header>

            <table className="compare-table compare-table--wins">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>BlazeTV</th>
                  <th>The Colony</th>
                  <th>Edge</th>
                </tr>
              </thead>
              <tbody>
                {WINS_MATRIX.map((row) => (
                  <tr key={row.dimension}>
                    <th>{row.dimension}</th>
                    <td>{row.blaze}</td>
                    <td>{row.colony}</td>
                    <td className="compare--edge">{row.edge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="prose-block compare-section">
            <h2>Why members choose The Colony</h2>
            <p>
              BlazeTV is a well-known national platform. The Colony is different by design: independent press funded by
              readers, rooted in Oklahoma, and built without the overhead of a cable network. You get investigative
              journalism, documentaries, podcasts, and live programming — ad-free and uncensored — at a price that
              reflects community-first values.
            </p>
            <p>
              If you want national punditry at scale, BlazeTV may fit. If you want private, faith-aligned media with
              local accountability and a founding $4.99/mo tier, The Colony is built for you.
            </p>
          </section>

          {/* Contextual close for comparison page — full hub value & membership pitch lives on home (as all-in-one) and /pricing (conversion). Per agency hub model + competitor (TheFP clear value, ProPublica trust signals). */}
          <section className="section section--paper section--tight text-center" aria-label="Choose The Colony">
            <p className="mono-eyebrow">▼ READER-FUNDED • OK-ROOTED • BETTER FOR LOCAL</p>
            <Link className="btn btn--primary btn--lg" href="/pricing">
              Join The Colony — from $4.99/mo (Founding)
            </Link>
            <p className="text-muted">Full details, perks, and comparison on the Membership page. Watch live now on the hub.</p>
          </section>
        </div>
      </main>
    </>
  );
}