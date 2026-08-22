// FILE: src/api/employer-interviews-api.ts
// Typed client for the employer interview-scheduling endpoints. Mirrors
// employer-applicants-api: credentials:'include' attaches the employer cookie,
// and any non-2xx throws EmployerInterviewsApiError carrying the backend's
// status + code — the UI branches on code (e.g. INTERVIEW_ALREADY_ACTIVE).

import { apiUrl } from '../lib/api-base';
import type {
  Interview, ProposeInterviewInput, InterviewRecommendation,
  InterviewFeedbackResponse, InterviewNoShowResponse,
} from '../types/employer-interviews';

export class EmployerInterviewsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerInterviewsApiError';
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
    throw new EmployerInterviewsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

/**
 * Propose interview slots for one application. Throws with code
 * INTERVIEW_ALREADY_ACTIVE (409) when one is already proposed/scheduled, and
 * TOO_FEW_SLOTS / TOO_MANY_SLOTS / INVALID_MEETING_LOCATION / INVALID_DURATION
 * (400) on validation failures the UI failed to pre-empt.
 */
export async function proposeInterview(
  applicationId: string,
  input: ProposeInterviewInput,
): Promise<Interview> {
  const body = await request<{ data: Interview }>(
    `/employer/applicants/${encodeURIComponent(applicationId)}/interviews`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return body.data;
}

export async function listInterviews(applicationId: string): Promise<Interview[]> {
  const body = await request<{ data: Interview[] }>(
    `/employer/applicants/${encodeURIComponent(applicationId)}/interviews`,
  );
  return body.data;
}

export async function rescheduleInterview(
  interviewId: string,
  input: { proposedSlots: ProposeInterviewInput['proposedSlots'] },
): Promise<Interview> {
  const body = await request<{ data: Interview }>(
    `/employer/interviews/${encodeURIComponent(interviewId)}/reschedule`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return body.data;
}

/** Record the interviewer's verdict on a past scheduled interview. Throws
 *  INTERVIEW_NOT_YET (400) when the interview has not started yet. */
export async function completeInterview(
  interviewId: string,
  input: { recommendation: InterviewRecommendation; feedbackText: string },
): Promise<InterviewFeedbackResponse> {
  const body = await request<{ data: InterviewFeedbackResponse }>(
    `/employer/interviews/${encodeURIComponent(interviewId)}/complete`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return body.data;
}

/** Flag a past scheduled interview as a candidate no-show (pool time recycles). */
export async function markNoShow(
  interviewId: string,
  input: { note?: string } = {},
): Promise<InterviewNoShowResponse> {
  const body = await request<{ data: InterviewNoShowResponse }>(
    `/employer/interviews/${encodeURIComponent(interviewId)}/no-show`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return body.data;
}

export async function cancelInterview(
  interviewId: string,
  input: { cancelReason: string },
): Promise<Interview> {
  const body = await request<{ data: Interview }>(
    `/employer/interviews/${encodeURIComponent(interviewId)}/cancel`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  return body.data;
}
