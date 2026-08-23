// FILE: src/api/seeker-api.ts
// Typed client for the seeker resume + profile endpoints. Sends the seeker auth
// cookie (credentials:'include'), reads the typed envelope, throws SeekerApiError
// (status + code) on non-2xx. Resume/profile UI calls only this module.
// Cookie handling (client): credentials:'include' → the browser attaches tj_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  ParsedProfile, ResumeParseJob, ResumeUploadResult,
  ResumeReview, MatchCount, SalaryBenchmark,
  LeetCodeProfile, LeetCodeConnection,
  GitHubProfile, GitHubConnection,
} from '../types/seeker-profile';

// Raw backend envelope for /upload + /text: either a queued job or the dedup
// fast-path ({ profile, isUnchanged: true, jobId: null }). normalized below (D1).
type RawUploadResponse = {
  jobId?: string | null;
  status?: string;
  profile?: ParsedProfile;
  isUnchanged?: boolean;
};

function normalizeUpload(body: RawUploadResponse): ResumeUploadResult {
  if (body.isUnchanged && body.profile) return { kind: 'unchanged', profile: body.profile };
  return { kind: 'queued', jobId: String(body.jobId) };
}

export class SeekerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'SeekerApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Default the JSON content type whenever there is a body, because express.json()
  // only parses when it sees it — without the header the body is silently dropped
  // and the route reports the resulting `undefined` field as a validation error,
  // which reads like the server rejecting a perfectly good value.
  //
  // FormData is excluded: the browser has to set that header itself so it can add
  // the multipart boundary. `...init` still wins, so an explicit header overrides.
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body && !isFormData ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SeekerApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

/** Upload a resume PDF as multipart/form-data (field name 'resume', R2). */
export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  const form = new FormData();
  form.append('resume', file);
  // No Content-Type header — the browser sets the multipart boundary.
  const body = await request<RawUploadResponse>('/seeker/resume/upload', { method: 'POST', body: form });
  return normalizeUpload(body);
}

/** Parse a pasted resume-text fallback. */
export async function uploadResumeText(text: string): Promise<ResumeUploadResult> {
  const body = await request<RawUploadResponse>('/seeker/resume/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return normalizeUpload(body);
}

/** Poll one parse job's status. Unwraps the { job } envelope (D2). The optional
 * signal lets the polling hook abort an in-flight request on unmount (R1/R2). */
export async function fetchResumeJob(jobId: string, signal?: AbortSignal): Promise<ResumeParseJob> {
  const body = await request<{ job: ResumeParseJob }>(`/seeker/resume/jobs/${jobId}`, { signal });
  return body.job;
}

/** The caller's parsed profile, or null when not parsed yet. */
export async function fetchProfile(): Promise<ParsedProfile | null> {
  const body = await request<{ profile: ParsedProfile | null }>('/seeker/profile');
  return body.profile ?? null;
}

/** Patch whitelisted profile fields; returns the updated profile. */
export async function patchProfile(patch: Partial<ParsedProfile>): Promise<ParsedProfile> {
  const body = await request<{ profile: ParsedProfile }>('/seeker/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return body.profile;
}

/** The caller's cached resume review, or null when none has run yet (D2). */
export async function fetchResumeReview(signal?: AbortSignal): Promise<ResumeReview | null> {
  const body = await request<{ review: ResumeReview | null }>('/seeker/resume/review', { signal });
  return body.review ?? null;
}

/** Run a fresh review and return it. Propagates SeekerApiError (.code) on failure. */
export async function runResumeReview(signal?: AbortSignal): Promise<ResumeReview> {
  const body = await request<{ review: ResumeReview }>('/seeker/resume/review', { method: 'POST', signal });
  return body.review;
}

/** Live count of postings matching the caller's profile (direct shape). */
export async function fetchMatchCount(signal?: AbortSignal): Promise<MatchCount> {
  return request<MatchCount>('/seeker/market/match-count', { signal });
}

/** Salary benchmark band for the caller's seniority slice (direct shape). */
export async function fetchSalaryBenchmark(signal?: AbortSignal): Promise<SalaryBenchmark> {
  return request<SalaryBenchmark>('/seeker/market/salary-benchmark', { signal });
}

// ── LeetCode ─────────────────────────────────────────────────────────────────

/**
 * Connect an account. The server verifies the username against LeetCode before
 * storing it, so a 404 here means the username is wrong — which is the one error
 * on this form the candidate can actually fix.
 */
export async function connectLeetCode(username: string): Promise<LeetCodeProfile> {
  const body = await request<{ connected: true; data: LeetCodeProfile }>('/seeker/me/leetcode', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
  return body.data;
}

/** The connected account and its last-read stats. `connected: false` when there is none. */
export function getLeetCodeProfile(): Promise<LeetCodeConnection> {
  return request<LeetCodeConnection>('/seeker/me/leetcode');
}

export async function disconnectLeetCode(): Promise<void> {
  await request<{ connected: false }>('/seeker/me/leetcode', { method: 'DELETE' });
}

/** Force a fresh read. Rate limited to once per 5 minutes; a 429 says so. */
export async function refreshLeetCode(): Promise<LeetCodeProfile> {
  const body = await request<{ data: LeetCodeProfile }>('/seeker/me/leetcode/refresh', {
    method: 'POST',
  });
  return body.data;
}

// ── GitHub ───────────────────────────────────────────────────────────────────

/**
 * Connect an account. The server verifies the username against GitHub before
 * storing it, so a 404 here means the username is wrong — which is the one error
 * on this form the candidate can actually fix. A 503 means the integration is off
 * or GitHub is unreachable, neither of which is theirs to solve.
 */
export async function connectGitHub(username: string): Promise<GitHubProfile> {
  const body = await request<{ connected: true; data: GitHubProfile }>('/seeker/me/github', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  });
  return body.data;
}

/** The connected account and its last-read stats. `connected: false` when there is none. */
export function getGitHubProfile(): Promise<GitHubConnection> {
  return request<GitHubConnection>('/seeker/me/github');
}

export async function disconnectGitHub(): Promise<void> {
  await request<{ connected: false }>('/seeker/me/github', { method: 'DELETE' });
}

/** Force a fresh read. Rate limited to once per 5 minutes; a 429 says so. */
export async function refreshGitHub(): Promise<GitHubProfile> {
  const body = await request<{ data: GitHubProfile }>('/seeker/me/github/refresh', {
    method: 'POST',
  });
  return body.data;
}
