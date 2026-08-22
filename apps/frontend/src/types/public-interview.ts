// FILE: src/types/public-interview.ts
// The candidate-facing booking payload. Mirrors GET /api/public/interviews/:token
// exactly — it deliberately carries no company id, application id, contact id,
// booking token or meeting link, so the types must not claim they exist.

export type PublicInterviewStatus = 'proposed' | 'scheduled' | 'cancelled' | 'completed' | 'no_show';

export type PublicInterviewMode = 'video' | 'phone' | 'in_person';

export interface PublicInterviewSlot {
  startAtUtc: string;
  durationMinutes: number;
}

/** One pool time as the public GET exposes it — id + when, nothing else. */
export interface PublicPoolTime {
  id: string;
  startAtUtc: string;
  durationMinutes: number;
  timezoneId: string;
}

/** GET payload for the booking page. */
export interface CandidateBookingPage {
  id: string;
  status: PublicInterviewStatus;
  proposedSlots: PublicInterviewSlot[];
  selectedSlotIndex: number | null;
  startAtUtc: string | null;
  timezoneId: string;
  durationMinutes: number;
  mode: PublicInterviewMode;
  /** Present for in_person only — shown BEFORE slot choice so travel can be judged. */
  locationText: string | null;
  companyName: string | null;
  postingTitle: string | null;
  companyLogoUrl: string | null;
  /** ISO string — lets the page state a real expiry date. */
  bookingTokenExpiresAt: string;
  /** Pool interviews only: live bookable times (proposedSlots is empty then).
   *  The booking page renders whichever of the two is non-empty. */
  times?: PublicPoolTime[];
  /** Shown on the cancelled state when the employer gave one. */
  cancelReason: string | null;
  // Type-aware details. Optional: the backend candidate projection may not
  // expose them yet — the confirmed state degrades to the generic copy.
  phoneCallDirection?: 'we_call' | 'candidate_calls' | null;
  /** The interviewer's number (candidate_calls mode, post-booking only). */
  phoneNumber?: string | null;
  arrivalInstructions?: string | null;
}

/** The { error } envelope the public interview routes return on non-2xx.
 *  companyName rides along ONLY on the 410 (expired) response. */
export interface PublicInterviewErrorBody {
  error?: {
    code?: string;
    message?: string;
    companyName?: string | null;
  };
}

/** POST /book response — the candidate projection without the page extras. */
export type CandidateBookedInterview = Omit<CandidateBookingPage, 'companyName' | 'postingTitle' | 'companyLogoUrl'>;
