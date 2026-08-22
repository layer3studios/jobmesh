// FILE: src/components/interview/InterviewBookingStates.tsx
// Presentational states for the public booking page (server-renderable; no
// hooks). Shared by the server page and the client island so a post-submit
// state swap renders pixel-identical to a fresh load of the same state.

import type { PublicInterviewMode } from '../../types/public-interview';
import { formatInterviewTime } from '../../utils/format-interview-time';
import { googleMapsUrl } from '../../lib/maps-url';

const MODE_NOUNS: Record<PublicInterviewMode, string> = {
  video: 'video call', phone: 'phone call', in_person: 'in-person interview',
};

/** e.g. "45 minute video call". */
export function describeInterview(mode: PublicInterviewMode, durationMinutes: number): string {
  return `${durationMinutes} minute ${MODE_NOUNS[mode]}`;
}

export function BookingPageHeader({
  companyName, companyLogoUrl, postingTitle,
}: {
  companyName: string | null;
  companyLogoUrl: string | null;
  postingTitle: string | null;
}) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      {companyLogoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={companyLogoUrl} alt="" width={48} height={48} style={{ borderRadius: 10, objectFit: 'contain' }} />
      )}
      {companyName && <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-muted)' }}>{companyName}</p>}
      <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>{postingTitle ?? 'Interview'}</h1>
    </header>
  );
}

/** Type-specific "what happens next" lines for the confirmed state. */
function confirmedModeBlock(
  mode: PublicInterviewMode,
  { locationText, phoneCallDirection, phoneNumber, arrivalInstructions }: {
    locationText: string | null;
    phoneCallDirection?: 'we_call' | 'candidate_calls' | null;
    phoneNumber?: string | null;
    arrivalInstructions?: string | null;
  },
) {
  const line = { margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)' } as const;
  if (mode === 'video') {
    return <p style={line}>You&apos;ll receive a calendar invite with the video call link.</p>;
  }
  if (mode === 'phone') {
    if (phoneCallDirection === 'candidate_calls' && phoneNumber) {
      return <p style={line}>Please call {phoneNumber} at the scheduled time.</p>;
    }
    return <p style={line}>We&apos;ll call you at the scheduled time. Keep your phone available.</p>;
  }
  if (!locationText) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={line}>Location: {locationText}</p>
      {arrivalInstructions && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>{arrivalInstructions}</p>
      )}
      <a
        href={googleMapsUrl(locationText)} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: '0.88rem', color: 'var(--accent)' }}
      >
        Open in Google Maps
      </a>
    </div>
  );
}

export function ConfirmedState({
  startAtUtc, mode, durationMinutes, locationText, isReminder,
  phoneCallDirection, phoneNumber, arrivalInstructions,
}: {
  startAtUtc: string | null;
  mode: PublicInterviewMode;
  durationMinutes: number;
  locationText: string | null;
  isReminder: boolean;
  phoneCallDirection?: 'we_call' | 'candidate_calls' | null;
  phoneNumber?: string | null;
  arrivalInstructions?: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>
        {isReminder ? 'Your interview is already confirmed' : "You're confirmed"} ✓
      </p>
      {startAtUtc && (
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>{formatInterviewTime(startAtUtc)}</p>
      )}
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)' }}>{describeInterview(mode, durationMinutes)}</p>
      {confirmedModeBlock(mode, { locationText, phoneCallDirection, phoneNumber, arrivalInstructions })}
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
        A calendar invitation has been emailed to you — please accept it so the interview lands in your calendar.
      </p>
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
        Need to change the time? Contact the company directly by replying to their email.
      </p>
    </div>
  );
}

export function ExpiredState({ companyName }: { companyName: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>This booking link has expired</h1>
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.55 }}>
        Booking links expire after a while — this is normal. Reply to the invitation email
        {companyName ? ` from ${companyName}` : ''} or contact the company and they can send you a fresh one.
      </p>
    </div>
  );
}

/** Same wording for unknown AND replaced tokens — never reveal which. */
export function InvalidState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>This interview link isn&apos;t valid</h1>
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.55 }}>
        Please check you opened the most recent link from your email. If it still doesn&apos;t work, contact the company that invited you.
      </p>
    </div>
  );
}

/** Pool interview whose times were all booked before this candidate chose. */
export function AllTimesTakenState({
  companyName, postingTitle,
}: {
  companyName: string | null;
  postingTitle: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {companyName && <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-muted)' }}>{companyName}</p>}
      <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
        All available times{postingTitle ? ` for the ${postingTitle} role` : ' for this role'} have been taken
      </h1>
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.55 }}>
        The team will reach out with new options.
      </p>
    </div>
  );
}

export function CancelledState({
  companyName, cancelReason,
}: {
  companyName: string | null;
  cancelReason: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>This interview was cancelled</h1>
      {/* Untrusted employer text — rendered as text (React escapes), never HTML.
          When null, nothing renders: silence reads better than "No reason given". */}
      {cancelReason && (
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.55 }}>
          Reason given: {cancelReason}
        </p>
      )}
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {companyName ? `${companyName} has` : 'The company has'} cancelled this interview. If you have questions, contact them by replying to their email.
      </p>
    </div>
  );
}
