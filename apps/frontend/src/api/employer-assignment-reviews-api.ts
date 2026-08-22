// FILE: src/api/employer-assignment-reviews-api.ts
// Typed client for /api/employer/assignment-reviews. A sibling of
// employer-applicants-api.ts rather than an addition to it: reviews are their own
// resource with their own conflict semantics, and this module needs an error class
// that carries a parsed body, which the applicants client deliberately does not.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.

import { apiUrl } from '../lib/api-base';
import type { AssignmentReview } from '../types/employer-applicants';

/** Who holds the review that won a write race. Either field may be null. */
export interface ConflictingReviewer {
  name: string | null;
  email: string | null;
}

/**
 * Carries the parsed response body, which the applicants error class does not need.
 *
 * A 409 from PUT is not a failure to report — it is a full payload the UI is built
 * around: `currentReview` is the review that won, and `conflictingReviewer` says who
 * wrote it. The backend responds this way specifically so the losing reviewer can
 * read what their colleague actually wrote before deciding whether to override it.
 * Reducing that to a toast would throw the whole design away.
 */
export class EmployerAssignmentReviewsApiError extends Error {
  status: number;
  code: string | null;
  body: Record<string, unknown>;

  constructor(status: number, code: string | null, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EmployerAssignmentReviewsApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }

  /** The review that won the race, on a 409. Null for every other error. */
  get currentReview(): AssignmentReview | null {
    const raw = this.body?.currentReview;
    return raw && typeof raw === 'object' ? (raw as AssignmentReview) : null;
  }

  get conflictingReviewer(): ConflictingReviewer | null {
    const raw = this.body?.conflictingReviewer;
    if (!raw || typeof raw !== 'object') return null;
    const entry = raw as { name?: unknown; email?: unknown };
    return {
      name: typeof entry.name === 'string' ? entry.name : null,
      email: typeof entry.email === 'string' ? entry.email : null,
    };
  }

  get isConflict(): boolean {
    return this.status === 409 && this.code === 'REVIEW_CONFLICT';
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
    throw new EmployerAssignmentReviewsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
      body ?? {},
    );
  }
  return body as T;
}

const reviewPath = (submissionId: string) => `/employer/assignment-reviews/${encodeURIComponent(submissionId)}`;

export interface ReviewInput {
  overallScore: number;
  passesBar: boolean;
  reviewNotesMarkdown: string;
  /**
   * The reviewedAt the caller believes it is writing against — the optimistic-lock
   * version. Omit (or null) to mean "I believe there is no review yet". After a 409
   * this is the reviewedAt from the conflict body: echoing it back IS the deliberate
   * override, which is why there is no force flag to get wrong.
   */
  expectedReviewedAt?: string | null;
}

/** The stored review for a submission, or null when nobody has reviewed it. */
export async function getAssignmentReview(submissionId: string): Promise<AssignmentReview | null> {
  const body = await request<{ review: AssignmentReview | null }>(reviewPath(submissionId));
  return body.review;
}

/** Create or replace a review. Throws with status 409 + body on a write race. */
export async function submitAssignmentReview(
  submissionId: string, input: ReviewInput,
): Promise<AssignmentReview> {
  const body = await request<{ review: AssignmentReview }>(reviewPath(submissionId), {
    method: 'PUT',
    body: JSON.stringify({
      overallScore: input.overallScore,
      passesBar: input.passesBar,
      reviewNotesMarkdown: input.reviewNotesMarkdown,
      // Always sent, explicitly null when absent: the backend treats a missing key
      // and an explicit null identically, and being explicit keeps the intent
      // readable in a network log.
      expectedReviewedAt: input.expectedReviewedAt ?? null,
    }),
  });
  return body.review;
}

export interface AssignmentFileUrl {
  url: string;
  expiresAt: string;
}

/**
 * Mint a signed download URL for one submitted file.
 *
 * CALLED ON CLICK, NEVER ON MOUNT. The token lives ~15 minutes, and the whole point
 * of this panel is that someone reads a take-home before acting on it — which takes
 * longer than that. A URL minted when the panel opened would 401 for exactly the
 * reviewer who did the job properly. Throws 410 FILES_DELETED once retention has
 * removed the bytes.
 */
export async function getAssignmentFileDownloadUrl(
  submissionId: string, fileId: string,
): Promise<AssignmentFileUrl> {
  return request<AssignmentFileUrl>(
    `${reviewPath(submissionId)}/files/${encodeURIComponent(fileId)}/download-url`,
  );
}
