import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import { getReportCardForCounty, type OfficialWithGrades, type ScorecardIssue, computeOfficialAvg } from "@/lib/report-card";

/*
PHASE 7 REPORT-CARD SUBAGENT (Phase 1 breadth style):
Plan in comment: reuse getReportCardForCounty + OfficialWithGrades (per-county grades already fetched); gradeToValue via new computeOfficialAvg for badge; Phase1 county filter links (/stories?county + /news?county reuse from news/stories pages); denser brutalist (space-2/3, rule borders, no extra divs, mono/foil on OFFICIAL RECORD per premium.css DS); empty + update per spec.
Add avg badge (e.g. B (3.0)) per official plate if grades; link to related stories (county filter).
Grades "table" cleaned (tighter grid, inline meta).
Self-verif after: read/grep for compute/avg + links; build.
*/

type Params = { county: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { county: countySlug } = await params;
  const county = decodeURIComponent(countySlug);
  return {
    title: `${county} County — Oklahoma Report Card`,
    description: `Grades and evidence for officials in ${county} County. Public record from The Colony.`,
  };
}

export const revalidate = 300;
export const dynamic = 'force-dynamic'; // Render on demand (admin-managed content; avoids build-time Supabase hangs)

export default async function CountyReportCardPage({ params }: { params: Promise<Params> }) {
  const { county: countySlug } = await params;
  const county = decodeURIComponent(countySlug);

  const { officials, issues } = await getReportCardForCounty(county);

  const issueMap = new Map(issues.map((i) => [i.id, i]));

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Report Card", href: "/report-card" },
        { label: county },
      ]}
      eyebrow="▼ COUNTY RECORD"
      title={`${county} County — Report Card`}
      lede="Official grades, notes, and primary evidence for tracked officeholders. Updated as the public record evolves."
      section={false}
    >
      <div className="container">
        {/* Denser nav + dual county filter links (Phase1 reuse: news+stories both support ?county=) */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Link href="/report-card" className="btn btn--sm btn--outline">← All counties</Link>
          <Link href={`/news?county=${encodeURIComponent(county)}`} className="btn btn--sm btn--outline" style={{ marginLeft: 8 }}>
            News from {county}
          </Link>
          <Link href={`/stories?county=${encodeURIComponent(county)}`} className="btn btn--sm btn--outline" style={{ marginLeft: 8 }}>
            Stories from {county}
          </Link>
        </div>

        {officials.length === 0 ? (
          <div className="report-card-plate" style={{ padding: "var(--space-4)", border: "2px solid var(--color-brass)" }}>
            <p>No officials tracked for {county} County yet.</p>
            <p className="fine-print">Demo data from seed for Garfield, Texas, Cimarron, Beaver, Oklahoma; expand in admin.</p>
          </div>
        ) : (
          officials.map((official: OfficialWithGrades) => {
            const avg = computeOfficialAvg(official.grades);
            return (
              <div key={official.id} className="report-card-plate" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)", border: "2px solid var(--color-brass)", background: "var(--color-paper)" }}>
                <div className="report-card-header" style={{ marginBottom: "var(--space-3)", borderBottom: "1px solid var(--color-brass)", paddingBottom: "var(--space-1)" }}>
                  <span className="foil" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    OFFICIAL RECORD
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <h2 style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xl)" }}>{official.name}</h2>
                    {avg.avg !== null && (
                      <span className="grade" style={{ fontSize: "var(--text-sm)", padding: "1px 6px", borderColor: "var(--color-brass)" }} title="Avg from grades (reuse gradeToValue)">
                        {avg.display}
                      </span>
                    )}
                  </div>
                  <div className="official-meta fine-print">
                    {official.office} {official.party ? `· ${official.party}` : ""} · {official.county} County
                    {official.term_start ? ` · Term: ${official.term_start}${official.term_end ? `–${official.term_end}` : ""}` : ""}
                  </div>
                </div>

                {official.bio && <p style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-sm)" }}>{official.bio}</p>}

                <div>
                  <div className="fine-print" style={{ marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Grades
                  </div>
                  {official.grades.length === 0 ? (
                    <p className="fine-print">No grades recorded for this official yet.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      {official.grades.map((g) => {
                        const issue = g.issue || (g.issue_id ? issueMap.get(g.issue_id) : null);
                        const gradeClass = `grade grade--${(g.grade || "na").toLowerCase().replace("/", "")}`;
                        return (
                          <div key={g.id} style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--space-2)" }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                              <span className={gradeClass} style={{ fontSize: "var(--text-lg)", minWidth: 36, textAlign: "center" }}>
                                {g.grade}
                              </span>
                              <strong style={{ fontSize: "var(--text-sm)" }}>{issue?.title || "Issue"}</strong>
                              <span className="fine-print" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>
                                Updated {new Date(g.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            {g.notes && <p style={{ margin: "var(--space-1) 0", fontSize: "var(--text-sm)" }}>{g.notes}</p>}
                            {g.evidence_url && (
                              <a
                                href={g.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="evidence"
                                style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}
                              >
                                Evidence → {g.source || g.evidence_url}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <p className="fine-print" style={{ marginTop: "var(--space-4)" }}>
          Data is public. For corrections or additions contact the editors or use the admin tools (members only).
        </p>
      </div>
    </InnerPageShell>
  );
}
