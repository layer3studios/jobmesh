// FILE: src/api/employer-discover-api.ts
// The Discover tab's three calls. Shares the employer applicant transport so the
// cookie handling and the typed error are identical across employer surfaces.

import { request } from './employer-applicants-request';
import type { DiscoverCandidate, DiscoverReviewResult } from '../types/employer-discover';

const base = (postingId: string) => `/employer/postings/${encodeURIComponent(postingId)}/discover`;

/** The ranked suggestions. Server-cached for 6 hours unless forced. */
export async function fetchDiscoverCandidates(
  postingId: string, { refresh = false } = {},
): Promise<DiscoverCandidate[]> {
  const body = await request<{ candidates: DiscoverCandidate[] }>(
    `${base(postingId)}${refresh ? '?refresh=true' : ''}`,
  );
  return body.candidates;
}

/**
 * Buy the AI micro-review for ONE candidate. Called as a card comes into view,
 * so the tab stays instant and unread candidates cost nothing.
 */
export function reviewDiscoverCandidate(
  postingId: string, seekerUserId: string,
): Promise<DiscoverReviewResult> {
  return request<DiscoverReviewResult>(
    `${base(postingId)}/${encodeURIComponent(seekerUserId)}/review`, { method: 'POST' },
  );
}

/** Create a real application for this candidate and notify them. */
export function addDiscoverCandidateToPipeline(
  postingId: string, seekerUserId: string,
): Promise<{ applicationId: string; notified: boolean }> {
  return request<{ applicationId: string; notified: boolean }>(
    `${base(postingId)}/${encodeURIComponent(seekerUserId)}/add-to-pipeline`, { method: 'POST' },
  );
}

export { EmployerApplicantsApiError } from './employer-applicants-request';
