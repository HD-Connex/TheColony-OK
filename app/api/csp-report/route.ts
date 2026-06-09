// Phase 3-05: CSP report endpoint (referenced by report-only header in next.config.ts).
// Accepts violation reports from browsers (report-uri / report-to).
// In report-only mode this is mostly for monitoring; in enforce mode it would block.
// Logs key fields in dev; swallows errors. Returns 204 (no content) on success.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const report = await req.json().catch(() => ({}));
    // Only log in development to avoid noise; in prod you could forward to Sentry / logging service.
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CSP Report]', {
        'csp-report': report['csp-report'] || report,
        url: req.url,
        'user-agent': req.headers.get('user-agent'),
      });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Never let CSP reporting crash the app
    if (process.env.NODE_ENV === 'development') console.error('[CSP Report] error', err);
    return new NextResponse(null, { status: 204 });
  }
}

// Support GET for manual testing / health
export async function GET() {
  return NextResponse.json({ ok: true, note: 'CSP report endpoint (POST for violations)' });
}
