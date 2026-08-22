// FILE: src/types/dpdp.ts
// DPDP types — mirror the backend public shapes (4.5A toPublicConsent /
// toPublicRightsRequest / notice-version). Shared across seeker + public
// audiences; never audience-bound.

export type ConsentPurpose =
  | 'profile_storage' | 'resume_parsing' | 'resume_matching'
  | 'apply_to_posting' | 'employer_view_profile'
  | 'recruiter_outreach' | 'marketing';

export type ConsentMethod = 'checkbox' | 'signup' | 'application' | 'admin';
export type RightsRequestType = 'access' | 'correction' | 'erasure' | 'grievance';
export type RightsRequestStatus = 'submitted' | 'in_progress' | 'fulfilled' | 'rejected';

export interface Consent {
  id: string;
  purpose: ConsentPurpose;
  dataItems: string[];
  grantedAt: string;
  withdrawnAt: string | null;
  noticeVersion: string;
  method: ConsentMethod;
  crossBorderTransfer: boolean;
  createdAt: string;
}

export interface RightsRequest {
  id: string;
  requestType: RightsRequestType;
  contactEmail: string;
  description: string;
  status: RightsRequestStatus;
  submittedAt: string;
  dueBy: string;
  fulfilledAt: string | null;
  createdAt: string;
}

export interface NoticeVersionInfo {
  version: string;
  policyUrl: string;
  grievanceEmail: string;
  crossBorderEnabled: boolean;
}
