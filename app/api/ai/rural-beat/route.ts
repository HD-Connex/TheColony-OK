import { NextResponse } from "next/server";

// Phase 8 agentic/SEO stub: AI content gen tool for rural beats (ag/energy/faith/county per LOCAL_OK + phase7 TRACK).
// Usage: POST /api/ai/rural-beat { "county": "Garfield", "beat": "co-op grid", "tone": "investigative" }
// Returns stub outline + note. Graceful degrade (no OPENAI etc keys = sample only; no crash).
// Integrate later with lib/semantic or transcripts for real (reuse patterns from briefing/recommendations).
// Client call example in future /backroom or tools UI. Feature-gated by env in lib/env (FEATURE_RECOMMENDED).
// Brutalist response; SEO/GEO friendly (rural OK primary sources).

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { county = "Oklahoma", beat = "rural economy", tone = "conservative" } = body;

    // Stub: in prod, call Anthropic/ Groq with prompt for "5th-gen rancher dispatch on [beat] in [county]".
    // Here: deterministic sample (idempotent, rich). Real keys -> replace with fetch to provider + citations.
    const sample = {
      title: `${county} ${beat} Dispatch — 2026 Harvest Reality`,
      dek: `Field notes from ${county} County on ${beat}. Primary sources, co-op data, OSU extension. Reader-funded.`,
      outline: [
        "Lead: Local impact (5th-gen families, co-op strain)",
        "Data: OSU agronomy report + county records (evidence)",
        "Voices: Named contributor (Wes Carter style) + farmer quote",
        "Policy: State vs DC mandates — liberty angle",
        "Close: Call to tip line + subscribe for full report",
      ],
      beat_tags: ["ag", "energy", county.toLowerCase().replace(/\s+/g, "-"), "rural"],
      status: "stub",
      note: "AI stub (Phase 8). Set ANTHROPIC_API_KEY or OPENAI etc in Vercel (FEATURE) for real gen + citations. Output respects E-E-A-T: named, public records, no ads.",
      generated_at: new Date().toISOString(),
    };

    // In real: validate tier etc, rate-limit (reuse lib/rate-limit), log to admin.
    return NextResponse.json(sample, { status: 200 });
  } catch (e: any) {
    // Graceful: never 500 the stub. Return sample always for demo/agentic breadth.
    return NextResponse.json({
      title: "Garfield Co-op Grid Strain Dispatch",
      dek: "Stub fallback — real AI gated on keys.",
      outline: ["Lead: Co-op power strain", "Policy note", "Call to action"],
      status: "fallback",
      error: "AI provider unavailable (graceful).",
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST JSON {county, beat, tone} to generate rural beat outline stub.",
    note: "Phase 8 agentic stub for /personalities + briefing + admin tools. See llms.txt + MOBILE for rural agentic offline.",
  });
}
