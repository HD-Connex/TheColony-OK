import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import NewsletterSignup from "../_components/NewsletterSignup"; // Dedicated newsletter / The Briefing block for counties page (internal)
import { getCountiesWithCounts } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Counties",
  description: "Browse stories by Oklahoma county — The Colony's local moat.",
};

export default async function CountiesPage() {
  const counties = await getCountiesWithCounts();

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Counties" }]}
      eyebrow="▼ LOCAL MOAT"
      title="Oklahoma by County"
      lede="Our reporting is rooted in place. Choose a county to see the stories that matter there."
    >
      <div className="grid-2" style={{ marginTop: "var(--space-8)" }}>
        {counties.length === 0 && <p>No county-tagged stories yet. Check back soon.</p>}
        {counties.map(({ county, count }) => (
          <Link
            key={county}
            href={`/news?county=${encodeURIComponent(county)}`}
            className="card"
            style={{ padding: "var(--space-4)", textDecoration: "none" }}
          >
            <div className="card__body">
              <h3 className="card__title" style={{ margin: 0 }}>{county} County</h3>
              <p className="card__excerpt" style={{ margin: "var(--space-2) 0 0" }}>{count} stor{count === 1 ? "y" : "ies"}</p>
              <div className="fine-print" style={{ marginTop: 4 }}><Link href={`/report-card/${encodeURIComponent(county)}`}>Report Card →</Link></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Dedicated newsletter signup section for /counties (full plate variant, prominent "local briefing" + county picker reuse) */}
      <div style={{ marginTop: "var(--space-12)" }}>
        <NewsletterSignup
          variant="plate"
          source="counties-page"
          title="Subscribe for the local briefing"
          copy="County-specific editions of The Briefing. Pick your county in the form (or set multiple in My Counties as a member). Investigations, live, and podcasts for the places you care about."
        />
      </div>

      <p className="fine-print" style={{ marginTop: "var(--space-8)" }}>
        Members can save county preferences in <Link href="/my-counties">My Counties</Link> for personalized newsletters and feeds.
      </p>
    </InnerPageShell>
  );
}
