// FILE: admin/jobs-browser/parts/JobResultsTable.tsx
// Search results. Clicking a title expands that job's detail inline.
// "Hidden" is a word badge, not a colour cue.

import { Fragment } from 'react';
import type { JobRow, JobDetail } from '@/types/admin-job-browser';
import { formatTimestamp } from '../../queues/parts/queue-format';
import JobDetailPanel from './JobDetailPanel';

const TH = {
  textAlign: 'left', padding: '8px 10px', fontSize: '0.7rem', fontWeight: 600,
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
} as const;

const TD = {
  padding: '8px 10px', fontSize: '0.82rem', color: 'var(--ink)',
  borderBottom: '1px solid var(--border)', verticalAlign: 'top',
} as const;

const TITLE_BUTTON = {
  background: 'none', border: 'none', padding: 0, textAlign: 'left',
  font: 'inherit', fontWeight: 600, color: 'var(--ink)', cursor: 'pointer',
} as const;

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'danger' }) {
  const color = tone === 'danger' ? 'var(--danger)' : 'var(--ink-2)';
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
      color, border: `1px solid ${tone === 'danger' ? 'var(--danger)' : 'var(--border)'}`,
      background: tone === 'danger' ? 'transparent' : 'var(--paper-2)',
    }}>
      {children}
    </span>
  );
}

interface Props {
  jobs: JobRow[];
  expandedId: string | null;
  detail: JobDetail | null;
  isDetailLoading: boolean;
  busyJobId: string | null;
  onToggleExpand: (jobId: string) => void;
  onToggleHidden: (job: JobRow) => void;
  onRequestDelete: (job: JobRow) => void;
}

export default function JobResultsTable({
  jobs, expandedId, detail, isDetailLoading, busyJobId,
  onToggleExpand, onToggleHidden, onRequestDelete,
}: Props) {
  if (jobs.length === 0) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No jobs match those filters.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
        <thead>
          <tr>
            <th style={TH} scope="col">Title</th>
            <th style={TH} scope="col">Company</th>
            <th style={TH} scope="col">Source</th>
            <th style={TH} scope="col">Posted</th>
            <th style={TH} scope="col">State</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <Fragment key={job.id}>
              <tr data-testid="job-row">
                <td style={TD}>
                  <button
                    type="button"
                    style={TITLE_BUTTON}
                    aria-expanded={expandedId === job.id}
                    onClick={() => onToggleExpand(job.id)}
                  >
                    {job.title ?? '(untitled)'}
                  </button>
                </td>
                <td style={TD}>{job.company ?? '—'}</td>
                <td style={TD}>
                  <Badge>{job.isNative ? 'Employer posting' : job.siteName ?? 'scraped'}</Badge>
                </td>
                <td style={TD}>{formatTimestamp(job.postedAt)}</td>
                <td style={TD}>{job.isHidden ? <Badge tone="danger">Hidden</Badge> : '—'}</td>
              </tr>
              {expandedId === job.id && (
                <tr>
                  <td style={{ ...TD, background: 'var(--paper-2)' }} colSpan={5}>
                    {isDetailLoading || !detail ? (
                      <div className="anim-pulse" style={{ height: 120, borderRadius: 10, background: 'var(--surface)' }} />
                    ) : (
                      <JobDetailPanel
                        job={detail}
                        isBusy={busyJobId === job.id}
                        onToggleHidden={() => onToggleHidden(job)}
                        onRequestDelete={() => onRequestDelete(job)}
                      />
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
