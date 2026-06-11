import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import { getOfficials, getIssues } from "@/lib/report-card";

export const metadata: Metadata = {
  title: "Oklahoma Report Card",
  description: "Independent grades on the officials and issues that matter to Oklahoma. Public record, reader-funded.",
};

export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Render on demand (admin-managed content; avoids build-time Supabase hangs)

export default async function ReportCardPage() {
  const [officials, issues] = await Promise.all([
    getOfficials(),
    getIssues(),
  ]);

  // Group officials by county for the overview grid (ties to Phase 1 counties)
  const byCounty = officials.reduce((acc: Record<string, typeof officials>, o) => {
    const c = o.county || "Unassigned";
    if (!acc[c]) acc[c] = [];
    acc[c].push(o);
    return acc;
  }, {});

  const counties = Object.keys(byCounty).sort();

  return (
    <InnerPageShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Report Card" }]}
      eyebrow="▼ CIVIC ACCOUNTABILITY"
      title="Oklahoma Report Card"
      lede="Letterpress of the public record. Independent grades on the officials and issues that shape Oklahoma — by county."
      section={false}
    >
      <div className="container">
        <div className="report-card-plate" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)", border: "2px solid var(--color-brass)" }}>
          <div className="foil" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "var(--space-2)" }}>
            OFFICIAL RECORD — PHASE 4
          </div>
          <p className="fine-print">
            Grades are assigned on the basis of available public data, voting records, budget documents, and observable outcomes.
            Evidence links point to primary sources where possible. This is a transparency tool, not partisan commentary.
          </p>
        </div>

        {counties.length === 0 ? (
          <p className="empty-state">No officials yet. Admins can add via the /admin Report Card tab after applying the 0024 migration.</p>
        ) : (
          <div className="grid-2" style={{ marginTop: "var(--space-4)" }}>
            {counties.map((county) => {
              const offs = byCounty[county];
              return (
                <Link
                  key={county}
                  href={`/report-card/${encodeURIComponent(county)}`}
                  className="card"
                  style={{ padding: "var(--space-4)", textDecoration: "none" }}
                >
                  <div className="card__body">
                    <div className="card__title" style={{ margin: 0 }}>{county} County</div>
                    <p className="card__excerpt" style={{ margin: "var(--space-2) 0 0" }}>
                      {offs.length} official{offs.length === 1 ? "" : "s"} tracked
                    </p>
                    <div className="fine-print" style={{ marginTop: "var(--space-2)" }}>
                      View grades →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <section style={{ marginTop: "var(--space-10)" }}>
          <h2 className="section-title" style={{ marginBottom: "var(--space-2)" }}>Methodology</h2>
          <div className="fine-print" style={{ maxWidth: "68ch" }}>
            We grade on a traditional A–F scale (N/A when data is insufficient or the issue is out of scope for that office).
            Grades reflect a synthesis of outcomes, process, and transparency rather than party. Every grade includes notes and at least one primary source when available.
            Updates are logged with timestamps. This page and its data are public by design — part of the heirloom press commitment to an informed citizenry.
            <br /><br />
            Counties without officials yet will show “Grades coming soon.” Admins and editors maintain the record via the protected back office.
          </div>
        </section>

        <p className="fine-print" style={{ marginTop: "var(--space-8)" }}>
          Also see <Link href="/counties">Counties</Link> for local stories and <Link href="/my-counties">My Counties</Link> (members) for personalized feeds.
        </p>
      </div>
    </InnerPageShell>
  );
}
