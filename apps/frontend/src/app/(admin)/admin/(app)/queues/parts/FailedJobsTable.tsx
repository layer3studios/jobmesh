// FILE: admin/queues/parts/FailedJobsTable.tsx
// Failed jobs for one queue, with a per-row Retry. Busy state is per row
// (DpdpRightsQueue's pattern): only the row being retried shows a spinner, and
// every row is locked while any retry is in flight.

import { Button } from '@/components/ui';
import type { FailedJob } from '@/types/admin-queue-monitor';
import { formatTimestamp, truncate } from './queue-format';

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

interface Props {
  queueLabel: string;
  jobs: FailedJob[];
  isLoading: boolean;
  busyJobId: string | null;
  onRetry: (jobId: string) => void;
}

export default function FailedJobsTable({ queueLabel, jobs, isLoading, busyJobId, onRetry }: Props) {
  if (isLoading) {
    return (
      <div data-testid="failed-jobs-loading" className="anim-pulse" style={{
        height: 120, borderRadius: 12, background: 'var(--paper-2)', border: '1px solid var(--border)',
      }} />
    );
  }

  if (jobs.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        No failed jobs in {queueLabel}.
      </p>
    );
  }

  const identityLabel = jobs[0]?.identityLabel ?? 'id';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={TH} scope="col">Failed</th>
            <th style={TH} scope="col">{identityLabel}</th>
            <th style={TH} scope="col">Attempts</th>
            <th style={TH} scope="col">Error</th>
            <th style={TH} scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} data-testid="failed-job-row">
              <td style={TD}>{formatTimestamp(job.failedAt)}</td>
              <td style={{ ...TD, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>
                {job.identityValue ?? '—'}
              </td>
              <td style={TD}>{job.attemptCount ?? '—'}</td>
              <td style={{ ...TD, color: 'var(--danger)', maxWidth: 320 }}>
                {job.errorMessage
                  ? <span title={job.errorMessage}>{truncate(job.errorMessage)}</span>
                  : '—'}
              </td>
              <td style={TD}>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busyJobId === job.id}
                  disabled={busyJobId !== null}
                  onClick={() => onRetry(job.id)}
                >
                  Retry
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
