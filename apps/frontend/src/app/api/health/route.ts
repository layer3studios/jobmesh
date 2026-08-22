// FILE: src/app/api/health/route.ts
// What health.jobmesh.in resolves to (middleware.ts rewrites every path on that
// host here). Proxies the backend's own /api/health so monitoring gets one URL
// that reports the whole stack, and the Next tier's reachability is itself part
// of the signal — if this responds, Next is up.
//
// Never cached, and never fails: an unreachable backend is reported as degraded
// with a 503, not surfaced as an unhandled 500.
import { NextResponse } from 'next/server';
import { serverApiUrl } from '@/lib/server-fetch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Below Nginx's 5s read timeout on this location, so we answer first. */
const HEALTH_UPSTREAM_TIMEOUT_MS = 4000;

const NO_STORE = { 'Cache-Control': 'no-cache, no-store, must-revalidate' };

export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(serverApiUrl('/health'), {
      cache: 'no-store',
      signal: controller.signal,
    });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status, headers: NO_STORE });
  } catch {
    // Backend down or timed out. Next itself is clearly alive to have replied.
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: { api: { status: 'unreachable' } },
      },
      { status: 503, headers: NO_STORE },
    );
  } finally {
    clearTimeout(timer);
  }
}
