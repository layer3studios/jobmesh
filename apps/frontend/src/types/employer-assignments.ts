// FILE: src/types/employer-assignments.ts
// Employer assignment-library types — mirror the backend's toPublicAssignment
// (models/employer/assignment-model.js). Employer audience only; the candidate-facing
// shape is PublicAssignment in types/public-apply.ts and is deliberately narrower.

/** The file kinds a submission may carry. Mirrors ALLOWED_FILE_TYPES in the model. */
export const ALLOWED_FILE_TYPES = ['pdf', 'zip', 'md'] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export interface EmployerAssignment {
  id: string;
  title: string;
  publicSummary: string;
  descriptionMarkdown: string;
  submissionInstructionsMarkdown: string;
  estimatedHours: number;
  allowedFileTypes: string[];
  createdAt: string | null;
  updatedAt: string | null;
  /** null while active. A date means retired from the library. */
  archivedAt: string | null;
}

/**
 * One posting that references an assignment.
 *
 * Two sources produce this shape, and they must stay interchangeable: the `jobs`
 * array on a 409 (CANNOT_EDIT_USED_ASSIGNMENT / CANNOT_ARCHIVE_USED_ASSIGNMENT),
 * and the client-side grouping of the postings list that populates the "Used by"
 * column. See the comment on the assignments page shell for why the second exists.
 */
export interface AssignmentUsage {
  id: string;
  title: string | null;
  status: string | null;
}

export interface AssignmentCreateInput {
  title: string;
  publicSummary: string;
  descriptionMarkdown: string;
  submissionInstructionsMarkdown: string;
  estimatedHours: number;
  allowedFileTypes: string[];
}

export type AssignmentPatch = Partial<AssignmentCreateInput>;
