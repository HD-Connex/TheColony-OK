import { NextResponse } from 'next/server';

/**
 * Phase 7: Simple public /api/health stub for prod uptime monitoring (per MONITORING.md + perf audit).
 * - Returns 200 JSON with status, timestamp, runtime info (no secrets, always succeeds).
 * - Usable by: Vercel, UptimeRobot, Pingdom, external SaaS, k8s probes, CI smoke, etc.
 * - GET for browsers/curl/monitors; HEAD supported implicitly by Next.
 * - Reuses NextResponse pattern from /api/csp-report (and other api/* routes).
 * - No auth (intentional for uptime); for internal see /api/admin/status.
 * - In prod, pair with Sentry (5xx will surface via instrumentation/onRequestError anyway).
 * - Extend later: add DB ping, dep versions, or feature flags if needed (keep light).
 *
 * Example:
 *   curl https://thecolonyok.com/api/health
 *   -> {"status":"ok","timestamp":"...","env":"production","uptime":123.45,"runtime":"nodejs"}
 */
export const runtime = 'nodejs'; // Explicit for uptime() + consistency with other health-ish routes.

export async function GET() {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    // process.uptime() available in Node runtime (Vercel serverless/edge note: may be cold-start relative).
    uptime: typeof process !== 'undefined' && typeof process.uptime === 'function' ? process.uptime() : null,
    runtime: (globalThis as any)?.process?.env?.NEXT_RUNTIME || 'nodejs',
    note: 'The Colony OK basic health for monitoring (Sentry + RUM active for deeper observability).',
  };
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

// Bonus: lightweight HEAD for some monitors.
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
