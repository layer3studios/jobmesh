'use client';
// FILE: admin/scraper-health/ScraperHealthClient.tsx
// Scraper health dashboard. The overview re-polls every 60s because a scrape
// triggered from here finishes minutes after the request returns.
//
// A poll must never blank the page: refreshes keep the last good overview on
// screen and only the first load shows skeletons. "Run scrape now" follows the
// panel's convention — mutate, refetch, toast — with no optimistic UI, because
// the server's isScraping lock is the only honest answer to "did it start".

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui';
import { fetchScraperHealth, fetchScrapeRuns, triggerScrapeNow } from '@/api/admin-scraper-health-api';
import type { ScraperHealthOverview, ScrapeRun } from '@/types/admin-scraper-health';
import { percent } from './parts/scraper-health-format';
import SiteSummaryCards from './parts/SiteSummaryCards';
import RunHistoryTable from './parts/RunHistoryTable';

const POLL_INTERVAL_MS = 60_000;
const RUN_HISTORY_LIMIT = 50;

const SECTION_TITLE = {
  margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)',
} as const;

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div data-testid="kpi-tile" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '12px 14px', minWidth: 0,
    }}>
      <div style={{
        fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
        color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginTop: 4, lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function Skeletons() {
  return (
    <div data-testid="scraper-health-skeleton" style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10,
    }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 78, borderRadius: 12, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function ScraperHealthClient() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<ScraperHealthOverview | null>(null);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [siteFilter, setSiteFilter] = useState('');
  const [error, setError] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  // Ref, not state: the poll closure must read the CURRENT filter without
  // resubscribing the interval on every render.
  const siteFilterRef = useRef(siteFilter);
  siteFilterRef.current = siteFilter;

  const load = useCallback(async (site: string, { silent = false } = {}) => {
    if (!silent) setError(false);
    try {
      const [nextOverview, nextRuns] = await Promise.all([
        fetchScraperHealth(),
        fetchScrapeRuns(site || undefined, RUN_HISTORY_LIMIT),
      ]);
      setOverview(nextOverview);
      setRuns(nextRuns);
      setError(false);
    } catch {
      // A failed background poll keeps the last good data on screen.
      if (!silent) setError(true);
    }
  }, []);

  useEffect(() => { void load(siteFilter); }, [load, siteFilter]);

  useEffect(() => {
    const timer = setInterval(() => { void load(siteFilterRef.current, { silent: true }); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleRunNow = useCallback(async () => {
    setIsTriggering(true);
    try {
      const result = await triggerScrapeNow();
      // Refetch first, then report: the toast should describe settled state.
      await load(siteFilterRef.current, { silent: true });
      if (result.started) showToast('success', 'Scrape started');
      else showToast('error', 'Scrape already running');
    } catch {
      showToast('error', 'Could not start the scrape');
    } finally {
      setIsTriggering(false);
    }
  }, [load, showToast]);

  const corpus = overview?.corpus;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Scraper Health</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
            Per-site scrape outcomes and corpus quality. Refreshes every 60s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRunNow()}
          disabled={isTriggering}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
            border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            cursor: isTriggering ? 'not-allowed' : 'pointer', opacity: isTriggering ? 0.6 : 1,
          }}
        >
          {isTriggering ? 'Starting…' : 'Run scrape now'}
        </button>
      </div>

      {error && !overview && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load scraper health.</span>
          <button
            type="button" onClick={() => void load(siteFilter)}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!overview && !error && <Skeletons />}

      {overview && corpus && (
        <>
          <section>
            <h2 style={SECTION_TITLE}>Corpus quality</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              <KpiTile label="Cleaned" value={percent(corpus.pctCleaned)} />
              <KpiTile label="Tagged" value={percent(corpus.pctTagged)} />
              <KpiTile label="With salary" value={percent(corpus.pctSalary)} />
              <KpiTile label="Duplicate job IDs" value={corpus.duplicateJobIds.toLocaleString()} />
            </div>
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Sites</h2>
            <SiteSummaryCards sites={overview.sites} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Run history</h2>
            <RunHistoryTable
              runs={runs}
              sites={overview.sites.map((site) => site.siteName)}
              siteFilter={siteFilter}
              onSiteFilterChange={setSiteFilter}
            />
          </section>
        </>
      )}
    </div>
  );
}
