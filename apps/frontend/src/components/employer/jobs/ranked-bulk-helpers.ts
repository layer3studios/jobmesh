// FILE: src/components/employer/jobs/ranked-bulk-helpers.ts
// Pure mappers for the Ranked-tab bulk-archive flow (PP3). Kept out of RankedTab so the
// component stays under the line cap and the partial-success branching is unit-testable
// without rendering. No React, no I/O.

import type { BulkArchiveResult } from '@/types/employer-applicants';
import { EmployerApplicantsApiError } from '@/api/employer-applicants-api';

type ToastVariant = 'success' | 'error' | 'info';

// Friendly copy for whole-request bulk failures (D6); other codes fall back to message.
const FRIENDLY_BULK_ERROR: Record<string, string> = {
  BULK_EMPTY: 'Select at least one applicant to archive.',
  BULK_LIMIT_EXCEEDED: 'Too many selected — archive up to 50 at a time.',
  REASON_NOT_FOUND: 'Selected reason is no longer available. Pick another.',
};

/**
 * Map a 200 bulk-archive outcome to a toast + the next selection (R4/R5): all-success
 * clears it, partial keeps only the failed ids for retry, all-failure keeps it intact.
 */
export function summarizeBulkResult(
  result: BulkArchiveResult,
  currentSelection: Set<string>,
): { variant: ToastVariant; message: string; nextSelection: Set<string> } {
  if (result.failureCount === 0) {
    return { variant: 'success', message: `Archived ${result.successCount} applicant(s).`, nextSelection: new Set() };
  }
  if (result.successCount > 0) {
    return {
      variant: 'info',
      message: `Archived ${result.successCount} of ${result.total}. ${result.failureCount} failed.`,
      nextSelection: new Set(result.failed.map((item) => item.id)),
    };
  }
  return { variant: 'error', message: 'Could not archive any applicant. Please try again.', nextSelection: currentSelection };
}

/** Friendly message for a whole-request bulk failure (thrown), falling back to the raw message. */
export function resolveBulkErrorMessage(error: unknown): string {
  if (error instanceof EmployerApplicantsApiError) {
    return (error.code && FRIENDLY_BULK_ERROR[error.code]) || error.message;
  }
  return 'Could not archive.';
}
