// FILE: src/api/public-interviews-api.ts
// Client-side calls for the PUBLIC booking page. Unauthenticated — no
// credentials are sent; the booking token in the path is the only credential.
// Non-2xx throws PublicInterviewsApiError with the backend's status + code
// (these routes envelope errors as { error: { code, message } }).

import { apiUrl } from '../lib/api-base';
import type {
  CandidateBookingPage, CandidateBookedInterview, PublicInterviewErrorBody,
} from '../types/public-interview';

export class PublicInterviewsApiError extends Error {
  status: number;
  code: string | null;
  /** Present on 410 responses only — who the candidate should contact. */
  companyName: string | null;

  constructor(status: number, code: string | null, message: string, companyName: string | null = null) {
    super(message);
    this.name = 'PublicInterviewsApiError';
    this.status = status;
    this.code = code;
    this.companyName = companyName;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorBody = body as PublicInterviewErrorBody;
    throw new PublicInterviewsApiError(
      response.status,
      errorBody?.error?.code ?? null,
      errorBody?.error?.message ?? `Request failed (${response.status})`,
      errorBody?.error?.companyName ?? null,
    );
  }
  return body as T;
}

export async function fetchBookingPage(bookingToken: string): Promise<CandidateBookingPage> {
  const body = await request<{ data: CandidateBookingPage }>(
    `/public/interviews/${encodeURIComponent(bookingToken)}`,
  );
  return body.data;
}

/** Body shape depends on the interview flow: { slotIndex } for per-candidate
 *  interviews, { timeId } for pool interviews. Exactly one must be given. */
export async function bookInterviewSlot(
  bookingToken: string,
  selection: { slotIndex: number } | { timeId: string },
): Promise<CandidateBookedInterview> {
  const body = await request<{ data: CandidateBookedInterview }>(
    `/public/interviews/${encodeURIComponent(bookingToken)}/book`,
    { method: 'POST', body: JSON.stringify(selection) },
  );
  return body.data;
}
