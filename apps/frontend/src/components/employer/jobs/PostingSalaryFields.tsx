'use client';
// FILE: src/components/employer/jobs/PostingSalaryFields.tsx
// The optional salary range. Validated on blur rather than on change so a
// half-typed minimum is never reported as being above the maximum.
//
// Split from PostingForm for size (section 2).

import { Input } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import type { PostingFormValues, PostingFormErrors } from './posting-form-helpers';

export interface PostingSalaryFieldsProps {
  values: PostingFormValues;
  errors: PostingFormErrors;
  setField: <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onBlur: () => void;
}

export default function PostingSalaryFields({
  values, errors, setField, onKeyDown, onBlur,
}: PostingSalaryFieldsProps) {
  return (
    <div>
      <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
        Salary (₹ LPA, optional)
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          type="number" placeholder="Min" inputMode="numeric" aria-label="Salary minimum" value={values.salaryMinStr}
          onKeyDown={onKeyDown} onBlur={onBlur}
          onChange={(event) => setField('salaryMinStr', event.target.value)}
        />
        <Input
          type="number" placeholder="Max" inputMode="numeric" aria-label="Salary maximum" value={values.salaryMaxStr}
          onKeyDown={onKeyDown} onBlur={onBlur}
          onChange={(event) => setField('salaryMaxStr', event.target.value)}
        />
      </div>
      {errors.salary && (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
          {errors.salary}
        </p>
      )}
    </div>
  );
}
