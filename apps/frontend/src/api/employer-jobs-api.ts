// FILE: src/api/employer-jobs-api.ts
// Typed client for the native posting endpoints (/api/employer/jobs). Sends the
// employer auth cookie, reads the { posting } / { postings } body, throws
// EmployerJobsApiError (status + code) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  Posting, PostingStatus, PostingCreateInput, PostingPatch,
} from '../types/employer-jobs';
import type { EmployerAssignment } from '../types/employer-assignments';

export class EmployerJobsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerJobsApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerJobsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

const postingPath = (postingId: string) => `/employer/jobs/${encodeURIComponent(postingId)}`;

// Omits ?status= entirely when status is undefined ('all' tab) — the backend
// rejects status=all with INVALID_STATUS (R3).
export async function listEmployerPostings(
  { status }: { status?: PostingStatus } = {},
): Promise<Posting[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const body = await request<{ postings: Posting[] }>(`/employer/jobs${query}`);
  return body.postings;
}

export async function getEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(postingPath(postingId));
  return body.posting;
}

export async function createEmployerPosting(input: PostingCreateInput): Promise<Posting> {
  const body = await request<{ posting: Posting }>('/employer/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.posting;
}

export async function updateEmployerPosting(postingId: string, patch: PostingPatch): Promise<Posting> {
  const body = await request<{ posting: Posting }>(postingPath(postingId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.posting;
}

export async function closeEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(`${postingPath(postingId)}/close`, { method: 'POST' });
  return body.posting;
}

/**
 * Permanently remove a draft posting. Owner+ and draft-with-no-applicants only —
 * the backend re-checks both, so a stale list never deletes something it shouldn't.
 * Throws EmployerJobsApiError with NOT_A_DRAFT or HAS_APPLICANTS when refused.
 */
export async function deleteEmployerPosting(postingId: string): Promise<void> {
  await request<{ deleted: boolean }>(postingPath(postingId), { method: 'DELETE' });
}

export async function reopenEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(`${postingPath(postingId)}/reopen`, { method: 'POST' });
  return body.posting;
}

/** Result of the "Position filled" quick action. */
export interface FillPostingResult {
  posting: Posting | null;
  closedCount: number;
  archivedCount: number;
  /** Applications the bulk archive could not process; the posting closed regardless. */
  failedCount: number;
}

/**
 * Close the posting AND archive everyone still waiting on it as "Position filled".
 * One call, two effects — see posting-fill-service.js on the backend.
 */
export async function fillEmployerPosting(postingId: string): Promise<FillPostingResult> {
  return request<FillPostingResult>(`${postingPath(postingId)}/fill`, { method: 'POST' });
}

// ── Assignment attachment (Chunk 3 backend / 8b UI) ─────────────────────────
// The attachment lives on its OWN endpoint, not in the posting create/patch body:
// employer-postings-routes.js rejects an unknown `assignmentId` key on PATCH
// /jobs/:id with UNKNOWN_FIELD. Attaching is therefore always a second call.

export interface PostingAssignmentContext {
  /** The attached assignment, or null. Included even when ARCHIVED — a posting
   *  keeps working with a task archived after it was attached. */
  assignment: EmployerAssignment | null;
  applicationCount: number;
}

export interface SetPostingAssignmentResult {
  posting: Posting;
  /** Read before the write, so a swap is distinguishable from a first attach. */
  previousAssignmentId: string | null;
  applicationCount: number;
}

/** GET the attached assignment + how many people have applied. Interviewer+. */
export async function getPostingAssignment(postingId: string): Promise<PostingAssignmentContext> {
  return request<PostingAssignmentContext>(`${postingPath(postingId)}/assignment`);
}

/** Attach, swap, or detach (assignmentId null). Member+. */
export async function setPostingAssignment(
  postingId: string, assignmentId: string | null,
): Promise<SetPostingAssignmentResult> {
  // An explicit null means DETACH and is valid; omitting the key is a different
  // mistake the backend answers with MISSING_ASSIGNMENT_ID. Always send it.
  return request<SetPostingAssignmentResult>(`${postingPath(postingId)}/assignment`, {
    method: 'PATCH',
    body: JSON.stringify({ assignmentId }),
  });
}
