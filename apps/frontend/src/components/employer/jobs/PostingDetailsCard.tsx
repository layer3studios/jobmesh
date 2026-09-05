'use client';
// FILE: src/components/employer/jobs/PostingDetailsCard.tsx
// Left Overview card: key-value job details + the pipeline snapshot (stacked
// stage bar + legend) when applicant data is available.

import { Button } from '@/components/ui';
import type { Posting } from '@/types/employer-jobs';
import type { Stage } from '@/types/employer-applicants';
import { stageColor } from './PipelineColumn';

const ROW_LABEL = { fontSize: 12, color: 'var(--ink-muted)', width: 90, flexShrink: 0 } as const;
const ROW_VALUE = { fontSize: 13, color: 'var(--ink)' } as const;

export default function PostingDetailsCard({
  posting, applyUrl, onCopyApplyUrl, stages, stageCounts,
}: {
  posting: Posting;
  applyUrl: string;
  onCopyApplyUrl: () => void;
  stages: Stage[];
  stageCounts: ReadonlyMap<string, number>;
}) {
  const salaryText = posting.salaryMin != null || posting.salaryMax != null
    ? `₹ ${posting.salaryMin ?? '—'} – ${posting.salaryMax ?? '—'}` : '—';
  const snapshot = stages
    .map((stage) => ({ stage, count: stageCounts.get(stage.id) ?? 0 }))
    .filter((entry) => entry.count > 0);
  const snapshotTotal = snapshot.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="glass" style={{ borderRadius: 14, padding: 18 }}>
      <p style={{ margin: '0 0 12px', fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Job details</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}><span style={ROW_LABEL}>Location</span><span style={ROW_VALUE}>{posting.location}</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={ROW_LABEL}>Type</span>
          <span style={ROW_VALUE}>{posting.employmentType} · {posting.workplaceType}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}><span style={ROW_LABEL}>Salary</span><span style={ROW_VALUE}>{salaryText}</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={ROW_LABEL}>Apply link</span>
          <code style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{applyUrl}</code>
          <Button variant="ghost" size="sm" onClick={onCopyApplyUrl}>Copy</Button>
        </div>
      </div>

      {snapshotTotal > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Pipeline snapshot</p>
          <div data-testid="pipeline-snapshot-bar" style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden' }}>
            {snapshot.map(({ stage, count }) => (
              <span key={stage.id} style={{ width: `${(count / snapshotTotal) * 100}%`, background: stageColor(stage.text) }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {snapshot.map(({ stage, count }) => (
              <span key={stage.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: stageColor(stage.text) }} />
                {stage.text} {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
