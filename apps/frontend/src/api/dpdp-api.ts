// FILE: src/api/dpdp-api.ts
// Typed client for the DPDP endpoints (/api/dpdp). Sends the seeker auth cookie
// (except the public notice-version), reads the typed envelope, throws DpdpApiError
// (status + code) on any non-2xx. Consent UI calls only this module.
// Cookie handling (client): credentials:'include' → the browser attaches tj_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  Consent, RightsRequest, NoticeVersionInfo, ConsentPurpose, ConsentMethod, RightsRequestType,
} from '../types/dpdp';

export class DpdpApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'DpdpApiError';
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
    throw new DpdpApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export interface GrantConsentInput {
  purpose: ConsentPurpose;
  dataItems: string[];
  noticeVersion: string;
  method: ConsentMethod;
  crossBorderTransfer?: boolean;
}

export interface SubmitRightsRequestInput {
  requestType: RightsRequestType;
  description: string;
}

export async function fetchNoticeVersion(): Promise<NoticeVersionInfo> {
  return request<NoticeVersionInfo>('/dpdp/notice-version');
}

export async function listConsents(
  { includeWithdrawn = false }: { includeWithdrawn?: boolean } = {},
): Promise<Consent[]> {
  const query = includeWithdrawn ? '?includeWithdrawn=true' : '';
  const body = await request<{ consents: Consent[] }>(`/dpdp/consents${query}`);
  return body.consents;
}

export async function grantConsent(input: GrantConsentInput): Promise<Consent> {
  const body = await request<{ consent: Consent }>('/dpdp/consents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.consent;
}

export async function withdrawConsent(consentId: string): Promise<Consent> {
  const body = await request<{ consent: Consent }>(
    `/dpdp/consents/${encodeURIComponent(consentId)}/withdraw`,
    { method: 'POST' },
  );
  return body.consent;
}

export async function listRightsRequests(): Promise<RightsRequest[]> {
  const body = await request<{ requests: RightsRequest[] }>('/dpdp/rights-requests');
  return body.requests;
}

export async function submitRightsRequest(input: SubmitRightsRequestInput): Promise<RightsRequest> {
  const body = await request<{ request: RightsRequest }>('/dpdp/rights-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.request;
}

// ─── Candidate self-service data export (public, no account) ──────────
// These two hit /api/public/dpdp rather than /api/dpdp: the person asking has no
// JobMesh account, and the emailed one-time token is the only credential involved.

/**
 * Ask for a download link. ALWAYS resolves with the same message whether or not the
 * company holds data for that email — the endpoint refuses to be an oracle for
 * "has this person applied there", and the UI must not invent a distinction the
 * server deliberately withheld.
 */
export async function requestMyDataExport(
  input: { email: string; companySlug: string },
): Promise<{ message: string }> {
  return request<{ message: string }>('/public/dpdp/export', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** The one-time download URL. The browser navigates to it; the server names the file. */
export function myDataExportDownloadUrl(token: string): string {
  return apiUrl(`/public/dpdp/export/download?token=${encodeURIComponent(token)}`);
}
