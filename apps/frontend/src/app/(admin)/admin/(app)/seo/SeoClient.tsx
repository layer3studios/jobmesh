'use client';
// FILE: admin/seo/SeoClient.tsx
// SEO & indexing panel.
//
// Every action here only ENQUEUES — nothing calls Google inline, so a click is
// never waiting on an external API or on the 200/day quota. Mutate → refetch →
// toast, per-row busy state, no optimistic UI.
//
// Re-polls every 60s because the worker drains the queue in the background and
// the counts move without anyone touching the page.

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui';
import { fetchSeo, retryIndexingJob, submitPosting } from '@/api/admin-seo-api';
import type { SeoPayload } from '@/types/admin-seo';
import { SchemaHealthPanel, QuotaBar, FailuresTable, StaleUrlsTable } from './parts/SeoPanels';

const POLL_INTERVAL_MS = 60_000;

const SECTION_TITLE = {
  margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)',
} as const;

function Skeletons() {
  return (
    <div data-testid="seo-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="anim-pulse" style={{ height: 92, borderRadius: 12, background: 'var(--paper-2)' }} />
        ))}
      </div>
      <div className="anim-pulse" style={{ height: 120, borderRadius: 12, background: 'var(--paper-2)' }} />
    </div>
  );
}

export default function SeoClient() {
  const { showToast } = useToast();
  const [data, setData] = useState<SeoPayload | null>(null);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setError(false);
    try {
      setData(await fetchSeo());
      setError(false);
    } catch {
      // A failed background poll keeps the last good data on screen.
      if (!silent) setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => { void load({ silent: true }); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleRetry = useCallback(async (jobId: string) => {
    setBusyId(jobId);
    try {
      await retryIndexingJob(jobId);
      await load({ silent: true });
      showToast('success', 'Submission requeued');
    } catch {
      showToast('error', 'Could not requeue that submission');
    } finally {
      setBusyId(null);
    }
  }, [load, showToast]);

  const handleSubmitRemoval = useCallback(async (postingId: string) => {
    setBusyId(postingId);
    try {
      await submitPosting(postingId, 'deleted');
      await load({ silent: true });
      showToast('success', 'Removal queued — the worker will submit it');
    } catch {
      showToast('error', 'Could not queue that removal');
    } finally {
      setBusyId(null);
    }
  }, [load, showToast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>SEO &amp; Indexing</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Job-page schema health and Google Indexing API submissions. Refreshes every 60s.
        </p>
      </div>

      {data && !data.configured && (
        <div role="status" style={{
          padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem',
          border: '1px solid var(--cat-amber)', color: 'var(--ink-2)', background: 'var(--paper-2)',
        }}>
          <strong>Indexing not configured.</strong> Set GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON to
          enable submissions. Jobs still queue up here and will be sent once credentials exist —
          nothing is lost in the meantime.
        </div>
      )}

      {error && !data && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the SEO panel.</span>
          <button
            type="button" onClick={() => void load()}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!data && !error && <Skeletons />}

      {data && (
        <>
          <section>
            <h2 style={SECTION_TITLE}>Schema health</h2>
            <SchemaHealthPanel schema={data.schema} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Indexing queue</h2>
            <QuotaBar indexing={data.indexing} />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Recent failures</h2>
            <FailuresTable
              failures={data.indexing.recentFailures}
              busyId={busyId}
              onRetry={(jobId) => void handleRetry(jobId)}
            />
          </section>

          <section>
            <h2 style={SECTION_TITLE}>Stale URLs — Google not told</h2>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Postings closed in the last 30 days with no completed removal. A stale URL keeps
              sending candidates to a job nobody can apply for.
            </p>
            <StaleUrlsTable
              rows={data.staleUrls}
              busyId={busyId}
              onSubmitRemoval={(postingId) => void handleSubmitRemoval(postingId)}
            />
          </section>
        </>
      )}
    </div>
  );
}
