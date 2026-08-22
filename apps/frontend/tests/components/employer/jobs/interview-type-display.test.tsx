// FILE: tests/components/employer/jobs/interview-type-display.test.tsx
// Type-specific interview display: employer card, settings form, and the
// candidate booking confirmation.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InterviewCard from '@/components/employer/jobs/InterviewCard';
import InterviewDetailsForm from '@/components/employer/jobs/InterviewDetailsForm';
import { ConfirmedState } from '@/components/interview/InterviewBookingStates';
import { ToastProvider } from '@/components/ui/Toast';
import type { Interview, InterviewDefaults } from '@/types/employer-interviews';

vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return { ...actual, updateInterviewDefaults: vi.fn() };
});

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status: 'scheduled',
    proposedSlots: [], selectedSlotIndex: null, startAtUtc: '2026-08-10T04:00:00.000Z',
    timezoneId: 'Asia/Kolkata', durationMinutes: 45, mode: 'video',
    meetingUrl: 'https://meet.acme.in/x', locationText: null, calendarSequence: 0,
    interviewerEmployerUserIds: [], createdByEmployerUserId: null,
    bookingTokenExpiresAt: '2026-08-20T00:00:00.000Z', bookedAt: '2026-08-01T00:00:00.000Z',
    cancelledAt: null, cancelReason: null, createdAt: '2026-08-01T00:00:00.000Z', ...overrides,
  };
}

function renderCard(data: Interview, candidatePhone: string | null = null) {
  render(
    <InterviewCard interview={data} canManage candidatePhone={candidatePhone} onReschedule={vi.fn()} onCancel={vi.fn()} />,
  );
}

describe('InterviewCard type display', () => {
  it("phone (we_call) shows 'Call candidate at' with the candidate's number and a tel: button", () => {
    renderCard(interview({
      mode: 'phone', meetingUrl: null, phoneNumber: '+91 11111', phoneCallDirection: 'we_call',
    }), '+91 99999 88888');
    expect(screen.getByText('Call candidate at:')).toBeTruthy();
    expect(screen.getByText('+91 99999 88888')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Call now/ }).getAttribute('href')).toBe('tel:+919999988888');
  });

  it("phone (candidate_calls) shows 'Candidate will call' with the interviewer's number", () => {
    renderCard(interview({
      mode: 'phone', meetingUrl: null, phoneNumber: '+91 11111', phoneCallDirection: 'candidate_calls',
    }));
    expect(screen.getByText('Candidate will call:')).toBeTruthy();
    expect(screen.getByText('+91 11111')).toBeTruthy();
  });

  it('in-person shows the address, arrival instructions and a Maps link', () => {
    renderCard(interview({
      mode: 'in_person', meetingUrl: null, locationText: 'JobMesh HQ, MG Road',
      arrivalInstructions: 'Ask for Ashish at reception',
    }));
    expect(screen.getByText('JobMesh HQ, MG Road')).toBeTruthy();
    expect(screen.getByText('Ask for Ashish at reception')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Open in Maps/ }).getAttribute('href'))
      .toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('JobMesh HQ, MG Road')}`);
    expect(screen.getByText('Candidate has received directions.')).toBeTruthy();
  });

  it('video shows the meeting link and a Join button opening in a new tab', () => {
    renderCard(interview());
    expect(screen.getByText('https://meet.acme.in/x')).toBeTruthy();
    const join = screen.getByRole('link', { name: /Join meeting/ });
    expect(join.getAttribute('href')).toBe('https://meet.acme.in/x');
    expect(join.getAttribute('target')).toBe('_blank');
  });
});

// The left panel is duration-only now: interview TYPE and its detail field
// moved into the add-times panel (chosen per batch). Those fields are covered
// by compact-time-chips.test.tsx at their new home.
describe('InterviewDetailsForm (duration only)', () => {
  const renderForm = (initial: InterviewDefaults | null) => render(
    <ToastProvider><InterviewDetailsForm postingId="p1" initialDefaults={initial} onSaved={vi.fn()} /></ToastProvider>,
  );

  it('shows duration pills and no type/link/phone/address fields', () => {
    renderForm({
      mode: 'phone', meetingUrl: null, locationText: null, durationMinutes: 45,
      timezoneId: 'Asia/Kolkata', phoneNumber: '+91 11111', phoneCallDirection: null,
    });
    expect(screen.getByRole('group', { name: 'Interview duration' })).toBeTruthy();
    for (const gone of ['Meeting link', 'Phone number', 'Address', 'Arrival instructions']) {
      expect(screen.queryByLabelText(gone)).toBeNull();
    }
  });
});

describe('Candidate booking confirmation', () => {
  it('in-person confirmation shows the address, instructions and Maps link', () => {
    render(
      <ConfirmedState
        startAtUtc="2026-08-10T04:00:00.000Z" mode="in_person" durationMinutes={45}
        locationText="JobMesh HQ, MG Road" arrivalInstructions="Parking in basement" isReminder={false}
      />,
    );
    expect(screen.getByText('Location: JobMesh HQ, MG Road')).toBeTruthy();
    expect(screen.getByText('Parking in basement')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toBeTruthy();
  });

  it("phone (we_call) confirmation says we'll call and to keep the phone available", () => {
    render(
      <ConfirmedState
        startAtUtc="2026-08-10T04:00:00.000Z" mode="phone" durationMinutes={45}
        locationText={null} phoneCallDirection="we_call" isReminder={false}
      />,
    );
    expect(screen.getByText("We'll call you at the scheduled time. Keep your phone available.")).toBeTruthy();
  });
});
