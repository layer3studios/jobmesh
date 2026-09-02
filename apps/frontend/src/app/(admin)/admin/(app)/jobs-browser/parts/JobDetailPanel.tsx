// FILE: admin/jobs-browser/parts/JobDetailPanel.tsx
// Inline detail for one job, expanded under its row. Native postings show a
// read-only note instead of a delete button — they belong to the employer.

import { Button } from '@/components/ui';
import type { JobDetail } from '@/types/admin-job-browser';

const LABEL = {
  fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--ink-faint)',
} as const;

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={LABEL}>{label}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--ink)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function formatSalary(job: JobDetail): string | null {
  const { SalaryMin, SalaryMax, SalaryCurrency, SalaryInterval } = job;
  if (!SalaryMin && !SalaryMax) return null;
  const currency = SalaryCurrency ?? '';
  const range = SalaryMin && SalaryMax
    ? `${SalaryMin.toLocaleString()} – ${SalaryMax.toLocaleString()}`
    : (SalaryMin ?? SalaryMax)?.toLocaleString() ?? '';
  return `${currency} ${range}${SalaryInterval ? ` / ${SalaryInterval}` : ''}`.trim();
}

interface Props {
  job: JobDetail;
  isBusy: boolean;
  onToggleHidden: () => void;
  onRequestDelete: () => void;
}

export default function JobDetailPanel({ job, isBusy, onToggleHidden, onRequestDelete }: Props) {
  const tags = job.autoTags?.techStack ?? [];
  const liveUrl = job.DirectApplyURL || job.ApplicationURL || null;

  return (
    <div style={{
      background: 'var(--paper-2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <Field label="Company" value={job.company} />
        <Field label="Location" value={job.location} />
        <Field label="Status" value={job.status} />
        <Field label="Department" value={job.Department ?? null} />
        <Field label="Contract" value={job.ContractType ?? null} />
        <Field label="Salary" value={formatSalary(job)} />
        <Field label="Role category" value={job.autoTags?.roleCategory ?? null} />
        <Field label="Experience" value={job.autoTags?.experienceBand ?? null} />
      </div>

      {tags.length > 0 && (
        <div>
          <div style={{ ...LABEL, marginBottom: 6 }}>Tech stack</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((tag) => (
              <span key={tag} style={{
                padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink-2)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {job.description && (
        <div>
          <div style={{ ...LABEL, marginBottom: 6 }}>
            Description {job.descriptionIsCleaned ? '(cleaned)' : '(raw)'}
          </div>
          <div style={{
            fontSize: '0.84rem', color: 'var(--ink-2)', lineHeight: 1.6,
            maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            {job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Button size="sm" variant="secondary" loading={isBusy} onClick={onToggleHidden}>
          {job.isHidden ? 'Unhide' : 'Hide'}
        </Button>

        {job.isNative ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Employer posting — read-only. It can be hidden from seeker pages but never deleted here.
          </span>
        ) : (
          <Button size="sm" variant="danger" disabled={isBusy} onClick={onRequestDelete}>
            Delete
          </Button>
        )}

        {liveUrl && (
          <a
            href={liveUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', color: 'var(--accent)', marginLeft: 'auto' }}
          >
            Open live page ↗
          </a>
        )}
      </div>
    </div>
  );
}
