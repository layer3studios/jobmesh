'use client';
// FILE: src/components/apply/ScreeningQuestionFields.tsx
// The employer's screening questions on the public apply form.
//
// The candidate is never told which answer is flagged — the backend strips
// knockoutAnswer before it leaves the server, and nothing here infers it. Someone
// who could see the answer key would give the expected answer rather than a true
// one, which would make the whole feature worthless to the employer.

import { Radio, Textarea } from '@/components/ui';
import { COPY } from '@/theme/brand';
import type { PublicScreeningQuestion } from '@/types/public-apply';

const TEXT = COPY.employer.screening;

/** Backend cap; mirrored here so the textarea stops before the request would fail. */
export const MAXIMUM_ANSWER_LENGTH = 500;

/** Field name the form submits under. Must match readSubmittedAnswers on the backend. */
export const answerFieldName = (questionId: string) => `screening_${questionId}`;

/** Question text styled to match the Input/Textarea labels around it. */
function QuestionLabel({ text, isRequired }: { text: string; isRequired: boolean }) {
  return (
    <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
      {text}
      {isRequired && <span style={{ color: 'var(--danger)' }}> *</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 5 }}>{message}</p>
  );
}

export default function ScreeningQuestionFields({
  questions, answers, errors, onChange, onBlur,
}: {
  questions: PublicScreeningQuestion[];
  answers: Record<string, string>;
  errors: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
  onBlur: (questionId: string) => void;
}) {
  if (questions.length === 0) return null;

  return (
    <fieldset className="apply-fieldset">
      <legend className="apply-legend">{TEXT.applyLegend}</legend>
      <div className="apply-field-stack">
        {[...questions].sort((a, b) => a.order - b.order).map((question) => {
          const value = answers[question.id] ?? '';
          const error = errors[question.id];

          if (question.questionType === 'text') {
            return (
              <Textarea
                key={question.id}
                label={question.questionText}
                required={question.isRequired}
                rows={3}
                maxLength={MAXIMUM_ANSWER_LENGTH}
                value={value}
                error={error}
                onChange={(e) => onChange(question.id, e.target.value)}
                onBlur={() => onBlur(question.id)}
              />
            );
          }

          // single_select and yes_no render identically — yes_no simply arrives
          // with its two options already filled in by the backend.
          return (
            <fieldset key={question.id} style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ padding: 0 }}>
                <QuestionLabel text={question.questionText} isRequired={question.isRequired} />
              </legend>
              <Radio
                name={answerFieldName(question.id)}
                value={value}
                options={question.options.map((option) => ({ value: option, label: option }))}
                // A radio has no blur worth waiting for — choosing IS the answer,
                // so validation resolves on change rather than on leaving the group.
                onChange={(next) => { onChange(question.id, next); onBlur(question.id); }}
              />
              <FieldError message={error} />
            </fieldset>
          );
        })}
      </div>
    </fieldset>
  );
}
