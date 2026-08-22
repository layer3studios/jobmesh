// FILE: tests/components/interview/InterviewBookingClient.test.tsx
// Client-island behaviour: selection gating, single-fire submit, and the
// error-to-state mappings (409 refetch, 410/404 terminal states).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InterviewBookingClient from '@/components/interview/InterviewBookingClient';
import { PublicInterviewsApiError } from '@/api/public-interviews-api';
import type { CandidateBookingPage } from '@/types/public-interview';

const bookInterviewSlot = vi.fn();
const fetchBookingPage = vi.fn();
vi.mock('@/api/public-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/public-interviews-api')>();
  return {
    ...actual,
    bookInterviewSlot: (...args: unknown[]) => bookInterviewSlot(...args),
    fetchBookingPage: (...args: unknown[]) => fetchBookingPage(...args),
  };
});

const TOKEN = 'secret-token-42';

function pageData(overrides: Partial<CandidateBookingPage> = {}): CandidateBookingPage {
  return {
    id: 'i1', status: 'proposed',
    proposedSlots: [
      { startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 },
      { startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45 },
      { startAtUtc: '2030-08-12T09:30:00.000Z', durationMinutes: 45 },
    ],
    selectedSlotIndex: null, startAtUtc: null, timezoneId: 'Asia/Kolkata',
    durationMinutes: 45, mode: 'video', locationText: null,
    companyName: 'Acme', postingTitle: 'Backend Engineer', companyLogoUrl: null,
    bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', cancelReason: null,
    ...overrides,
  };
}

function renderClient(overrides: Partial<CandidateBookingPage> = {}) {
  return render(<InterviewBookingClient bookingToken={TOKEN} initial={pageData(overrides)} />);
}

function confirmButton(): HTMLButtonElement {
  return screen.getByText('Confirm this time').closest('button') as HTMLButtonElement;
}

beforeEach(() => { bookInterviewSlot.mockReset(); fetchBookingPage.mockReset(); cleanup(); });

describe('InterviewBookingClient', () => {
  it('renders one option per proposed slot', () => {
    renderClient();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('confirm is disabled until a slot is chosen', () => {
    renderClient();
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(confirmButton().disabled).toBe(false);
  });

  it('confirming calls the API once with the correct slotIndex', async () => {
    bookInterviewSlot.mockResolvedValue({ ...pageData(), status: 'scheduled', startAtUtc: '2030-08-11T09:30:00.000Z' });
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText("You're confirmed ✓")).toBeTruthy());
    expect(bookInterviewSlot).toHaveBeenCalledTimes(1);
    expect(bookInterviewSlot).toHaveBeenCalledWith(TOKEN, { slotIndex: 1 });
  });

  it('a second rapid click does not fire a second request', async () => {
    let resolveBooking: (value: unknown) => void = () => {};
    bookInterviewSlot.mockImplementation(() => new Promise((resolve) => { resolveBooking = resolve; }));
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    const button = confirmButton();
    fireEvent.click(button);
    fireEvent.click(button);
    resolveBooking({ ...pageData(), status: 'scheduled', startAtUtc: '2030-08-10T09:30:00.000Z' });
    await waitFor(() => expect(screen.getByText("You're confirmed ✓")).toBeTruthy());
    expect(bookInterviewSlot).toHaveBeenCalledTimes(1);
  });

  it('a 409 triggers a refetch instead of a raw error', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(409, 'INTERVIEW_NOT_PROPOSED', 'conflict'));
    fetchBookingPage.mockResolvedValue(pageData({ status: 'scheduled', startAtUtc: '2030-08-10T09:30:00.000Z' }));
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(fetchBookingPage).toHaveBeenCalledWith(TOKEN));
    await waitFor(() => expect(screen.getByText(/Your interview is already confirmed/)).toBeTruthy());
    expect(screen.queryByText('conflict')).toBeNull();
  });

  it('a 410 on submit switches to the expired state', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(410, 'BOOKING_TOKEN_EXPIRED', 'gone'));
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText('This booking link has expired')).toBeTruthy());
  });

  it('a 404 on submit switches to the invalid state', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(404, 'BOOKING_TOKEN_INVALID', 'nope'));
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText("This interview link isn't valid")).toBeTruthy());
  });

  it('SLOT_TOO_SOON disables confirm until a different time is chosen', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(400, 'SLOT_TOO_SOON', 'too soon'));
    renderClient();
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getByText(/too close to book/)).toBeTruthy());
    expect(confirmButton().disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(confirmButton().disabled).toBe(false);
  });

  it('in_person shows the address before the slot list; video shows no link anywhere', () => {
    const { container } = renderClient({ mode: 'in_person', locationText: 'WeWork, Koramangala, Bengaluru' });
    const text = container.textContent ?? '';
    expect(text.indexOf('WeWork, Koramangala, Bengaluru')).toBeGreaterThan(-1);
    expect(text.indexOf('WeWork, Koramangala, Bengaluru')).toBeLessThan(text.indexOf('Choose a time'));
    cleanup();
    const video = renderClient({ mode: 'video' });
    expect(video.container.textContent).not.toContain('http');
    expect(video.container.innerHTML).not.toContain('meet.');
  });

  it('never renders the booking token', () => {
    const { container } = renderClient();
    expect(container.innerHTML).not.toContain(TOKEN);
  });

  // ─── Pool interviews ──────────────────────────────────────────────
  const POOL_TIMES = [
    { id: 't1', startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45, timezoneId: 'Asia/Kolkata' },
    { id: 't2', startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45, timezoneId: 'Asia/Kolkata' },
  ];

  it('pool: renders the times array and confirms with timeId, not slotIndex', async () => {
    bookInterviewSlot.mockResolvedValue({ ...pageData(), status: 'scheduled', startAtUtc: POOL_TIMES[1].startAtUtc });
    renderClient({ proposedSlots: [], times: POOL_TIMES });
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(bookInterviewSlot).toHaveBeenCalledWith(TOKEN, { timeId: 't2' }));
  });

  it('pool: empty times and empty slots shows the all-taken state', () => {
    renderClient({ proposedSlots: [], times: [] });
    expect(screen.getByText(/have been taken/)).toBeTruthy();
    expect(screen.getByText('The team will reach out with new options.')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('pool: TIME_ALREADY_BOOKED refetches; a drained pool shows the all-taken state', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(409, 'TIME_ALREADY_BOOKED', 'taken'));
    fetchBookingPage.mockResolvedValue(pageData({ proposedSlots: [], times: [] }));
    renderClient({ proposedSlots: [], times: POOL_TIMES });
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(fetchBookingPage).toHaveBeenCalledWith(TOKEN));
    await waitFor(() => expect(screen.getByText(/have been taken/)).toBeTruthy());
    expect(screen.queryByText('taken')).toBeNull(); // no raw error shown
  });

  it('pool: TIME_ALREADY_BOOKED with remaining times keeps them selectable after refetch', async () => {
    bookInterviewSlot.mockRejectedValue(new PublicInterviewsApiError(409, 'TIME_ALREADY_BOOKED', 'taken'));
    fetchBookingPage.mockResolvedValue(pageData({ proposedSlots: [], times: [POOL_TIMES[1]] }));
    renderClient({ proposedSlots: [], times: POOL_TIMES });
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(confirmButton());
    await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(1));
  });
});
