// FILE: src/components/shared/consent-copy.ts
// Shared DPDP display constants: human-readable purpose labels + the current
// notice version/grievance contact. Kept in one place so ConsentGate,
// ConsentManager, and the Privacy page never drift apart.

import type { ConsentPurpose } from '@/types/dpdp';

export const NOTICE_VERSION = 'v1.0-2026-07';
export const GRIEVANCE_EMAIL = 'privacy@jobmesh.in';

export const PURPOSE_LABELS: Record<ConsentPurpose, string> = {
  profile_storage: 'storing your profile',
  resume_parsing: 'parsing your resume',
  resume_matching: 'matching you with jobs',
  apply_to_posting: 'sharing your application with this employer',
  employer_view_profile: 'making your profile visible to employers',
  recruiter_outreach: 'letting recruiters contact you',
  marketing: 'sending you job alerts and updates',
};
