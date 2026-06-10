import type { Metadata } from "next";
import Image from "next/image";
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
    meta: "5 SHOWS (Colony Report, Faith & Freedom, Patriot Hour, OK Underground, Energy OK) · LIVE · NEWSLETTER",
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

        {/* Aesthetic image for advertise reach */}
        <div style={{ marginTop: "var(--space-4)", border: "var(--rule-hairline) solid var(--color-border)" }}>
          <Image
            src="/assets/images/og-home.jpg"
            alt="The Colony OK media reach and audience"
            width={900}
            height={300}
            style={{ width: "100%", height: "auto", display: "block", filter: "grayscale(0.15) contrast(1.05)" }}
          />
        </div>

        <div className="stat-row__cell">
          <div className="stat-row__value">12</div>
          <div className="stat-row__label">▼ Podcast Episodes</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
            Across 5 shows (The Colony Report, Faith &amp; Freedom, Patriot Hour, OK Underground, Energy OK). Avg 22-minute listen time. Pre-roll + mid-roll inventory. (Seeded catalog; production volume grows daily.)
          </p>
        </div>
        <div className="stat-row__cell">
          <div className="stat-row__value">1,200+</div>
          <div className="stat-row__label">▼ Paid Members</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
            Reader-funded core. 5 on masthead (post-seed). High-intent buyers. Newsletter open rate 58%. Click-through 12%.
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