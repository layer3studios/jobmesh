// FILE: tests/components/employer/jobs/interview-scheduling-settings.test.tsx
// Calendar-edition Settings tab: month grid + dots, day detail panel, chip
// semantics, pill toggles, past-date read-only. Carries the content-boundary
// tests for DetailSettings/PostingOverview.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import InterviewSchedulingSettings from '@/components/employer/jobs/InterviewSchedulingSettings';
import DetailSettings from '@/components/employer/jobs/DetailSettings';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import { ToastProvider } from '@/components/ui/Toast';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';
import { monthLabel, stepMonth } from '@/components/employer/jobs/interview-calendar-helpers';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewTime } from '@/types/employer-interviews';

vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { slug: 'acme' }, viewerRole: 'member' }),
}));

const updateInterviewDefaults = vi.fn();
const listInterviewTimes = vi.fn();
const addInterviewTimes = vi.fn();
const removeInterviewTime = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return {
    ...actual,
    updateInterviewDefaults: (...args: unknown[]) => updateInterviewDefaults(...args),
    listInterviewTimes: (...args: unknown[]) => listInterviewTimes(...args),
    addInterviewTimes: (...args: unknown[]) => addInterviewTimes(...args),
    removeInterviewTime: (...args: unknown[]) => removeInterviewTime(...args),
  };
});

const DEFAULTS = {
  meetingUrl: 'https://meet.acme.in/x', durationMinutes: 45,
  mode: 'video' as const, locationText: null, timezoneId: 'Asia/Kolkata',
};

function posting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'x', descriptionPlain: 'x',
    location: 'Bengaluru', workplaceType: 'onsite', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
    applicationDeadline: null, autoCloseOnDeadline: false,
    postedAt: null, closedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
    interviewDefaults: DEFAULTS,
    assignmentId: null,
    ...overrides,
  };
}

function time(id: string, startAtUtc: string, status: InterviewTime['status'] = 'available'): InterviewTime {
  return {
    id, startAtUtc, durationMinutes: 45, timezoneId: 'Asia/Kolkata', status,
    mode: 'video', meetingUrl: null, locationText: null, bookedByApplicationId: null, bookedAt: null,
  };
}

const todayIst = () => utcIsoToIstLocal(new Date().toISOString()).slice(0, 10);
const tomorrowIst = () => utcIsoToIstLocal(new Date(Date.now() + 86400000).toISOString()).slice(0, 10);
const atIst = (dateIso: string, hhmm: string) => istLocalToUtcIso(`${dateIso}T${hhmm}`) as string;

function renderSettings(postingOverrides: Partial<Posting> = {}) {
  return render(
    <ToastProvider>
      <InterviewSchedulingSettings posting={posting(postingOverrides)} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  updateInterviewDefaults.mockReset(); listInterviewTimes.mockReset();
  addInterviewTimes.mockReset(); removeInterviewTime.mockReset();
  listInterviewTimes.mockResolvedValue([]);
  cleanup();
});

describe('calendar grid', () => {
  it('renders 7 columns with a whole number of week rows', async () => {
    renderSettings();
    await waitFor(() => expect(screen.getByTestId('calendar-grid')).toBeTruthy());
    const cellCount = screen.getByTestId('calendar-grid').children.length;
    expect(cellCount % 7).toBe(0);
    expect(cellCount).toBeGreaterThanOrEqual(28);
  });

  it('dates with available times show green dots; booked show blue', async () => {
    const day = tomorrowIst();
    listInterviewTimes.mockResolvedValue([
      time('a', atIst(day, '09:30')),
      time('b', atIst(day, '11:00'), 'booked'),
    ]);
    renderSettings();
    await waitFor(() => {
      const cell = screen.getByTestId(`calendar-cell-${day}`);
      expect(within(cell).getAllByTestId('dot-available')).toHaveLength(1);
      expect(within(cell).getAllByTestId('dot-booked')).toHaveLength(1);
    });
  });

  it('the month navigation arrows change the displayed month', async () => {
    renderSettings();
    const today = todayIst();
    const current = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
    await waitFor(() => expect(screen.getByText(monthLabel(current.year, current.month))).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Next month'));
    const next = stepMonth(current.year, current.month, 1);
    expect(screen.getByText(monthLabel(next.year, next.month))).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(screen.getByText(monthLabel(current.year, current.month))).toBeTruthy();
  });
});

describe('day detail panel', () => {
  it('defaults to the next available date and switches when a date is clicked', async () => {
    const day = tomorrowIst();
    listInterviewTimes.mockResolvedValue([time('a', atIst(day, '09:30')), time('b', atIst(day, '14:15'), 'booked')]);
    renderSettings();
    await waitFor(() => expect(screen.getByTestId('day-detail-panel')).toBeTruthy());
    const panel = screen.getByTestId('day-detail-panel');
    expect(within(panel).getByText('9:30 AM')).toBeTruthy();
    expect(within(panel).getByText('1 available · 1 booked')).toBeTruthy();
    fireEvent.click(screen.getByTestId(`calendar-cell-${todayIst()}`));
    await waitFor(() => expect(within(screen.getByTestId('day-detail-panel')).getByText(/No times on this date/)).toBeTruthy());
  });

  it('chips reflect added/booked; adding posts the link and updates the dots', async () => {
    const day = tomorrowIst();
    listInterviewTimes.mockResolvedValueOnce([
      time('a', atIst(day, '09:30')),
      time('bk', atIst(day, '12:30'), 'booked'),
    ]);
    addInterviewTimes.mockResolvedValue({ insertedCount: 1 });
    renderSettings();
    await waitFor(() => expect(screen.getByText('9:30 AM · added')).toBeTruthy());
    expect(screen.getByText('12:30 PM · booked')).toBeTruthy();
    listInterviewTimes.mockResolvedValue([
      time('a', atIst(day, '09:30')),
      time('bk', atIst(day, '12:30'), 'booked'),
      time('b', atIst(day, '11:00')),
    ]);
    // The link now comes from the ADD panel field (these fixture times carry
    // none), so it must be entered before the batch can be added.
    fireEvent.change(screen.getByLabelText('Meeting link'), { target: { value: 'https://meet.acme.in/x' } });
    fireEvent.click(screen.getByText('11:00 AM'));
    fireEvent.click(screen.getByText('Add 1 time'));
    await waitFor(() => expect(addInterviewTimes).toHaveBeenCalledTimes(1));
    const [, sent] = addInterviewTimes.mock.calls[0] as [string, { startAtUtc: string; meetingUrl?: string | null }[]];
    expect(sent).toEqual([{ startAtUtc: atIst(day, '11:00'), meetingUrl: 'https://meet.acme.in/x' }]);
    await waitFor(() => {
      const cell = screen.getByTestId(`calendar-cell-${day}`);
      expect(within(cell).getAllByTestId('dot-available')).toHaveLength(2);
    });
  });

  it('past dates show a read-only panel with no add controls', async () => {
    const yesterday = utcIsoToIstLocal(new Date(Date.now() - 86400000).toISOString()).slice(0, 10);
    listInterviewTimes.mockResolvedValue([time('old', atIst(yesterday, '10:00'))]);
    renderSettings();
    await waitFor(() => expect(screen.getByTestId(`calendar-cell-${yesterday}`)).toBeTruthy());
    // On the 1st of a month, yesterday sits in the previous month's view where
    // it is a CURRENT-month (clickable) cell — trailing cells are inert.
    if (yesterday.slice(0, 7) !== todayIst().slice(0, 7)) {
      fireEvent.click(screen.getByLabelText('Previous month'));
    }
    fireEvent.click(screen.getByTestId(`calendar-cell-${yesterday}`));
    await waitFor(() => expect(within(screen.getByTestId('day-detail-panel')).getByText('This date is in the past.')).toBeTruthy());
    const panel = screen.getByTestId('day-detail-panel');
    expect(within(panel).getByText('10:00 AM')).toBeTruthy();
    expect(within(panel).queryByText('Select times to add')).toBeNull();
    expect(within(panel).queryByLabelText(/Remove/)).toBeNull();
  });
});

describe('details form pills', () => {
  it('duration pills are one-of (selecting one deselects the others)', async () => {
    renderSettings();
    const m60 = screen.getByText('60m').closest('button') as HTMLButtonElement;
    const m45 = screen.getByText('45m').closest('button') as HTMLButtonElement;
    expect(m45.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(m60);
    expect(m60.getAttribute('aria-pressed')).toBe('true');
    expect(m45.getAttribute('aria-pressed')).toBe('false');
  });

  it('type pills live in the ADD panel, not the left defaults panel', async () => {
    renderSettings();
    // The left panel is duration-only; the type group belongs to the add flow.
    await waitFor(() => expect(screen.getByRole('group', { name: 'Interview type' })).toBeTruthy());
    const typeGroup = screen.getByRole('group', { name: 'Interview type' });
    const addPanel = screen.getByTestId('day-detail-panel');
    expect(addPanel.contains(typeGroup)).toBe(true);
    expect(screen.getByRole('group', { name: 'Interview duration' })).toBeTruthy();
  });
});

describe('tab content boundaries (carried over)', () => {
  it('Settings contains Interview scheduling and NOT the job description', async () => {
    render(
      <ToastProvider>
        <DetailSettings posting={posting({ description: 'JD-BODY-TEXT' })} />
      </ToastProvider>,
    );
    await waitFor(() => expect(screen.getByText('Interview scheduling')).toBeTruthy());
    expect(screen.queryByText('JD-BODY-TEXT')).toBeNull();
  });

  it('Overview shows the description, status badge, and edit icon', () => {
    render(
      <ToastProvider>
        <PostingOverview posting={posting({ description: 'JD-BODY-TEXT' })} onReload={async () => {}} />
      </ToastProvider>,
    );
    expect(screen.getByText('JD-BODY-TEXT')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByLabelText('Edit posting')).toBeTruthy();
  });
});
