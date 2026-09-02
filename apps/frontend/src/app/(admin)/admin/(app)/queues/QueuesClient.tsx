'use client';
// FILE: admin/queues/QueuesClient.tsx
// Queue monitor for the three Mongo-backed worker queues. The overview re-polls
// every 30s because queue depth moves while the page is open.
//
// A poll must never blank the page: refreshes keep the last good overview on
// screen and only the first load shows skeletons. Retry follows the panel's
// convention — mutate, refetch, toast — with no optimistic UI, because only the
// server knows whether that job was still failed when the write landed.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui';
import { fetchQueueOverview, fetchFailedJobs, retryFailedJob } from '@/api/admin-queue-monitor-api';
import type { QueueSummary, FailedJob } from '@/types/admin-queue-monitor';
import QueueCards from './parts/QueueCards';
import FailedJobsTable from './parts/FailedJobsTable';

const POLL_INTERVAL_MS = 30_000;

const SECTION_TITLE = {
  margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)',
} as const;

const RETRY_REASON_COPY: Record<string, string> = {
  unknown_queue: 'That queue no longer exists',
  invalid_job_id: 'That job id is not valid',
  not_found_or_not_failed: 'That job is no longer failed — it may already be retried',
};

function Skeletons() {
  return (
    <div data-testid="queues-skeleton" style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12,
    }}>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 200, borderRadius: 12, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function QueuesClient() {
  const { showToast } = useToast();
  const [queues, setQueues] = useState<QueueSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [isLoadingFailed, setIsLoadingFailed] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  // Ref, not state: the poll closure must read the CURRENT selection without
  // resubscribing the interval on every render.
  const selectedKeyRef = useRef<string | null>(selectedKey);
  selectedKeyRef.current = selectedKey;

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setError(false);
    try {
      setQueues(await fetchQueueOverview());
      setError(false);
    } catch {
      // A failed background poll keeps the last good data on screen.
      if (!silent) setError(true);
    }
  }, []);

  const loadFailed = useCallback(async (queueKey: string, { silent = false } = {}) => {
    if (!silent) setIsLoadingFailed(true);
    try {
      setFailedJobs(await fetchFailedJobs(queueKey));
    } catch {
      setFailedJobs([]);
      showToast('error', 'Could not load failed jobs');
    } finally {
      setIsLoadingFailed(false);
    }
  }, [showToast]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadOverview({ silent: true });
      const key = selectedKeyRef.current;
      if (key) void loadFailed(key, { silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadOverview, loadFailed]);

  const handleSelect = useCallback((queueKey: string) => {
    setSelectedKey(queueKey);
    void loadFailed(queueKey);
  }, [loadFailed]);

  const handleRetry = useCallback(async (jobId: string) => {
    const queueKey = selectedKeyRef.current;
    if (!queueKey) return;
    setBusyJobId(jobId);
    try {
      const result = await retryFailedJob(queueKey, jobId);
      // Refetch first, then report: the toast should describe settled state.
      await Promise.all([loadOverview({ silent: true }), loadFailed(queueKey, { silent: true })]);
      if (result.retried) showToast('success', 'Job requeued');
      else showToast('error', RETRY_REASON_COPY[result.reason ?? ''] ?? 'Could not retry that job');
    } catch {
      showToast('error', 'Could not retry that job');
    } finally {
      setBusyJobId(null);
    }
  }, [loadOverview, loadFailed, showToast]);

  const selectedQueue = queues?.find((queue) => queue.key === selectedKey) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Queues</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Background worker queues. Refreshes every 30s.
        </p>
      </div>

      {error && !queues && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the queues.</span>
          <button
            type="button" onClick={() => void loadOverview()}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!queues && !error && <Skeletons />}

      {queues && (
        <>
          <QueueCards queues={queues} selectedKey={selectedKey} onSelect={handleSelect} />

          {selectedQueue && (
            <section>
              <h2 style={SECTION_TITLE}>Failed jobs — {selectedQueue.label}</h2>
              <FailedJobsTable
                queueLabel={selectedQueue.label}
                jobs={failedJobs}
                isLoading={isLoadingFailed}
                busyJobId={busyJobId}
                onRetry={(jobId) => void handleRetry(jobId)}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
