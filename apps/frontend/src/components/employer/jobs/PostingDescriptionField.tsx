'use client';
// FILE: src/components/employer/jobs/PostingDescriptionField.tsx
// The job description — the one full-width field.
//
// Split from PostingForm for size (section 2). The focus flag lives here because
// nothing outside this field reads it: it only decides whether the hint shows a
// live character count or the plain target.

import { useState } from 'react';
import { JobDescriptionTextarea } from '@/components/employer/JobDescriptionTextarea';
import type { PostingFormValues, PostingFormErrors } from './posting-form-helpers';

export interface PostingDescriptionFieldProps {
  values: PostingFormValues;
  errors: PostingFormErrors;
  setField: <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) => void;
}

export default function PostingDescriptionField({ values, errors, setField }: PostingDescriptionFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hint = isFocused
    ? `${values.description.length} characters — aim for at least 50.`
    : 'Aim for at least 50 characters.';

  return (
    // maxRows caps growth at ~200px so a long JD scrolls inside the textarea
    // instead of pushing the submit button below the fold (R2). The cap must be
    // expressed as maxRows — TextareaAutosize rejects style.maxHeight.
    <JobDescriptionTextarea
      label="Job description" required value={values.description} error={errors.description}
      hint={hint}
      style={{ resize: 'vertical' }}
      placeholder="Describe the role, responsibilities, requirements, and what you offer..."
      minRows={5} maxRows={8}
      onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
      onChange={(event) => setField('description', event.target.value)}
    />
  );
}
