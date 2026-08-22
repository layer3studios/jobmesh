// FILE: src/app/(seeker)/status/page.tsx
// Public system status, reachable at jobmesh.in/status AND health.jobmesh.in
// (the middleware maps that host onto /api/health, which this page renders from).
// No auth, no client JS — a Server Component that reads the health endpoint on
// every request. Deliberately plain: a status page has to render when the rest of
// the stack is having a bad day.
import type { Metadata } from 'next';
import { serverApiUrl } from '@/lib/server-fetch';
import {
  formatUptime, humanizeServiceName, humanizeStatus, overallHeadline, toneFor, TONE_COLOR,
  type HealthReport,
} from './parts/status-helpers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System status',
  description: 'Live availability of the JobMesh platform.',
  robots: { index: false, follow: false },
};

const STATUS_FETCH_TIMEOUT_MS = 4000;

/** Read the backend health report; an unreachable API is itself a valid report. */
async function loadHealthReport(): Promise<HealthReport> {
  try {
    const response = await fetch(serverApiUrl('/health'), {
      cache: 'no-store',
      signal: AbortSignal.timeout(STATUS_FETCH_TIMEOUT_MS),
    });
    return (await response.json()) as HealthReport;
  } catch {
    return { status: 'degraded', services: { api: { status: 'unreachable' } } };
  }
}

function StatusDot({ tone }: { tone: keyof typeof TONE_COLOR }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
        background: TONE_COLOR[tone], display: 'inline-block',
      }}
    />
  );
}

export default async function StatusPage() {
  const report = await loadHealthReport();
  const headline = overallHeadline(report);
  const services = Object.entries(report.services ?? {});

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', width: '100%' }}>
      <h1 className="font-display" style={{ fontSize: '1.5rem', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
        System status
      </h1>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px',
        border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)',
      }}>
        <StatusDot tone={headline.tone} />
        <strong style={{ fontSize: '1rem' }}>{headline.label}</strong>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0' }}>
        {services.map(([key, service]) => (
          <li
            key={key}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 2px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <StatusDot tone={toneFor(service?.status)} />
            <span style={{ flex: 1 }}>{humanizeServiceName(key)}</span>
            <span style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
              {humanizeStatus(service?.status)}
            </span>
          </li>
        ))}
      </ul>

      <dl style={{ margin: '24px 0 0', fontSize: '0.825rem', color: 'var(--ink-faint)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <dt>Uptime</dt>
          <dd style={{ margin: 0 }}>{formatUptime(report.uptime)}</dd>
        </div>
        {report.version && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <dt>Version</dt>
            <dd style={{ margin: 0 }}>{report.version}</dd>
          </div>
        )}
        {report.timestamp && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <dt>Checked</dt>
            <dd style={{ margin: 0 }}>{report.timestamp}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
