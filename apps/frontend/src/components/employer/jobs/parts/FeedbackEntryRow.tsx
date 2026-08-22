'use client';
// FILE: src/components/employer/jobs/parts/FeedbackEntryRow.tsx
// One interviewer's verdict: who, what they said, and the first line of why.
//
// The note is clamped to two lines rather than truncated with an ellipsis in JS —
// -webkit-line-clamp reflows with the column width, so the same row reads correctly
// in a 360px sidebar and a wide one. "View full" expands in place; nothing opens a
// modal, because comparing four verdicts means seeing them at once.

import { useState } from 'react';
import { Avatar } from '@/components/ui';
import type { FeedbackEntry } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';
import { RECOMMENDATION_LABEL, RECOMMENDATION_COLOR } from './feedback-summary-helpers';

const C = COPY.employer.applicants;

const CLAMP_STYLE = {
  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

function RecommendationBadge({ entry }: { entry: FeedbackEntry }) {
  if (!entry.recommendation) {
    return (
      <span style={{
        padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        background: 'var(--surface-sunken)', color: 'var(--ink-muted)',
      }}>
        {C.feedbackPending}
      </span>
    );
  }
  const tone = RECOMMENDATION_COLOR[entry.recommendation];
  return (
    <span style={{
      padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
      background: tone.bg, color: tone.fg,
    }}>
      {RECOMMENDATION_LABEL[entry.recommendation]}
    </span>
  );
}

export default function FeedbackEntryRow({ entry }: { entry: FeedbackEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const full = entry.feedbackText?.trim() || null;
  // Only worth an expander when there is genuinely more to read than the preview.
  const hasMore = Boolean(full && entry.notePreview && full.length > entry.notePreview.length);

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Avatar
        src={entry.interviewerAvatarUrl ?? undefined}
        name={entry.interviewerName}
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{entry.interviewerName}</span>
          <RecommendationBadge entry={entry} />
        </div>
        {entry.notePreview && (
          <p style={{
            margin: '3px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            ...(isExpanded ? {} : CLAMP_STYLE),
          }}>
            {isExpanded ? full : entry.notePreview}
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded((open) => !open)}
            style={{
              marginTop: 2, padding: 0, border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, color: 'var(--accent)',
            }}
          >
            {isExpanded ? C.feedbackCollapse : C.feedbackViewFull}
          </button>
        )}
      </div>
    </div>
  );
}
