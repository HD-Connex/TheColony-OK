// Phase 3-05: CSP report endpoint (referenced by report-only header in next.config.ts).
// Accepts violation reports from browsers (report-uri / report-to).
// In report-only mode this is mostly for monitoring; in enforce mode it would block.
// Logs key fields in dev; swallows errors. Returns 204 (no content) on success.

import { NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const report = await req.json().catch(() => ({}));
    const csp = report["csp-report"] || report;

    if (process.env.NODE_ENV === "development") {
      console.warn("[CSP Report]", { "csp-report": csp, url: req.url, "user-agent": req.headers.get("user-agent") });
    } else if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Forward to Sentry for visibility in prod (manual wiring).
      Sentry.captureMessage("CSP violation", {
        level: "warning",
        extra: { "csp-report": csp, url: req.url, ua: req.headers.get("user-agent") },
        tags: { source: "csp-report" },
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (process.env.NODE_ENV === "development") console.error("[CSP Report] error", err);
    return new NextResponse(null, { status: 204 });
  }
}

// Support GET for manual testing / health
export async function GET() {
  return NextResponse.json({ ok: true, note: 'CSP report endpoint (POST for violations)' });
}
