'use client';
// FILE: src/components/employer/jobs/ApplicantStageHistory.tsx
// Stage history (P4.4). Default view is a single factual line — latest stage + when —
// that reads at a glance during shortlist review. When there is more than one change,
// a trailing inline link expands the full newest-first timeline in place (one click,
// only ever needed for the rare candidate with real history). Archive rows (note starts
// with "Archived:") get a distinct danger colour so a terminal move reads at a glance.

import { useState } from 'react';
import { Card, Stack } from '@/components/ui';
import type { Stage, StageChange } from '@/types/employer-applicants';
import { formatRelativeTime } from './applicant-view-helpers';

const HISTORY_LABELS = {
  empty: 'No stage changes yet.',
  expand: (n: number) => `${n} more change${n > 1 ? 's' : ''}`,
  collapse: 'Hide changes',
} as const;

const HISTORY_LIST_ID = 'applicant-stage-history-list';

function stageName(stages: Map<string, string>, id: string | null): string {
  if (!id) return '—';
  return stages.get(id) ?? '—';
}

function isArchiveRow(change: StageChange): boolean {
  return (change.note ?? '').startsWith('Archived:');
}

function HistoryRow({ change, stages }: { change: StageChange; stages: Map<string, string> }) {
  const archived = isArchiveRow(change);
  const from = stageName(stages, change.fromStageId);
  const to = stageName(stages, change.toStageId);
  const transition = change.fromStageId === change.toStageId ? to : `${from} → ${to}`;
  return (
    <li style={{ display: 'flex', gap: 10, listStyle: 'none' }}>
      <span aria-hidden style={{ marginTop: 6, flexShrink: 0, width: 8, height: 8, borderRadius: 999, background: archived ? 'var(--danger)' : 'var(--accent)' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: archived ? 'var(--danger)' : 'var(--ink)' }}>
          {archived ? change.note : transition}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
          {change.movedAt ? formatRelativeTime(change.movedAt) : '—'}
        </div>
        {!archived && change.note && (
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.45 }}>{change.note}</div>
        )}
      </div>
    </li>
  );
}

export default function ApplicantStageHistory({
  stageChanges, stages,
}: {
  stageChanges: StageChange[];
  stages: Stage[];
}) {
  const stageNames = new Map(stages.map((stage) => [stage.id, stage.text]));
  const ordered = [...stageChanges].sort(
    (a, b) => new Date(b.movedAt ?? 0).getTime() - new Date(a.movedAt ?? 0).getTime(),
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const latest = ordered[0];
  const extraCount = ordered.length - 1;

  return (
    <Card padding="md">
      <Stack gap={8}>
        {latest ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>
            {stageName(stageNames, latest.toStageId)} · {latest.movedAt ? formatRelativeTime(latest.movedAt) : '—'}
            {extraCount > 0 && (
              <button
                type="button"
                onClick={() => setIsExpanded((open) => !open)}
                aria-expanded={isExpanded}
                aria-controls={HISTORY_LIST_ID}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, marginLeft: 8, fontSize: '0.85rem' }}
              >
                {isExpanded ? HISTORY_LABELS.collapse : HISTORY_LABELS.expand(extraCount)}
              </button>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: 0 }}>{HISTORY_LABELS.empty}</p>
        )}
        {isExpanded && (
          <ul id={HISTORY_LIST_ID} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0 }}>
            {ordered.map((change) => <HistoryRow key={change.id} change={change} stages={stageNames} />)}
          </ul>
        )}
      </Stack>
    </Card>
  );
}
