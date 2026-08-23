'use client';
// FILE: src/components/employer/jobs/parts/ScreeningAnswersCard.tsx
// What this candidate was asked, and what they said, on the applicant detail.
//
// Each answer carries its OWN copy of the question text, snapshotted at apply
// time. That is what makes this card honest: the employer may have reworded or
// deleted a question since, and this shows what THIS person actually answered
// rather than re-pairing their words with today's questions.

import { AlertTriangle } from 'lucide-react';
import { Card, Stack } from '@/components/ui';
import { COPY } from '@/theme/brand';
import type { ScreeningAnswer } from '@/types/employer-applicants';

const TEXT = COPY.employer.screening;

/** "2 flagged answers" — singular and plural both read naturally. */
function flaggedLabel(count: number): string {
  const template = count === 1 ? TEXT.flaggedBanner : TEXT.flaggedBannerPlural;
  return template.replace('{count}', String(count));
}

function AnswerRow({ answer }: { answer: ScreeningAnswer }) {
  const isFlagged = answer.isKnockout === true;
  return (
    <div
      style={{
        padding: isFlagged ? '8px 10px' : '8px 0',
        borderRadius: isFlagged ? 6 : 0,
        // A flagged answer is tinted and outlined, never coloured text alone:
        // the icon and the label carry the meaning for anyone who cannot see hue.
        background: isFlagged ? 'var(--warning-soft)' : 'transparent',
        border: isFlagged ? '0.5px solid var(--warning)' : 'none',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
        {answer.questionText}
      </p>
      <p style={{
        margin: '3px 0 0', fontSize: 13, color: 'var(--ink-muted)',
        display: 'flex', alignItems: 'flex-start', gap: 6, whiteSpace: 'pre-wrap',
      }}>
        {isFlagged && (
          <span title={TEXT.flaggedAnswerTooltip} style={{ color: 'var(--warning)', flexShrink: 0, lineHeight: 1.5 }}>
            <AlertTriangle size={13} aria-hidden="true" />
            <span className="sr-only">{TEXT.flaggedAnswerTooltip}</span>
          </span>
        )}
        {answer.answer}
      </p>
    </div>
  );
}

export default function ScreeningAnswersCard({ answers }: { answers: ScreeningAnswer[] }) {
  // A posting that asked nothing gets no card at all — an empty "Screening
  // answers" heading would imply the candidate skipped something.
  if (!answers || answers.length === 0) return null;
  const flaggedCount = answers.filter((answer) => answer.isKnockout === true).length;

  return (
    <Card>
      <Stack gap={10}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {TEXT.answersTitle}
        </h3>

        {flaggedCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 6,
            background: 'var(--warning-soft)', color: 'var(--warning)',
            fontSize: 12, fontWeight: 600,
          }}>
            <AlertTriangle size={13} aria-hidden="true" />
            {flaggedLabel(flaggedCount)}
          </div>
        )}

        <Stack gap={8}>
          {answers.map((answer) => <AnswerRow key={answer.questionId} answer={answer} />)}
        </Stack>
      </Stack>
    </Card>
  );
}
