import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import SectionBlock from "../_components/SectionBlock";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Sponsorship and advertising opportunities with The Colony OK podcast network and newsletter.",
  alternates: { canonical: "/advertise" },
};

const RATES = [
  {
    title: "Podcast Pre-Roll · Per Episode",
    meta: "15–30 SEC · HOST-READ · 1 SHOW",
    price: "$400",
  },
  {
    title: "Newsletter Sponsorship · Per Edition",
    meta: "DAILY SEND · 38K LIST",
    price: "$650",
  },
  {
    title: "Monthly Network Partner",
    meta: "ALL SHOWS · LIVE BROADCASTS · NEWSLETTER",
    price: "$4,800/mo",
  },
];

export default function AdvertisePage() {
  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Advertise" }]}
      eyebrow="▼ SPONSORSHIP · MEDIA KIT"
      title="Advertise"
      lede="Reach Oklahoma's most engaged conservative audience. Podcast pre-roll, newsletter sponsorship, and direct partnerships available."
      section={false}
    >
      <div className="stat-row" style={{ marginTop: "var(--space-12)" }}>
        <div className="stat-row__cell">
          <div className="stat-row__value">38K</div>
          <div className="stat-row__label">▼ Monthly Readers</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
            Verified by Plausible. Direct, organic — no syndicated traffic.
          </p>
        </div>
        <div className="stat-row__cell">
          <div className="stat-row__value">146</div>
          <div className="stat-row__label">▼ Podcast Episodes</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
            Across 4 shows. Avg 22-minute listen time. Pre-roll + mid-roll inventory.
          </p>
        </div>
        <div className="stat-row__cell">
          <div className="stat-row__value">1,200+</div>
          <div className="stat-row__label">▼ Paid Members</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
            High-intent buyers. Newsletter open rate 58%. Click-through 12%.
          </p>
        </div>
      </div>

      <section className="section section--tight">
        <SectionBlock number="N°01" title="Inventory" dateline="RATES · Q3 2026">
          <div className="rate-list">
            {RATES.map((r) => (
              <div className="rate-row" key={r.title}>
                <div>
                  <h3 className="rate-row__title">{r.title}</h3>
                  <p className="rate-row__meta">{r.meta}</p>
                </div>
                <div className="rate-row__price">{r.price}</div>
              </div>
            ))}
          </div>

          <div className="media-kit-cta">
            <h2>Get the Media Kit.</h2>
            <p>
              Demographics, audience research, past sponsor case studies. Send your company name and we&apos;ll have the
              full deck to you within 24 hours.
            </p>
            <a
              className="btn btn--ink btn--lg"
              href="mailto:advertise@thecolonyok.com?subject=Media%20Kit%20Request"
            >
              advertise@thecolonyok.com
            </a>
          </div>
        </SectionBlock>
      </section>
    </InnerPageShell>
  );
}