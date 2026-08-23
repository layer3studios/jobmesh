// FILE: src/types/employer-applicant-library.ts
// The per-company libraries a recruiter picks from — pipeline stages, archive
// reasons, candidate tags and saved views — plus the facet counts behind the
// filter sidebar. Split out of employer-applicants.ts (section 2).


export interface ArchiveReason {
  id: string;
  text: string;
  type: 'hired' | 'non-hired';
  status: string;
}

/** Filter facets scoped to one posting's applicant pool (Chunk 1). */
export interface ApplicantFacets {
  skills: Array<{ skill: string; count: number }>;
  cities: Array<{ city: string; count: number }>;
}

/**
 * One tag in the company's shared library. Names are canonical — lowercase and
 * trimmed by the backend — so "Referral" and "referral" are the same tag.
 */
export interface CandidateTag {
  id: string;
  name: string;
  createdAt: string;
}

/** A recruiter's saved filter combination for one posting (per-user, not shared). */
export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
