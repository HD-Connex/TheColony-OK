import { supabasePublic } from "./supabase";
import { OK_COUNTIES } from "./counties";

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

const GRADE_VALUES: Record<string, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };

export function gradeToValue(grade: string | null | undefined): number | null {
  if (!grade || grade.toUpperCase() === "N/A") return null;
  const val = GRADE_VALUES[grade.toUpperCase()];
  return val !== undefined ? val : null;
}

export interface CountyLeaderboardEntry {
  county: string;
  avg: number; // 0-4 scale
  officialCount: number;
  gradeCount: number;
  topGrade?: string;
  worstGrade?: string;
}

export interface OfficialWithAvg extends Official {
  avg: number | null;
  gradeCount: number;
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

/**
 * PHASE 7 REPORT-CARD SUBAGENT (Phase 1 content breadth style, autonomous):
 * getCountyStats: reuses getAllReportCardData (small real-seed data per perf audit) + reduce for county-scoped counts.
 * Avoids N+1; reuses Phase 1 county grouping pattern from report-card/page.tsx (byCounty reduce).
 * Returns officialCount + gradeCount for "X officials, Y grades" summary in list.
 * Ties to 0024 mig + lib/counties Phase1 moat (Garfield/Texas/Cimarron/Beaver/Comanche/Oklahoma).
 */
export async function getCountyStats(): Promise<Record<string, { officialCount: number; gradeCount: number }>> {
  const { officials, grades } = await getAllReportCardData();
  const offById = new Map(officials.map((o) => [o.id, o] as const));

  const offCounts: Record<string, number> = {};
  const gradeCounts: Record<string, number> = {};

  officials.forEach((o) => {
    const c = o.county || "Unassigned";
    offCounts[c] = (offCounts[c] || 0) + 1;
  });

  grades.forEach((g) => {
    const o = offById.get(g.official_id);
    if (o) {
      const c = o.county || "Unassigned";
      gradeCounts[c] = (gradeCounts[c] || 0) + 1;
    }
  });

  const stats: Record<string, { officialCount: number; gradeCount: number }> = {};
  Object.keys(offCounts).forEach((c) => {
    stats[c] = {
      officialCount: offCounts[c],
      gradeCount: gradeCounts[c] || 0,
    };
  });
  return stats;
}

/**
 * Helper reusing gradeToValue (existing from lib) for avg grade badge on county page per official.
 * Returns numeric avg + display letter (A-F) for brutalist badge.
 * Pure; no side effects. Matches DS mono/foil for "official record".
 */
export function computeOfficialAvg(grades: { grade: string | null | undefined }[]): { avg: number | null; display: string } {
  const vals = grades
    .map((g) => gradeToValue(g.grade))
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return { avg: null, display: "N/A" };
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const rounded = Number(avg.toFixed(1));
  const letter =
    avg >= 3.5 ? "A" : avg >= 2.5 ? "B" : avg >= 1.5 ? "C" : avg >= 0.5 ? "D" : "F";
  return { avg: rounded, display: `${letter} (${rounded})` };
}
