// FILE: assignments/parts/assignment-form-initial-values.ts
// Seeds the assignment form: blank for a new one, a copy of the source for edit
// and duplicate. Split out of AssignmentFormModal.tsx (section 2).

import type { EmployerAssignment, AssignmentCreateInput } from '@/types/employer-assignments';
import type { FormMode } from './AssignmentFormModal';

/** A blank assignment: what the Create mode starts from. */
const EMPTY: AssignmentCreateInput = {
  title: '', publicSummary: '', descriptionMarkdown: '',
  submissionInstructionsMarkdown: '', estimatedHours: 2, allowedFileTypes: [],
};

/** Seed the form from the mode. Clone copies everything and suffixes the title. */
export function initialValues(mode: FormMode, source: EmployerAssignment | null): AssignmentCreateInput {
  if (!source) return EMPTY;
  return {
    title: mode === 'clone' ? `${source.title} (copy)` : source.title,
    publicSummary: source.publicSummary ?? '',
    descriptionMarkdown: source.descriptionMarkdown ?? '',
    submissionInstructionsMarkdown: source.submissionInstructionsMarkdown ?? '',
    estimatedHours: source.estimatedHours ?? EMPTY.estimatedHours,
    allowedFileTypes: [...(source.allowedFileTypes ?? [])],
  };
}
