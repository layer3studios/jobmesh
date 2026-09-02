// FILE: src/types/admin-company-health.ts
// Shape contract for GET /api/admin/companies-health. Mirrors the backend's
// company-health-service output exactly — no field the backend does not send.

export type CompanyHealthStatus = 'active' | 'quiet' | 'dormant';

export interface CompanyHealthRow {
  companyId: string;
  name: string | null;
  slug: string | null;
  createdAt: string | null;
  memberCount: number;
  livePostingCount: number;
  totalApplicants: number;
  applicantsLast30d: number;
  /** Newest lastLoginAt across the company's members; null if none ever logged in. */
  lastMemberLoginAt: string | null;
  lastPostingAt: string | null;
  lastApplicationAt: string | null;
  /** The newer of lastPostingAt and lastApplicationAt; drives `status`. */
  lastActivityAt: string | null;
  status: CompanyHealthStatus;
}
