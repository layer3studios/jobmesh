// FILE: src/components/apply/apply-form-constants.ts
// The apply form's constants, shared types and one pure formatter.
//
// Split from ApplyFormClient for size (section 2). Nothing here holds state or
// touches the DOM, which is why it can sit outside the island.

import type { ApplyFormData, PublicCompany, PublicJob, PublicAssignment } from '@/types/public-apply';

export const EMPTY: ApplyFormData = {
  firstName: '', lastName: '', email: '', phone: '', coverNote: '',
  consent_dpdp: false, consent_futureOpportunities: false, resume: null,
  source: '', leetcodeUsername: '', githubUsername: '', honeypot: '',
};

// Every major ATS (LinkedIn, Greenhouse, Lever, Ashby) puts the JD on the left and
// keeps the form visible on the right (R1). We opt out of Container size="sm" (640px,
// which wastes ~1280px on desktop) for a wider centred wrapper (P-APPLY.1).
export const APPLY_PAGE_MAX_WIDTH_PIXELS = 1400;
export const APPLY_PAGE_HORIZONTAL_PADDING_PIXELS = 24;
// The two-column breakpoint (900px) and the sticky offset are NOT constants here
// any more — they live in src/styles/apply.css as a real media query. They used to
// be a JS width branch that rendered two different trees, which remounted the form
// (and dropped staged uploads) when a resize crossed the boundary.

// Blur saves are debounced so typing through five fields writes once, not five
// times. The interval is 30s rather than the 60s originally specced: someone can sit
// in a take-home form for hours, and a minute of lost work after a browser crash is
// more than this feature is worth.
export const DRAFT_BLUR_DEBOUNCE_MS = 2000;
export const DRAFT_INTERVAL_MS = 30_000;
// One analytics event per 5 minutes. The saves themselves stay frequent; only the
// telemetry is throttled, so a two-hour session is a handful of events, not 240.
export const DRAFT_EVENT_THROTTLE_MS = 5 * 60 * 1000;

// Indian job postings show salary in lakhs-per-annum with a ₹ prefix (R5). Only render
// when at least one bound is present (P-APPLY.2).
export function formatSalaryLPA(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `₹${min}-${max} LPA`;
  if (min != null) return `₹${min}+ LPA`;
  return `up to ₹${max} LPA`;
}

/** A blocking, non-dismissible outcome that must survive on screen (7b). */
export interface BlockingNotice {
  kind: 'assignment_changed' | 'posting_closed' | 'deadline_passed';
  message: string;
}

export interface ApplyFormClientProps {
  company: PublicCompany;
  job: PublicJob;
  companySlug: string;
  jobSlug: string;
  /** Plain data — drives the form logic (which fields exist, what to submit). */
  assignment?: PublicAssignment | null;
  /**
   * The rendered <AssignmentPreview> element. AssignmentPreview is a Server
   * Component and cannot be passed as a component prop to a client island — it has
   * to arrive already rendered, through this slot, so it stays on the server and
   * ships no markdown JavaScript to the browser. It renders inside the JD column.
   */
  assignmentPreview?: React.ReactNode;
}
