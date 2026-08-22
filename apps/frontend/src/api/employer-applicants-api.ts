// FILE: src/api/employer-applicants-api.ts
// Typed client for the employer applicant pipeline endpoints. Sends the employer
// auth cookie and throws EmployerApplicantsApiError (status + code) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  Applicant, ApplicantDetail, ApplicantNote, ResumeUrl, Stage, ArchiveReason,
  ApplicantSort, BulkArchiveResult, RescoreResult, ApplicantFacets, SavedView,
  AssignmentStats, AnonymizePreview, AnonymizeResult, InterviewFeedbackSummary,
} from '../types/employer-applicants';

export class EmployerApplicantsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApplicantsApiError';
    this.status = status;
    this.code = code;
  }
}

// Friendly copy for role-permission 403s the UI didn't pre-gate (Chunk 5, item 17).
// Normalised here in the shared wrapper — no separate interceptor — so every surface
// that surfaces error.message shows the same explanation instead of a raw backend code.
export const ROLE_FORBIDDEN_MESSAGE = "You don't have permission to do that.";

function isRolePermissionError(status: number, code: string | null): boolean {
  if (status !== 403) return false;
  return Boolean(code && (code.startsWith('ROLE_') || code.includes('FORBIDDEN')));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = body?.code ?? null;
    const message = isRolePermissionError(response.status, code)
      ? ROLE_FORBIDDEN_MESSAGE
      : body?.error || `Request failed (${response.status})`;
    throw new EmployerApplicantsApiError(response.status, code, message);
  }
  return body as T;
}

const applicantPath = (applicationId: string) => `/employer/applicants/${encodeURIComponent(applicationId)}`;

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

const savedViewsPath = (postingId: string) =>
  `/employer/jobs/${encodeURIComponent(postingId)}/saved-views`;

const savedViewsCache = new Map<string, SavedView[]>();

export async function listSavedViews(postingId: string, { fresh = false } = {}): Promise<SavedView[]> {
  if (!fresh && savedViewsCache.has(postingId)) return savedViewsCache.get(postingId)!;
  const body = await request<{ views: SavedView[] }>(savedViewsPath(postingId));
  savedViewsCache.set(postingId, body.views);
  return body.views;
}

/** Throws EmployerApplicantsApiError with status 409 when the 10-view cap is hit. */
export async function createSavedView(
  postingId: string,
  input: { name: string; filters: Record<string, unknown> },
): Promise<SavedView> {
  const body = await request<{ view: SavedView }>(savedViewsPath(postingId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
  savedViewsCache.set(postingId, [body.view, ...(savedViewsCache.get(postingId) ?? [])]);
  return body.view;
}

export async function updateSavedView(
  postingId: string,
  viewId: string,
  input: { name?: string; filters?: Record<string, unknown> },
): Promise<SavedView> {
  const body = await request<{ view: SavedView }>(
    `${savedViewsPath(postingId)}/${encodeURIComponent(viewId)}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  savedViewsCache.set(
    postingId,
    (savedViewsCache.get(postingId) ?? []).map((view) => (view.id === viewId ? body.view : view)),
  );
  return body.view;
}

export async function deleteSavedView(postingId: string, viewId: string): Promise<void> {
  await request<{ message: string }>(
    `${savedViewsPath(postingId)}/${encodeURIComponent(viewId)}`,
    { method: 'DELETE' },
  );
  savedViewsCache.set(
    postingId,
    (savedViewsCache.get(postingId) ?? []).filter((view) => view.id !== viewId),
  );
}

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

/**
 * Requeue AI scoring for one applicant. Resolves on both 202 (a job was reset or
 * inserted) and 200 (one was already in flight — `rescored: false`); the caller
 * distinguishes them via the returned flag rather than the status code.
 */
export async function rescoreApplicant(applicationId: string): Promise<RescoreResult> {
  return request<RescoreResult>(`${applicantPath(applicationId)}/rescore`, { method: 'POST' });
}

// ─── Erasure + export (DPDP) ─────────────────────────────────────────

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
