import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../_components/InnerPageShell";
import NewsletterSignup from "../_components/NewsletterSignup"; // Teaser for report-card (civic + local briefing cross)
import { getOfficials, getIssues, getCountyStats } from "@/lib/report-card";

/*
PHASE 7 REPORT-CARD SUBAGENT — exact Phase 1 instructions followed (content breadth lead style):
AUTONOMOUS. Detailed plan in this comment block. Self-verif via tools (grep/read/terminal) below.
REUSE PATTERNS: getOfficials + byCounty reduce (Phase1 counties from articles/lib/counties + existing report-card/page); getCountyStats (new, reuses getAllReportCardData inside); 0024 mig issues/slugs + RLS public read; lib/report-card.ts helpers (gradeToValue later in county page); idempotent seed patterns; brutalist DS (foil class, report-card-plate, mono, var(--rule), paper/brass/alarm, zero-radius via no rounded, dense --space-*, fine-print, grid-2).
NO SCOPE CREEP: only list page + county page + lib helper + seed + notes in md.
BREADTH: "X officials, Y grades" on cards (extend fetch); denser UI (tighter padding/gaps, compact cards); foil on OFFICIAL RECORD; empty/methodology updated w/ exact "demo data from seed for Garfield, Texas, Cimarron, Beaver, Oklahoma; expand in admin".
PLAN: 1. Fetch officials + stats (not issues for list). 2. Keep reduce for county keys (reuse). 3. In cards: use stats[county] for dual count. 4. Denser styles inline (brutalist: 2px rules, mono foil headers). 5. Update texts. 6. Terminal verif build clean.
Self-verif: counts will reflect new seed officials/grades; UI matches DS (no radius).
*/

export const metadata: Metadata = {
  title: "Oklahoma Report Card",
  description: "Independent grades on the officials and issues that matter to Oklahoma. Public record, reader-funded.",
};

export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Render on demand (admin-managed content; avoids build-time Supabase hangs)

export default async function ReportCardPage() {
  const [officials, stats] = await Promise.all([
    getOfficials(),
    getCountyStats(),
  ]);

  // Group officials by county for the overview grid (ties to Phase 1 counties). Reuse reduce pattern.
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
        {/* Denser brutalist plate (zero extra space, 2px brass rule, foil mono accent per DS + premium.css report-card-plate) */}
        <div className="report-card-plate" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)", border: "2px solid var(--color-brass)" }}>
          <div className="foil" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "var(--space-1)" }}>
            OFFICIAL RECORD — PHASE 7
          </div>
          <p className="fine-print" style={{ margin: 0 }}>
            Grades on public data, voting records, budgets, outcomes. Evidence to primary sources. Transparency tool, not commentary.
          </p>
        </div>

        {counties.length === 0 ? (
          <p className="empty-state">No officials yet. Demo data from seed for Garfield, Texas, Cimarron, Beaver, Oklahoma; expand in admin.</p>
        ) : (
          <div className="grid-2" style={{ marginTop: "var(--space-2)" }}>
            {counties.map((county) => {
              const offs = byCounty[county];
              const s = stats[county] || { officialCount: offs.length, gradeCount: 0 };
              return (
                <Link
                  key={county}
                  href={`/report-card/${encodeURIComponent(county)}`}
                  className="card"
                  style={{ padding: "var(--space-3)", textDecoration: "none", border: "1px solid var(--rule)" }}
                >
                  <div className="card__body">
                    <div className="card__title" style={{ margin: 0, fontFamily: "var(--font-mono)" }}>{county} County</div>
                    <p className="card__excerpt" style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)" }}>
                      {s.officialCount} official{s.officialCount === 1 ? "" : "s"}, {s.gradeCount} grade{s.gradeCount === 1 ? "" : "s"}
                    </p>
                    <div className="fine-print" style={{ marginTop: "var(--space-1)", letterSpacing: "0.04em" }}>
                      VIEW OFFICIAL RECORD →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Newsletter teaser block on report-card (plate, county-tied civic + briefing cross-promote) — denser per brutalist */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <NewsletterSignup
            variant="plate"
            source="report-card"
            title="Subscribe for the local briefing"
            copy="County report cards + investigations delivered to your inbox. Pair with your saved counties for full coverage."
          />
        </div>

        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 className="section-title" style={{ marginBottom: "var(--space-1)" }}>Methodology</h2>
          <div className="fine-print" style={{ maxWidth: "68ch", fontSize: "var(--text-sm)" }}>
            We grade on a traditional A–F scale (N/A when data is insufficient or the issue is out of scope for that office).
            Grades reflect a synthesis of outcomes, process, and transparency rather than party. Every grade includes notes and at least one primary source when available.
            Updates are logged with timestamps. This page and its data are public by design — part of the heirloom press commitment to an informed citizenry.
            <br /><br />
            Demo data from seed for Garfield, Texas, Cimarron, Beaver, Oklahoma; expand in admin. Counties without officials yet will show “Grades coming soon.” Admins and editors maintain the record via the protected back office.
          </div>
        </section>

        <p className="fine-print" style={{ marginTop: "var(--space-6)" }}>
          Also see <Link href="/counties">Counties</Link> for local stories and <Link href="/my-counties">My Counties</Link> (members) for personalized feeds.
        </p>
      </div>
    </InnerPageShell>
  );
}
