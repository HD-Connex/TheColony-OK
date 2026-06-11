import { supabasePublic } from "./supabase";

export interface Official {
  id: string;
  name: string;
  office: string;
  county: string | null;
  party: string | null;
  photo_url: string | null;
  bio: string | null;
  term_start: string | null;
  term_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScorecardIssue {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Grade {
  id: string;
  official_id: string;
  issue_id: string;
  grade: "A" | "B" | "C" | "D" | "F" | "N/A";
  notes: string | null;
  evidence_url: string | null;
  source: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface GradeWithIssue extends Grade {
  issue: ScorecardIssue | null;
}

export interface OfficialWithGrades extends Official {
  grades: GradeWithIssue[];
}

/**
 * Phase 4: Public read helpers for Oklahoma Report Card.
 * County scoping reuses Phase 1 county data from articles.
 * All reads go through anon/public client (RLS allows select true).
 * Writes must use supabaseAdmin + requireAdmin in /api/admin/report-card only.
 */

export async function getOfficials(county?: string): Promise<Official[]> {
  const sb = supabasePublic();
  let q = sb.from("officials").select("*").order("name", { ascending: true });
  if (county) {
    q = q.eq("county", county);
  }
  const { data, error } = await q;
  if (error) {
    console.error("getOfficials error", error);
    return [];
  }
  return (data ?? []) as Official[];
}

export async function getIssues(): Promise<ScorecardIssue[]> {
  const sb = supabasePublic();
  const { data, error } = await sb
    .from("scorecard_issues")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) {
    console.error("getIssues error", error);
    return [];
  }
  return (data ?? []) as ScorecardIssue[];
}

export async function getGradesForOfficial(officialId: string): Promise<GradeWithIssue[]> {
  const sb = supabasePublic();
  const { data, error } = await sb
    .from("grades")
    .select("*, issue:scorecard_issues(*)")
    .eq("official_id", officialId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("getGradesForOfficial error", error);
    return [];
  }
  return (data ?? []).map((g: any) => ({
    ...g,
    issue: g.issue ?? null,
  })) as GradeWithIssue[];
}

export async function getReportCardForCounty(county: string): Promise<{
  officials: OfficialWithGrades[];
  issues: ScorecardIssue[];
}> {
  const [officials, issues] = await Promise.all([
    getOfficials(county),
    getIssues(),
  ]);

  const officialsWithGrades: OfficialWithGrades[] = await Promise.all(
    officials.map(async (o) => {
      const grades = await getGradesForOfficial(o.id);
      return { ...o, grades };
    })
  );

  return { officials: officialsWithGrades, issues };
}

export async function getAllReportCardData(): Promise<{
  officials: Official[];
  issues: ScorecardIssue[];
  grades: Grade[];
}> {
  const sb = supabasePublic();
  const [{ data: offs }, { data: iss }, { data: grs }] = await Promise.all([
    sb.from("officials").select("*").order("county").order("name"),
    sb.from("scorecard_issues").select("*").order("sort_order"),
    sb.from("grades").select("*").order("updated_at", { ascending: false }),
  ]);
  return {
    officials: (offs ?? []) as Official[],
    issues: (iss ?? []) as ScorecardIssue[],
    grades: (grs ?? []) as Grade[],
  };
}