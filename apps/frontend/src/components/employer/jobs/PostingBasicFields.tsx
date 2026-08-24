'use client';
// FILE: src/components/employer/jobs/PostingBasicFields.tsx
// Title, location, workplace type and employment type — the four fields that
// identify a posting before anything is written about it.
//
// Split from PostingForm for size (section 2). Presentational: every value and
// setter arrives as a prop.

import { Input, Stack } from '@/components/ui';
import { PillToggleGroup } from './PillToggle';
import type { PostingFormValues, PostingFormErrors } from './posting-form-helpers';

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' },
];
// Internship stays as a fourth pill — dropping it would remove the ability to
// create internship postings (the API value set is unchanged).
const EMPLOYMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
];

const TWO_COLUMN_ROW = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
} as const;

export interface PostingBasicFieldsProps {
  values: PostingFormValues;
  errors: PostingFormErrors;
  setField: <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export default function PostingBasicFields({ values, errors, setField, onKeyDown }: PostingBasicFieldsProps) {
  return (
    <>
      {/* Two short text inputs share a row; auto-fit collapses them back to one
          column once the form column is too narrow to hold both. */}
      <div style={TWO_COLUMN_ROW}>
        <Input
          label="Job title" required maxLength={200} value={values.title} error={errors.title}
          onKeyDown={onKeyDown} onChange={(event) => setField('title', event.target.value)}
        />
        <Input
          label="Location" required maxLength={200} value={values.location} error={errors.location}
          onKeyDown={onKeyDown} onChange={(event) => setField('location', event.target.value)}
        />
      </div>

      <Stack gap={12} dir="row" wrap>
        <PillToggleGroup
          label="Workplace" options={WORKPLACE_OPTIONS} value={values.workplaceType} error={errors.workplaceType}
          onChange={(value) => setField('workplaceType', value as PostingFormValues['workplaceType'])}
        />
        <PillToggleGroup
          label="Employment type" options={EMPLOYMENT_OPTIONS} value={values.employmentType} error={errors.employmentType}
          onChange={(value) => setField('employmentType', value as PostingFormValues['employmentType'])}
        />
      </Stack>
    </>
  );
}
