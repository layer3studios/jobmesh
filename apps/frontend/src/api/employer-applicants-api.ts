// FILE: src/api/employer-applicants-api.ts
// Typed client for the employer applicant pipeline endpoints. Sends the employer
// auth cookie and throws EmployerApplicantsApiError (status + code) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import {
  request, applicantPath,
} from './employer-applicants-request';

// Re-exported so every existing import of these from this module keeps resolving.
export { EmployerApplicantsApiError, ROLE_FORBIDDEN_MESSAGE } from './employer-applicants-request';
import type {
  Applicant, ApplicantDetail, ApplicantNote, ResumeUrl, Stage, ArchiveReason, ApplicantSort, ApplicantFacets, AssignmentStats,
} from '../types/employer-applicants';
import type { LeetCodeProfile, GitHubProfile } from '../types/seeker-profile';

export {
  listSavedViews, createSavedView, updateSavedView, deleteSavedView,
} from './employer-saved-views-api';

export {
  rescoreApplicant, fetchAnonymizePreview, anonymizeCandidate, candidateExportUrl, bulkArchiveApplicants, fetchFeedbackSummary, setDoNotContact,
} from './employer-applicant-actions-api-extra';

// Friendly copy for role-permission 403s the UI didn't pre-gate (Chunk 5, item 17).
// Normalised here in the shared wrapper — no separate interceptor — so every surface
// that surfaces error.message shows the same explanation instead of a raw backend code.


/**
 * The list endpoint's full envelope.
 *
 * `stats` is present ONLY for a posting that has an assignment attached — the
 * backend guards before running any assignment query and otherwise returns exactly
 * the shape it always had. Its absence is the signal to render the plain list with
 * no strip, no chips and no extra column.
 */
export interface ApplicantListResult {
  applicants: Applicant[];
  stats?: AssignmentStats;
}

export async function listApplicantsWithStats(
  postingId: string,
  { sort, filters }: { sort?: ApplicantSort; filters?: Record<string, string> } = {},
): Promise<ApplicantListResult> {
  const params = new URLSearchParams();
  if (sort) params.set('sort', sort);
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return request<ApplicantListResult>(
    `/employer/jobs/${encodeURIComponent(postingId)}/applicants${query ? `?${query}` : ''}`,
  );
}

/**
 * Applicants only. Retained as the narrow read for callers that never needed the
 * envelope (the detail page's prev/next list), so adding stats did not have to
 * touch them.
 */
export async function listApplicantsForPosting(
  postingId: string,
  options: { sort?: ApplicantSort; filters?: Record<string, string> } = {},
): Promise<Applicant[]> {
  const body = await listApplicantsWithStats(postingId, options);
  return body.applicants;
}

/** Filter facets (top skills + cities) scoped to one posting's applicant pool. */
export async function fetchApplicantFacets(postingId: string): Promise<ApplicantFacets> {
  return request<ApplicantFacets>(
    `/employer/jobs/${encodeURIComponent(postingId)}/applicants/facets`,
  );
}

// ─── Saved views (per-recruiter, per-posting) ────────────────────────
// Listed once per page load and cached in-memory; mutations write through the
// cache so chips update without a refetch.


export async function fetchApplicantDetail(applicationId: string): Promise<ApplicantDetail> {
  const body = await request<{ applicant: ApplicantDetail }>(applicantPath(applicationId));
  return body.applicant;
}

export async function refreshResumeUrl(applicationId: string): Promise<ResumeUrl> {
  return request<ResumeUrl>(`${applicantPath(applicationId)}/resume-url`);
}

export async function listStages(): Promise<Stage[]> {
  const body = await request<{ stages: Stage[] }>('/employer/stages');
  return body.stages;
}

export async function listArchiveReasons(): Promise<ArchiveReason[]> {
  const body = await request<{ reasons: ArchiveReason[] }>('/employer/archive-reasons');
  return body.reasons;
}

export async function moveApplicant(
  applicationId: string,
  input: { stageId: string; note?: string },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/move`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function archiveApplicant(
  applicationId: string,
  input: { reasonId: string; note?: string; skipEmail?: boolean },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/archive`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function unarchiveApplicant(
  applicationId: string,
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/unarchive`, { method: 'POST' });
}

/** An application's notes, newest first (C3). Empty array when there are none. */
export async function listApplicantNotes(applicationId: string): Promise<ApplicantNote[]> {
  const body = await request<{ notes: ApplicantNote[] }>(`${applicantPath(applicationId)}/notes`);
  return body.notes;
}

/**
 * Append one note (C3). Throws EmployerApplicantsApiError with code INVALID_NOTE_BODY
 * when the server rejects the body (empty / >4000 chars / not plain text).
 */
export async function createApplicantNote(
  applicationId: string,
  input: { body: string; mentionedUserIds?: string[] },
): Promise<ApplicantNote> {
  const body = await request<{ note: ApplicantNote }>(`${applicantPath(applicationId)}/notes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.note;
}

// ─── Erasure + export (DPDP) ─────────────────────────────────────────

// ── LeetCode ─────────────────────────────────────────────────────────────────

/**
 * Attach a LeetCode record to this application by username.
 *
 * Overwrites whatever was there — including the snapshot from the apply form.
 * A 404 (LEETCODE_USER_NOT_FOUND) means the username is wrong, which is the one
 * error on this control the recruiter can fix.
 */
export async function lookupApplicantLeetCode(
  applicationId: string, username: string,
): Promise<LeetCodeProfile> {
  const body = await request<{ leetcode: LeetCodeProfile }>(
    `${applicantPath(applicationId)}/leetcode`,
    { method: 'PUT', body: JSON.stringify({ username }) },
  );
  return body.leetcode;
}

/** Remove it from THIS application. A connected seeker's own record is untouched. */
export async function clearApplicantLeetCode(applicationId: string): Promise<void> {
  await request<{ cleared: true }>(`${applicantPath(applicationId)}/leetcode`, { method: 'DELETE' });
}

/**
 * Look up a GitHub username and attach it to THIS application. Overwrites any
 * snapshot already there — the employer named a specific account.
 */
export async function lookupApplicantGitHub(
  applicationId: string, username: string,
): Promise<GitHubProfile> {
  const body = await request<{ github: GitHubProfile }>(
    `${applicantPath(applicationId)}/github`,
    { method: 'PUT', body: JSON.stringify({ username }) },
  );
  return body.github;
}

/** Remove it from THIS application. A connected seeker's own record is untouched. */
export async function clearApplicantGitHub(applicationId: string): Promise<void> {
  await request<{ cleared: true }>(`${applicantPath(applicationId)}/github`, { method: 'DELETE' });
}
