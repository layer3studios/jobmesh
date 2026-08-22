// FILE: src/types/employer-interviews.ts
// Shapes for employer-side interview scheduling. Mirrors the backend's PUBLIC
// interview projection — bookingToken, calendarUid and companyId are never sent
// by the backend, so they deliberately do not exist on these types.

export type InterviewStatus = 'proposed' | 'scheduled' | 'cancelled' | 'completed' | 'no_show';

export type InterviewMode = 'video' | 'phone' | 'in_person';

/** Phone interviews: who dials whom. Null for video / in-person. */
export type PhoneCallDirection = 'we_call' | 'candidate_calls';

/** One proposed time: UTC ISO start + duration. */
export interface InterviewSlot {
  startAtUtc: string;
  durationMinutes: number;
}

/** The interviewer's post-interview verdict (backend enum, Part 1). */
export type InterviewRecommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

/** POST /interviews/:id/complete result. suggestedStage is a stage id. */
export interface InterviewFeedbackResponse {
  interview: Interview;
  nextAction: 'advance' | 'archive';
  suggestedStage?: string | null;
  suggestedReason?: string;
}

/** POST /interviews/:id/no-show result. */
export interface InterviewNoShowResponse {
  interview: Interview;
  nextAction: 'flag';
  message?: string;
}

export interface Interview {
  id: string;
  /** 'pool' when the candidate picks from the posting's availability pool.
   *  Optional: the backend projection may not send it yet — pool interviews
   *  are also identifiable by an empty proposedSlots. */
  source?: 'pool' | 'manual' | null;
  applicationId: string | null;
  postingId: string | null;
  contactId: string | null;
  status: InterviewStatus;
  proposedSlots: InterviewSlot[];
  selectedSlotIndex: number | null;
  startAtUtc: string | null;
  timezoneId: string;
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  calendarSequence: number;
  interviewerEmployerUserIds: string[];
  createdByEmployerUserId: string | null;
  bookingTokenExpiresAt: string;
  bookedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  // Post-interview outcome fields. Optional: the backend's public projection
  // may not send them yet — the UI degrades to a plain status badge.
  recommendation?: InterviewRecommendation | null;
  feedbackText?: string | null;
  completedAt?: string | null;
  noShowAt?: string | null;
  // Type-aware details (phone / in-person). Optional: the public projection
  // may not send them yet — the UI degrades to the generic display.
  phoneNumber?: string | null;
  phoneCallDirection?: PhoneCallDirection | null;
  arrivalInstructions?: string | null;
}

/** Posting-level interview configuration for pool scheduling. */
export interface InterviewDefaults {
  meetingUrl: string | null;
  durationMinutes: number;
  mode: InterviewMode;
  /** The address for in-person interviews. */
  locationText: string | null;
  timezoneId: string;
  /** The interviewer's number — phone mode only. */
  phoneNumber?: string | null;
  phoneCallDirection?: PhoneCallDirection | null;
  /** "Floor, ask for X at reception, parking…" — in-person mode only. */
  arrivalInstructions?: string | null;
}

export type InterviewTimeStatus = 'available' | 'booked' | 'cancelled' | 'past';

/** One bookable pool time (employer view — snapshots included). */
export interface InterviewTime {
  id: string;
  startAtUtc: string;
  durationMinutes: number;
  timezoneId: string;
  status: InterviewTimeStatus;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  bookedByApplicationId: string | null;
  bookedAt: string | null;
}

export interface InterviewTimeCount {
  availableCount: number;
}

export interface ProposeInterviewInput {
  proposedSlots: InterviewSlot[];
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  phoneNumber?: string | null;
  phoneCallDirection?: PhoneCallDirection | null;
  arrivalInstructions?: string | null;
  interviewerEmployerUserIds: string[];
  timezoneId: string;
}
