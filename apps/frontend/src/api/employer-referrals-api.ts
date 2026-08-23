// FILE: src/api/employer-referrals-api.ts
// Typed client for employee referral links (/api/employer/postings/:id/referral-*).
// Sends the employer auth cookie; throws EmployerReferralsApiError (status + code)
// on any non-2xx. Same shape as employer-jobs-api.ts.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.

import { apiUrl } from '../lib/api-base';

export class EmployerReferralsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerReferralsApiError';
    this.status = status;
    this.code = code;
  }
}

/** One teammate's shareable link for one posting, with its running totals. */
export interface ReferralLink {
  id: string;
  token: string;
  postingId: string | null;
  employerUserId: string | null;
  /** Cached at share time, so a link outlives the person's session. */
  referrerName: string | null;
  clickCount: number;
  applicationCount: number;
  isActive: boolean;
  createdAt: string;
  /** Absolute, ready to paste. Built server-side from the apply host (§17). */
  referralUrl: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerReferralsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

/**
 * Create this teammate's link for the posting, or return the one they already have.
 * Idempotent by design: pressing Share twice must not mint a second token or reset
 * the stats on a link already sitting in someone's inbox.
 */
export async function createReferralLink(postingId: string): Promise<ReferralLink> {
  const body = await request<{ referralLink: ReferralLink }>(
    `/employer/postings/${encodeURIComponent(postingId)}/referral-link`,
    { method: 'POST' },
  );
  return body.referralLink;
}

/** Every teammate's link for this posting. Owner+ only — the backend 403s below that. */
export async function listReferralLinks(postingId: string): Promise<ReferralLink[]> {
  const body = await request<{ referralLinks: ReferralLink[] }>(
    `/employer/postings/${encodeURIComponent(postingId)}/referral-links`,
  );
  return body.referralLinks;
}

/** Deactivate a link. Owner+ only. Existing attributions survive. */
export async function deactivateReferralLink(linkId: string): Promise<ReferralLink> {
  const body = await request<{ referralLink: ReferralLink }>(
    `/employer/referral-links/${encodeURIComponent(linkId)}`,
    { method: 'DELETE' },
  );
  return body.referralLink;
}
