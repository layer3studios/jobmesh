// FILE: tests/app/interview/booking-page.test.tsx
// Server-page branching + the privacy guarantees: noindex metadata, no booking
// token in HTML, generic 404, and the 410 company-name pass-through.
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import InterviewBookingPage, { metadata } from '@/app/(apply)/interview/[bookingToken]/page';
import type { CandidateBookingPage } from '@/types/public-interview';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
afterAll(() => { vi.unstubAllGlobals(); });

const TOKEN = 'secret-booking-token-abc123xyz';

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function bookablePage(overrides: Partial<CandidateBookingPage> = {}): CandidateBookingPage {
  return {
    id: 'i1', status: 'proposed',
    proposedSlots: [
      { startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 },
      { startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45 },
    ],
    selectedSlotIndex: null, startAtUtc: null, timezoneId: 'Asia/Kolkata',
    durationMinutes: 45, mode: 'video', locationText: null,
    companyName: 'Acme', postingTitle: 'Backend Engineer', companyLogoUrl: null,
    bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', cancelReason: null,
    ...overrides,
  };
}

async function renderPage() {
  const element = await InterviewBookingPage({ params: Promise.resolve({ bookingToken: TOKEN }) });
  return render(element);
}

beforeEach(() => { fetchMock.mockReset(); cleanup(); });

describe('interview booking page (server)', () => {
  it('metadata exports robots index false and follow false', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('a bookable payload renders one option per slot and a date-only expiry line', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: bookablePage() }));
    const { container } = await renderPage();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText(/This link expires on 7 August 2030\./)).toBeTruthy();
    expect(container.textContent).not.toMatch(/expires on .*\d:\d\d/); // no time component
  });

  it('a missing bookingTokenExpiresAt falls back to the vague wording, never "Invalid Date"', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      data: { ...bookablePage(), bookingTokenExpiresAt: '' },
    }));
    const { container } = await renderPage();
    expect(screen.getByText(/This link expires if unused\./)).toBeTruthy();
    expect(container.textContent).not.toContain('Invalid Date');
  });

  it('a 410 with a company name names who to contact', async () => {
    fetchMock.mockResolvedValue(jsonResponse(410, { error: { code: 'BOOKING_TOKEN_EXPIRED', message: 'x', companyName: 'Acme' } }));
    await renderPage();
    expect(screen.getByText('This booking link has expired')).toBeTruthy();
    expect(screen.getByText(/from Acme/)).toBeTruthy();
  });

  it('a 410 without a company name keeps the generic wording', async () => {
    fetchMock.mockResolvedValue(jsonResponse(410, { error: { code: 'BOOKING_TOKEN_EXPIRED', message: 'x' } }));
    const { container } = await renderPage();
    expect(screen.getByText('This booking link has expired')).toBeTruthy();
    expect(container.textContent).not.toContain('Acme');
  });

  it('a 404 stays completely generic — no company name under any condition', async () => {
    // Even a (hostile/buggy) 404 body carrying a name must not surface it.
    fetchMock.mockResolvedValue(jsonResponse(404, { error: { code: 'BOOKING_TOKEN_INVALID', message: 'x', companyName: 'Acme' } }));
    const { container } = await renderPage();
    expect(screen.getByText("This interview link isn't valid")).toBeTruthy();
    expect(container.textContent).not.toContain('Acme');
    expect(container.innerHTML).not.toContain(TOKEN);
  });

  it('the cancelled state renders the reason when present, nothing when null', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: bookablePage({ status: 'cancelled', cancelReason: 'Position filled' }) }));
    await renderPage();
    expect(screen.getByText('Reason given: Position filled')).toBeTruthy();
    cleanup();
    fetchMock.mockResolvedValue(jsonResponse(200, { data: bookablePage({ status: 'cancelled', cancelReason: null }) }));
    const { container } = await renderPage();
    expect(screen.getByText('This interview was cancelled')).toBeTruthy();
    expect(container.textContent).not.toContain('Reason given');
  });

  it('status scheduled on load renders the already-confirmed state, not the picker', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      data: bookablePage({ status: 'scheduled', startAtUtc: '2030-08-10T09:30:00.000Z', selectedSlotIndex: 0 }),
    }));
    await renderPage();
    expect(screen.getByText(/Your interview is already confirmed/)).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('the rendered HTML contains no booking token anywhere', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: bookablePage() }));
    const { container } = await renderPage();
    expect(container.innerHTML).not.toContain(TOKEN);
  });
});
