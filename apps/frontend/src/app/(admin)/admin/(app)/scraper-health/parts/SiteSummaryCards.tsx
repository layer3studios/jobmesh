// FILE: admin/scraper-health/parts/SiteSummaryCards.tsx
// One card per configured site. Both failure states — a failed last run and a
// volume drop — are stated IN WORDS as well as in colour, so the page still
// reads correctly without colour perception.

import type { SiteSummary } from '@/types/admin-scraper-health';
import { formatRunAge, formatDuration } from './scraper-health-format';

const CARD = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 12, padding: '14px 16px', minWidth: 0,
} as const;

const LABEL = {
  fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
} as const;

function Pill({ tone, children }: { tone: 'danger' | 'warn'; children: React.ReactNode }) {
  const color = tone === 'danger' ? 'var(--danger)' : 'var(--cat-amber)';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color, border: `1px solid ${color}`, background: 'transparent',
    }}>
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={LABEL}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SiteCard({ site, now }: { site: SiteSummary; now?: Date }) {
  const failed = site.lastRunFailed;
  return (
    <article
      data-testid="site-card"
      data-site={site.siteName}
      style={{ ...CARD, borderColor: failed ? 'var(--danger)' : 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{site.siteName}</h3>
        {failed && <Pill tone="danger">Last run failed</Pill>}
        {site.isVolumeAnomalous && <Pill tone="warn">Volume drop</Pill>}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 10, marginTop: 12,
      }}>
        <Stat label="Last run" value={formatRunAge(site.lastRun?.startedAt, now)} />
        <Stat label="Last success" value={formatRunAge(site.lastSuccessfulRun?.startedAt, now)} />
        <Stat label="New jobs" value={`${site.latestNewJobs} vs ${site.avgNewJobs} avg`} />
        <Stat label="Duration" value={site.lastRun ? formatDuration(site.lastRun.durationMs) : '—'} />
      </div>

      {failed && (
        <p role="status" style={{
          margin: '10px 0 0', fontSize: '0.8rem', color: 'var(--danger)', wordBreak: 'break-word',
        }}>
          Failed: {site.errorMessage || 'no error message recorded'}
        </p>
      )}
      {site.isVolumeAnomalous && (
        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          Volume drop: {site.latestNewJobs} new jobs is under 30% of the {site.avgNewJobs} average.
        </p>
      )}
    </article>
  );
}

export default function SiteSummaryCards({ sites, now }: { sites: SiteSummary[]; now?: Date }) {
  if (sites.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        No scrape runs recorded yet. Run a scrape to populate this dashboard.
      </p>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      {sites.map((site) => <SiteCard key={site.siteName} site={site} now={now} />)}
    </div>
  );
}
