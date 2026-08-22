// FILE: tests/components/employer/jobs/compact-time-chips.test.tsx
// Compact chips, the once-per-date link line, per-batch type selection in the
// add panel, link pre-fill, and the duration-only Add gate.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import InterviewDayDetailPanel from '@/components/employer/jobs/InterviewDayDetailPanel';
import InterviewSchedulingSettings from '@/components/employer/jobs/InterviewSchedulingSettings';
import { ToastProvider } from '@/components/ui/Toast';
import type { InterviewTime } from '@/types/employer-interviews';
import type { Posting } from '@/types/employer-jobs';
import type { AddTimesForm } from '@/components/employer/jobs/useAddTimesForm';

const listInterviewTimes = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return {
    ...actual,
    listInterviewTimes: (...args: unknown[]) => listInterviewTimes(...args),
    updateInterviewDefaults: vi.fn().mockResolvedValue({}),
    addInterviewTimes: vi.fn().mockResolvedValue({ insertedCount: 1 }),
    removeInterviewTime: vi.fn().mockResolvedValue({}),
  };
});
vi.mock('@/components/employer/jobs/useIsNarrowViewport', () => ({ useIsNarrowViewport: () => false }));

// A fixed IST date far enough ahead that it is never "past".
const DATE = '2099-08-10';
const at = (hhmm: string): string => new Date(`${DATE}T${hhmm}:00+05:30`).toISOString();

function time(overrides: Partial<InterviewTime> = {}): InterviewTime {
  return {
    id: 't1', startAtUtc: at('08:45'), durationMinutes: 45, timezoneId: 'Asia/Kolkata',
    status: 'available', mode: 'video', meetingUrl: 'https://meet.google.com/abc',
    locationText: null, bookedByApplicationId: null, bookedAt: null, ...overrides,
  };
}

const EMPTY_FORM: AddTimesForm = {
  mode: 'video', meetingUrl: '', phoneNumber: '',
  phoneCallDirection: 'we_call', address: '', arrivalInstructions: '',
};

function renderPanel(times: InterviewTime[], form: AddTimesForm = EMPTY_FORM, durationSaved = true) {
  const onFormChange = vi.fn();
  render(
    <ToastProvider>
      <InterviewDayDetailPanel
        postingId="p1" dateIso={DATE} times={times} durationMinutes={45}
        durationSaved={durationSaved} form={form} onFormChange={onFormChange}
        onFormUsed={vi.fn()} syncDefaults={vi.fn().mockResolvedValue(undefined)} refetch={vi.fn()}
      />
    </ToastProvider>,
  );
  return { onFormChange };
}

const POSTING = {
  id: 'p1', title: 'React Dev',
  interviewDefaults: { mode: 'video', meetingUrl: null, locationText: null, durationMinutes: 45, timezoneId: 'Asia/Kolkata' },
} as unknown as Posting;

beforeEach(() => {
  listInterviewTimes.mockReset().mockResolvedValue([]);
});

describe('compact time chips', () => {
  it('available times render as chips, not full-width rows', () => {
    renderPanel([time(), time({ id: 't2', startAtUtc: at('09:30') })]);
    const row = screen.getByTestId('time-chip-row');
    expect(within(row).getAllByTestId('time-chip-available')).toHaveLength(2);
    // Chips flow inline in a wrap row — that is what saves the vertical space.
    expect(row.style.display).toBe('flex');
    expect(row.style.flexWrap).toBe('wrap');
  });

  it('booked times show "booked" and no remove button', () => {
    renderPanel([time({ id: 'b1', status: 'booked', startAtUtc: at('10:15') })]);
    const chip = screen.getByTestId('time-chip-booked');
    expect(within(chip).getByText('booked')).toBeTruthy();
    expect(within(chip).queryByRole('button')).toBeNull();
  });

  it('an available chip exposes a remove button', () => {
    renderPanel([time()]);
    expect(screen.getByRole('button', { name: /Remove/ })).toBeTruthy();
  });

  it('the meeting link shows once below the chips, not per chip', () => {
    renderPanel([
      time(), time({ id: 't2', startAtUtc: at('09:30') }), time({ id: 't3', startAtUtc: at('10:15') }),
    ]);
    const summary = screen.getByTestId('day-link-summary');
    // Three chips, ONE link line.
    expect(within(summary).getAllByText('meet.google.com/abc')).toHaveLength(1);
    expect(within(screen.getByTestId('time-chip-row')).queryByText(/meet\.google\.com/)).toBeNull();
  });

  it('different links on the same date each show with a count', () => {
    renderPanel([
      time(), time({ id: 't2', startAtUtc: at('09:30') }), time({ id: 't3', startAtUtc: at('10:15') }),
      time({ id: 't4', startAtUtc: at('11:00'), meetingUrl: 'https://meet.google.com/xyz' }),
      time({ id: 't5', startAtUtc: at('11:45'), meetingUrl: 'https://meet.google.com/xyz' }),
    ]);
    const summary = screen.getByTestId('day-link-summary');
    expect(summary.textContent).toContain('meet.google.com/abc');
    expect(summary.textContent).toContain('(3 times)');
    expect(summary.textContent).toContain('meet.google.com/xyz');
    expect(summary.textContent).toContain('(2 times)');
  });
});

describe('per-batch type selection in the add panel', () => {
  it('type pills switch the conditional field between video and phone', () => {
    const { onFormChange } = renderPanel([]);
    expect(screen.getByLabelText('Meeting link')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Phone/ }));
    expect(onFormChange).toHaveBeenCalledWith('mode', 'phone');
  });

  it('phone type shows the number + who-calls-whom and hides the meeting link', () => {
    renderPanel([], { ...EMPTY_FORM, mode: 'phone' });
    expect(screen.getByLabelText('Phone number')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'We call' })).toBeTruthy();
    expect(screen.queryByLabelText('Meeting link')).toBeNull();
  });

  it('in-person type shows address + arrival instructions', () => {
    renderPanel([], { ...EMPTY_FORM, mode: 'in_person' });
    expect(screen.getByLabelText('Address')).toBeTruthy();
    expect(screen.getByLabelText('Arrival instructions')).toBeTruthy();
    expect(screen.queryByLabelText('Meeting link')).toBeNull();
  });
});

describe('Add button gate', () => {
  it('is disabled when the duration default is not saved', () => {
    renderPanel([], { ...EMPTY_FORM, meetingUrl: 'https://meet.google.com/abc' }, false);
    expect((screen.getByRole('button', { name: /^Add/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Set a default duration to start adding times.')).toBeTruthy();
  });

  it('is disabled with duration saved but no link filled', () => {
    renderPanel([], EMPTY_FORM, true);
    expect((screen.getByRole('button', { name: /^Add/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables once duration is saved, a chip is selected and the link is filled', () => {
    renderPanel([], { ...EMPTY_FORM, meetingUrl: 'https://meet.google.com/abc' }, true);
    const addButton = screen.getByRole('button', { name: /^Add/ }) as HTMLButtonElement;
    expect(addButton.disabled).toBe(true); // nothing selected yet
    fireEvent.click(within(screen.getByRole('group', { name: 'Pick interview times' })).getAllByRole('button')[0]);
    expect((screen.getByRole('button', { name: /^Add/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('link pre-fill', () => {
  it('pre-fills the link and type from the times already on the selected date', async () => {
    listInterviewTimes.mockResolvedValue([time({ startAtUtc: at('08:45') })]);
    render(<ToastProvider><InterviewSchedulingSettings posting={POSTING} /></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('day-detail-panel')).toBeTruthy());
    await waitFor(() => {
      expect((screen.getByLabelText('Meeting link') as HTMLInputElement).value).toBe('https://meet.google.com/abc');
    });
  });

  it('leaves the link empty on a date with no times (nothing used this session yet)', async () => {
    listInterviewTimes.mockResolvedValue([]);
    render(<ToastProvider><InterviewSchedulingSettings posting={POSTING} /></ToastProvider>);
    await waitFor(() => expect(screen.getByTestId('day-detail-panel')).toBeTruthy());
    expect((screen.getByLabelText('Meeting link') as HTMLInputElement).value).toBe('');
  });
});
