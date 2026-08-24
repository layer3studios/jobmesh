'use client';
// FILE: src/components/employer/jobs/PostingDeadlineField.tsx
// The optional application deadline and its auto-close toggle.
//
// Split from PostingForm for size (section 2). Candidates see the date on the
// apply page, and the apply endpoint refuses submissions past it whether or not
// auto-close is on — the toggle only decides whether the posting closes itself.

import { useMemo } from 'react';
import { Checkbox } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { minimumDeadlineDate, deadlineError } from './posting-form-helpers';
import type { PostingFormValues, PostingFormErrors } from './posting-form-helpers';

export interface PostingDeadlineFieldProps {
  values: PostingFormValues;
  errors: PostingFormErrors;
  setField: <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) => void;
  setErrors: React.Dispatch<React.SetStateAction<PostingFormErrors>>;
}

export default function PostingDeadlineField({
  values, errors, setField, setErrors,
}: PostingDeadlineFieldProps) {
  // Computed once per mount: "tomorrow" only has to be right when the form opens.
  const minimumDeadline = useMemo(() => minimumDeadlineDate(), []);

  return (
    <div>
      <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
        Application deadline (optional)
      </p>
      <input
        type="date"
        aria-label="Application deadline"
        value={values.applicationDeadline}
        min={minimumDeadline}
        onChange={(event) => {
          const next = event.target.value;
          setField('applicationDeadline', next);
          // Clearing the date disarms auto-close: a flag with no date to fire on
          // is a rule that can never run. The backend enforces this too.
          if (next === '') setField('autoCloseOnDeadline', false);
          setErrors((previous) => ({ ...previous, applicationDeadline: deadlineError(next) }));
        }}
        style={{
          fontSize: TYPE.sm, padding: '8px 10px', borderRadius: 8, colorScheme: 'light dark',
          border: `1px solid ${errors.applicationDeadline ? 'var(--danger)' : 'var(--border)'}`,
          background: 'var(--surface-raised)', color: 'var(--ink)',
        }}
      />
      {values.applicationDeadline !== '' && (
        <div style={{ marginTop: 8 }}>
          <Checkbox
            checked={values.autoCloseOnDeadline}
            onChange={(checked) => setField('autoCloseOnDeadline', checked)}
            label="Auto-close posting on this date"
          />
        </div>
      )}
      {errors.applicationDeadline ? (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
          {errors.applicationDeadline}
        </p>
      ) : (
        <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', marginTop: 5 }}>
          Shown to candidates on the apply page (IST). With auto-close, the posting
          closes itself on this date.
        </p>
      )}
    </div>
  );
}
