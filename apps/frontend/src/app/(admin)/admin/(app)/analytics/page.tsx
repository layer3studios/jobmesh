// FILE: src/app/(admin)/admin/(app)/analytics/page.tsx
// Admin analytics dashboard (Server Component). Reads ?since, fetches all six bundles
// in parallel with the cookie jar forwarded. Admin identity is jm_admin_token, verified
// by require-admin-middleware; this file now sits under (admin)/admin/(app)/layout.tsx,
// so that guard redirects unauthed users FIRST — the API 401 catch below is only a
// belt-and-suspenders net for a session that expires mid-render. The 25s per-call
// timeout reflects PostHog Query API latency (its queue can hold a request up to 30s per
// PostHog docs).
//
// FAILURE RULE — CHANGED, deliberately. This file used to render "a single clear state,
// never half a dashboard": any bundle failure replaced the entire page with one notice.
// That was correct while EVERY section came from PostHog, because one 503 meant there
// was genuinely nothing to show. It is no longer correct: the take-home assignments
// section is Mongo-backed and answers fine with POSTHOG_PERSONAL_API_KEY unset. The rule
// is now split by data source:
//
//   • PostHog-dependent sections degrade TOGETHER — the six bundles below share one
//     Promise.all and one notice, because they share one upstream.
//   • Mongo-backed sections render REGARDLESS — they are never inside that Promise.all
//     and a PostHog failure can never blank them.
//
// So an unconfigured analytics key yields the shell + time selector + assignments +
// an INLINE notice where the PostHog sections would be, not a bare page. Access denied
// (401/403) is the one page-level truth left: it short-circuits everything, because
// "you may not see this" applies to every section regardless of its data source.
import type { Metadata } from 'next';
import { serverFetch, ServerFetchError } from '@/lib/server-fetch';
import {
  normalizeVolume, normalizeSeeker, normalizeEmployer,
  normalizeEngagement, normalizeTeam, normalizeTraffic,
} from '@/api/admin-analytics-api';
import type { AdminAnalyticsData, SinceRange } from '@/types/admin-analytics';
import AdminAnalyticsClient from './AdminAnalyticsClient';
import EmptyStateNotice from './parts/EmptyStateNotice';

export const metadata: Metadata = {
  title: 'Analytics · JobMesh Admin',
  robots: { index: false, follow: false },
};

const RANGES: SinceRange[] = ['24h', '7d', '30d'];
type Row = Record<string, unknown>;
// PostHog Query API can queue up to 30s (R1); 25s sits under Nginx's 60s read timeout
// with buffer, but returns a fast-enough error when PostHog is genuinely down (D2).
const ANALYTICS_SSR_TIMEOUT_MS = 25_000;
// Backend envelope: { result: {...}, cachedAt, since }. Unwrap so normalizers see
// the fields at top-level. Mirrors the client-side unwrap in api/admin-analytics-api.ts
// so SSR and client paths hand the same shape to the normalizers.
const unwrap = (body: Row): Row => {
  const result = (body.result as Row | undefined) ?? body;
  return { ...result, cachedAt: body.cachedAt, since: body.since };
};

const get = async (path: string, since: string): Promise<Row> => {
  const body = await serverFetch<Row>(
    `/admin/analytics/${path}?since=${since}`,
    undefined,
    { timeoutMs: ANALYTICS_SSR_TIMEOUT_MS },
  );
  return unwrap(body);
};

function resolveSince(raw: string | string[] | undefined): SinceRange {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return RANGES.includes(value as SinceRange) ? (value as SinceRange) : '7d';
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string | string[] }>;
}) {
  const since = resolveSince((await searchParams).since);

  let posthogData: AdminAnalyticsData | null = null;
  let posthogNotice: { title: string; body: string } | null = null;

  // ── PostHog bundles — one upstream, so they degrade together ──────────────
  try {
    const [volume, seeker, employer, engagement, team, traffic] = await Promise.all([
      get('volume', since), get('seeker', since), get('employer', since),
      get('engagement', since), get('team', since), get('traffic', since),
    ]);
    posthogData = {
      volume: normalizeVolume(volume),
      seeker: normalizeSeeker(seeker),
      employer: normalizeEmployer(employer),
      engagement: normalizeEngagement(engagement),
      team: normalizeTeam(team),
      traffic: normalizeTraffic(traffic),
    };
  } catch (error) {
    // Rule 4, unchanged: access denied is a PAGE-level truth, not a per-section one.
    // Checked FIRST now — a 401 must win even if the body also carries a code.
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 403)) {
      return <EmptyStateNotice title="Access denied" body="You need an admin account to view analytics." />;
    }
    if (error instanceof ServerFetchError && error.code === 'ANALYTICS_DISABLED') {
      // No longer a full-page return: the Mongo-backed section below is unaffected
      // by a missing PostHog key and must still render. This becomes an INLINE
      // notice occupying the space the PostHog sections would have taken.
      posthogNotice = {
        title: 'Analytics not configured',
        body: 'The server is missing POSTHOG_PERSONAL_API_KEY. Set it in the backend environment (EC2) and reload — the sections below that depend on event data cannot be fetched until then.',
      };
    } else {
      throw error; // unexpected → error.tsx boundary
    }
  }

  return (
    <AdminAnalyticsClient
      initialData={posthogData}
      posthogNotice={posthogNotice}
      initialSince={since}
    />
  );
}
