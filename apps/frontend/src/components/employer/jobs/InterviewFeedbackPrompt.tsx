'use client';
// FILE: src/components/employer/jobs/InterviewFeedbackPrompt.tsx
// A past scheduled interview becomes a feedback prompt: pick a verdict, write
// ≥10 chars, submit — then a follow-up nudge (move / archive) based on the
// backend's suggestion. No-show is a separate action with an optional note.
// The parent decides WHEN this renders (past + still 'scheduled').

import { useState } from 'react';
import { Check, CheckCheck, X, UserX } from 'lucide-react';
import { Button, Stack, useToast } from '@/components/ui';
import { completeInterview, markNoShow, EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { moveApplicant } from '@/api/employer-applicants-api';
import type { Interview, InterviewRecommendation, InterviewFeedbackResponse } from '@/types/employer-interviews';
import type { Stage } from '@/types/employer-applicants';
import { formatInterviewTime } from '@/utils/format-interview-time';
import { RECOMMENDATION_OPTIONS, recommendationLabel } from './interview-feedback-helpers';

const FEEDBACK_MIN_CHARS = 10;
type Selection = InterviewRecommendation | 'no_show' | null;
type FollowUp = { kind: 'advance'; stageId: string } | { kind: 'archive' } | null;

export default function InterviewFeedbackPrompt({
  interview, candidateName, stages, onOutcome, onArchiveRequested,
}: {
  interview: Interview;
  candidateName: string | null;
  stages: Stage[];
  /** Refetch interviews / applicant after any outcome lands. */
  onOutcome: () => void;
  /** Open the archive dialog for this single candidate. */
  onArchiveRequested: () => void;
}) {
  const { showToast } = useToast();
  const [selection, setSelection] = useState<Selection>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUp>(null);
  const [moving, setMoving] = useState(false);

  const firstName = candidateName?.trim().split(/\s+/)[0] || 'the candidate';
  const isNoShow = selection === 'no_show';
  const feedbackOk = feedbackText.trim().length >= FEEDBACK_MIN_CHARS;
  const canSubmit = !submitting && (isNoShow || (selection !== null && feedbackOk));

  async function handleSubmit(): Promise<void> {
    if (!selection) return;
    setSubmitting(true);
    try {
      if (isNoShow) {
        await markNoShow(interview.id, note.trim() ? { note: note.trim() } : {});
        showToast('success', 'Marked as no-show. Time returned to pool.');
        onOutcome();
        return;
      }
      const result: InterviewFeedbackResponse = await completeInterview(interview.id, {
        recommendation: selection, feedbackText: feedbackText.trim(),
      });
      showToast('success', 'Feedback submitted');
      if (result.nextAction === 'advance' && result.suggestedStage) {
        setFollowUp({ kind: 'advance', stageId: result.suggestedStage });
      } else if (result.nextAction === 'archive') {
        setFollowUp({ kind: 'archive' });
      } else {
        onOutcome();
      }
    } catch (error) {
      showToast('error', error instanceof EmployerInterviewsApiError && error.code === 'INTERVIEW_NOT_YET'
        ? 'This interview has not started yet.'
        : 'Could not save the outcome. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMove(stageId: string): Promise<void> {
    setMoving(true);
    try {
      await moveApplicant(interview.applicationId ?? '', { stageId });
      showToast('success', `${firstName} moved to ${stageName(stageId)}`);
    } catch {
      showToast('error', 'Could not move the candidate. Try again.');
    } finally {
      setMoving(false);
      setFollowUp(null);
      onOutcome();
    }
  }

  const stageName = (stageId: string): string =>
    stages.find((stage) => stage.id === stageId)?.text ?? 'the next stage';

  if (followUp) {
    const question = followUp.kind === 'advance'
      ? `Move ${firstName} to ${stageName(followUp.stageId)}?`
      : `Archive ${firstName}?`;
    return (
      <Stack gap={10}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>{question}</p>
        <Stack dir="row" gap={8}>
          {followUp.kind === 'advance' ? (
            <Button size="sm" loading={moving} onClick={() => void handleMove(followUp.stageId)}>Move</Button>
          ) : (
            <Button size="sm" variant="danger" onClick={() => { setFollowUp(null); onArchiveRequested(); }}>Archive</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { setFollowUp(null); onOutcome(); }}>Not now</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap={12}>
      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)' }}>Interview completed</p>
      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-2)' }}>
        {interview.startAtUtc ? formatInterviewTime(interview.startAtUtc) : '—'} · {interview.durationMinutes} min
      </p>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)' }}>How did it go?</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {RECOMMENDATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selection === option.value}
            onClick={() => setSelection(selection === option.value ? null : option.value)}
            style={option.style(selection === option.value)}
          >
            {option.value.startsWith('strong') && option.positive ? <CheckCheck size={13} /> : option.positive ? <Check size={13} /> : <X size={13} />}
            {recommendationLabel(option.value)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={isNoShow}
          onClick={() => setSelection(isNoShow ? null : 'no_show')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px',
            borderRadius: 999, cursor: 'pointer', marginLeft: 'auto',
            border: `1px solid ${isNoShow ? 'var(--ink-2)' : 'var(--border)'}`,
            background: isNoShow ? 'var(--paper-2)' : 'transparent', color: 'var(--ink-2)',
          }}
        >
          <UserX size={13} /> No-show
        </button>
      </div>

      {!isNoShow && selection !== null && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
            Feedback <span aria-hidden style={{ color: 'var(--danger)' }}>*</span>
            <textarea
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.target.value)}
              placeholder="What stood out? Any concerns?"
              rows={3}
              style={{
                display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', fontSize: '0.85rem',
                border: '1px solid var(--border)', borderRadius: 8, resize: 'vertical',
                background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </label>
          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: feedbackOk ? 'var(--ink-faint)' : 'var(--ink-muted)' }}>
            {feedbackText.trim().length}/{FEEDBACK_MIN_CHARS} characters minimum
          </p>
        </div>
      )}
      {isNoShow && (
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Note (optional)"
          aria-label="No-show note"
          style={{
            padding: '8px 10px', fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit',
          }}
        />
      )}

      <div>
        <Button size="sm" disabled={!canSubmit} loading={submitting} onClick={() => void handleSubmit()}>
          {isNoShow ? 'Mark as no-show' : 'Submit feedback'}
        </Button>
      </div>
    </Stack>
  );
}
