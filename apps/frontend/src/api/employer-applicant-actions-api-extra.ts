// FILE: src/api/employer-applicant-actions-api-extra.ts
// Destructive and one-off actions on a single candidate: rescore, anonymise,
// export, bulk archive, feedback summary and the do-not-contact flag. Split out of
// employer-applicants-api.ts (section 2, 'split by operation').

import { apiUrl } from '../lib/api-base';
import { request, applicantPath } from './employer-applicants-request';
import type {
  RescoreResult, AnonymizePreview, AnonymizeResult, BulkArchiveResult, Applicant, InterviewFeedbackSummary,
} from '../types/employer-applicants';

/**
 * Requeue AI scoring for one applicant. Resolves on both 202 (a job was reset or
 * inserted) and 200 (one was already in flight — `rescored: false`); the caller
 * distinguishes them via the returned flag rather than the status code.
 */
export async function rescoreApplicant(applicationId: string): Promise<RescoreResult> {
  return request<RescoreResult>(`${applicantPath(applicationId)}/rescore`, { method: 'POST' });
}

/** What anonymizing this candidate would touch. Owner+; 403 for everyone else. */
export async function fetchAnonymizePreview(applicationId: string): Promise<AnonymizePreview> {
  const body = await request<{ preview: AnonymizePreview }>(`${applicantPath(applicationId)}/anonymize-preview`);
  return body.preview;
}

/**
 * Irreversibly anonymize this candidate across every application they made at this
 * company. Idempotent — a repeat call resolves with alreadyAnonymized: true.
 */
export async function anonymizeCandidate(applicationId: string): Promise<AnonymizeResult> {
  const body = await request<{ result: AnonymizeResult }>(`${applicantPath(applicationId)}/anonymize`, {
    method: 'POST',
  });
  return body.result;
}

/**
 * The browser navigates to this URL to download the export. Deliberately NOT a
 * fetch + blob: the endpoint sets Content-Disposition, and letting the browser
 * handle the download keeps the server-chosen filename instead of inventing one
 * client-side that would drift from it.
 */
export function candidateExportUrl(applicationId: string, format: 'json' | 'csv' = 'json'): string {
  return apiUrl(`${applicantPath(applicationId)}/export${format === 'csv' ? '?format=csv' : ''}`);
}

/**
 * Bulk-archive many applications (PP1/PP3). Resolves with the per-item outcome body on
 * 200 (including partial success); throws EmployerApplicantsApiError with .code on a
 * whole-request failure (BULK_EMPTY / BULK_LIMIT_EXCEEDED / REASON_NOT_FOUND / 401 / 403).
 */
export async function bulkArchiveApplicants(
  input: { applicationIds: string[]; reasonId: string; note?: string; skipEmail?: boolean },
): Promise<BulkArchiveResult> {
  return request<BulkArchiveResult>('/employer/applicants/bulk/archive', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * The panel's aggregated verdicts. Null when this candidate has no interviews —
 * the caller's signal to render nothing rather than an empty card.
 *
 * The anti-bias hold is applied SERVER-SIDE: when the viewer still owes their own
 * feedback the per-interviewer detail is absent from the payload entirely, not
 * merely hidden here.
 */
export async function fetchFeedbackSummary(
  applicationId: string,
): Promise<InterviewFeedbackSummary | null> {
  const body = await request<{ summary: InterviewFeedbackSummary | null }>(
    `${applicantPath(applicationId)}/feedback-summary`,
  );
  return body.summary;
}

/**
 * Set or clear a candidate's "do not contact" flag. Member+; the flag lives on the
 * contact, so this affects every posting this person appears on at the company.
 */
export async function setDoNotContact(
  contactId: string,
  input: { flag: boolean; reason?: string | null },
): Promise<Applicant['contact']> {
  const body = await request<{ contact: NonNullable<Applicant['contact']> }>(
    `/employer/contacts/${encodeURIComponent(contactId)}/do-not-contact`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  return body.contact;
}
