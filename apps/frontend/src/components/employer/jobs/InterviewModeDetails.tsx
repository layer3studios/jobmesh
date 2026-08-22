'use client';
// FILE: src/components/employer/jobs/InterviewModeDetails.tsx
// Type-specific block for a CONFIRMED interview on the applicant page: the
// join button (video), who-dials-whom with a big number (phone), or the
// address + Maps link (in person).

import { Video, Phone, MapPin } from 'lucide-react';
import { Button, Stack } from '@/components/ui';
import type { Interview } from '@/types/employer-interviews';
import { googleMapsUrl } from '@/lib/maps-url';

const BIG_PHONE = { margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' } as const;
const MUTED = { margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' } as const;

export default function InterviewModeDetails({ interview, candidatePhone }: {
  interview: Interview;
  /** The candidate's number from the contact record (we_call display). */
  candidatePhone?: string | null;
}) {
  if (interview.mode === 'video') {
    if (!interview.meetingUrl) return null;
    return (
      <Stack gap={6}>
        <p style={{ ...MUTED, wordBreak: 'break-all' }}>{interview.meetingUrl}</p>
        <div>
          <Button size="sm" as="a" href={interview.meetingUrl} target="_blank" rel="noopener noreferrer" iconLeft={<Video size={14} />}>
            Join meeting
          </Button>
        </div>
      </Stack>
    );
  }

  if (interview.mode === 'phone') {
    if (interview.phoneCallDirection === 'candidate_calls') {
      return (
        <Stack gap={4}>
          <p style={MUTED}>Candidate will call:</p>
          <p style={BIG_PHONE}>{interview.phoneNumber ?? '—'}</p>
        </Stack>
      );
    }
    return (
      <Stack gap={6}>
        <p style={MUTED}>Call candidate at:</p>
        <p style={BIG_PHONE}>{candidatePhone ?? 'No phone on file'}</p>
        {candidatePhone && (
          <div>
            <Button size="sm" variant="secondary" as="a" href={`tel:${candidatePhone.replace(/\s+/g, '')}`} iconLeft={<Phone size={14} />}>
              Call now
            </Button>
          </div>
        )}
      </Stack>
    );
  }

  // in_person
  if (!interview.locationText) return null;
  return (
    <Stack gap={4}>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink)' }}>{interview.locationText}</p>
      {interview.arrivalInstructions && <p style={MUTED}>{interview.arrivalInstructions}</p>}
      <a
        href={googleMapsUrl(interview.locationText)}
        target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none' }}
      >
        <MapPin size={13} /> Open in Maps
      </a>
      <p style={MUTED}>Candidate has received directions.</p>
    </Stack>
  );
}
