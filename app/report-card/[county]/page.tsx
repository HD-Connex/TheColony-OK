import Link from "next/link";
import type { Metadata } from "next";
import InnerPageShell from "../../_components/InnerPageShell";
import { getReportCardForCounty, type OfficialWithGrades, type ScorecardIssue } from "@/lib/report-card";

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
        <div style={{ marginBottom: "var(--space-6)" }}>
          <Link href="/report-card" className="btn btn--sm btn--outline">← All counties</Link>
          <Link href={`/news?county=${encodeURIComponent(county)}`} className="btn btn--sm btn--outline" style={{ marginLeft: 8 }}>
            News from {county}
          </Link>
        </div>

        {officials.length === 0 ? (
          <div className="report-card-plate" style={{ padding: "var(--space-6)", border: "2px solid var(--color-brass)" }}>
            <p>No officials tracked for {county} County yet.</p>
            <p className="fine-print">Admins can add officials and grades after the 0024 migration is applied.</p>
          </div>
        ) : (
          officials.map((official: OfficialWithGrades) => (
            <div key={official.id} className="report-card-plate" style={{ marginBottom: "var(--space-8)", padding: "var(--space-6)", border: "2px solid var(--color-brass)", background: "var(--color-paper)" }}>
              <div className="report-card-header" style={{ marginBottom: "var(--space-4)", borderBottom: "1px solid var(--color-brass)", paddingBottom: "var(--space-2)" }}>
                <span className="foil" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  OFFICIAL RECORD
                </span>
                <h2 style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xl)" }}>{official.name}</h2>
                <div className="official-meta fine-print">
                  {official.office} {official.party ? `· ${official.party}` : ""} · {official.county} County
                  {official.term_start ? ` · Term: ${official.term_start}${official.term_end ? `–${official.term_end}` : ""}` : ""}
                </div>
              </div>

              {official.bio && <p style={{ marginBottom: "var(--space-4)" }}>{official.bio}</p>}

              <div>
                <div className="fine-print" style={{ marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Grades
                </div>
                {official.grades.length === 0 ? (
                  <p className="fine-print">No grades recorded for this official yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: "var(--space-4)" }}>
                    {official.grades.map((g) => {
                      const issue = g.issue || (g.issue_id ? issueMap.get(g.issue_id) : null);
                      const gradeClass = `grade grade--${(g.grade || "na").toLowerCase().replace("/", "")}`;
                      return (
                        <div key={g.id} style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--space-3)" }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                            <span className={gradeClass} style={{ fontSize: "var(--text-xl)", minWidth: 42, textAlign: "center" }}>
                              {g.grade}
                            </span>
                            <strong>{issue?.title || "Issue"}</strong>
                            <span className="fine-print" style={{ marginLeft: "auto" }}>
                              Updated {new Date(g.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          {g.notes && <p style={{ margin: "var(--space-2) 0" }}>{g.notes}</p>}
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
          ))
        )}

        <p className="fine-print" style={{ marginTop: "var(--space-6)" }}>
          Data is public. For corrections or additions contact the editors or use the admin tools (members only).
        </p>
      </div>
    </InnerPageShell>
  );
}
