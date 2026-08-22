// FILE: tests/components/employer/jobs/ScheduleInterviewModal.test.tsx
// Validation, timezone discipline and failure handling for the schedule modal.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScheduleInterviewModal from '@/components/employer/jobs/ScheduleInterviewModal';
import { EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

const proposeInterview = vi.fn();
vi.mock('@/api/employer-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interviews-api')>();
  return {
    ...actual,
    proposeInterview: (...args: unknown[]) => proposeInterview(...args),
    rescheduleInterview: vi.fn(),
  };
});

const istFuture = (hoursAhead: number) =>
  utcIsoToIstLocal(new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString());

function renderModal() {
  return render(
    <ScheduleInterviewModal
      open
      applicationId="app-1"
      candidateFirstName="Asha"
      onClose={() => {}}
      onSuccess={() => {}}
      onViewExisting={() => {}}
    />,
  );
}

function submitButton(): HTMLButtonElement {
  return screen.getByText('Send invitation').closest('button') as HTMLButtonElement;
}

function timeInputs(): HTMLInputElement[] {
  return [screen.getByLabelText('Option 1'), screen.getByLabelText('Option 2')] as HTMLInputElement[];
}

function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
  const [first, second] = timeInputs();
  fireEvent.change(first, { target: { value: istFuture(24) } });
  fireEvent.change(second, { target: { value: istFuture(48) } });
}

beforeEach(() => { proposeInterview.mockReset(); });

describe('ScheduleInterviewModal', () => {
  it('cannot submit with only one time entered', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
    fireEvent.change(timeInputs()[0], { target: { value: istFuture(24) } });
    expect(submitButton().disabled).toBe(true);
  });

  it('cannot submit with two identical times, and says so inline', () => {
    renderModal();
    fillValidForm();
    fireEvent.change(timeInputs()[1], { target: { value: istFuture(24) } });
    expect(submitButton().disabled).toBe(true);
    expect(screen.getByText('This time is the same as another option.')).toBeTruthy();
  });

  it('rejects a past time inline', () => {
    renderModal();
    fireEvent.change(timeInputs()[0], { target: { value: '2020-01-01T10:00' } });
    expect(screen.getByText('This time is in the past.')).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it('video mode rejects a bare non-URL string', () => {
    renderModal();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'zoom room 4' } });
    expect(screen.getByText('Enter a full link starting with http:// or https://.')).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it('switching type from video to in_person clears the meeting link', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
    fireEvent.click(screen.getByLabelText('In person'));
    fireEvent.click(screen.getByLabelText('Video call'));
    expect((screen.getByLabelText(/Meeting link/) as HTMLInputElement).value).toBe('');
  });

  it('sends IST-converted UTC slots, never the raw input value', async () => {
    proposeInterview.mockResolvedValue({ id: 'i1' });
    renderModal();
    fillValidForm();
    fireEvent.change(timeInputs()[0], { target: { value: '2030-08-10T15:00' } });
    fireEvent.click(submitButton());
    await waitFor(() => expect(proposeInterview).toHaveBeenCalled());
    const input = proposeInterview.mock.calls[0][1] as { proposedSlots: { startAtUtc: string }[]; timezoneId: string };
    expect(input.proposedSlots[0].startAtUtc).toBe('2030-08-10T09:30:00.000Z');
    expect(input.timezoneId).toBe('Asia/Kolkata');
  });

  it('409 INTERVIEW_ALREADY_ACTIVE keeps the modal open and shows the warning', async () => {
    proposeInterview.mockRejectedValue(new EmployerInterviewsApiError(409, 'INTERVIEW_ALREADY_ACTIVE', 'active'));
    renderModal();
    fillValidForm();
    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText('An interview is already active for this applicant.')).toBeTruthy());
    expect(screen.getByText('Close and view it')).toBeTruthy();
    expect(screen.getByLabelText('Option 1')).toBeTruthy(); // still open
  });

  // Focus-loss regressions (useFocusTrap re-running per keystroke). These MUST
  // use userEvent.type: fireEvent.change sets the value in one shot and passes
  // even while the bug is present.
  it('typing multi-character text into the phone field keeps focus and the full string', async () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Phone call'));
    const phoneField = screen.getByLabelText('Phone number to call') as HTMLInputElement;
    await userEvent.type(phoneField, '+91 98765 43210');
    expect(phoneField.value).toBe('+91 98765 43210');
    expect(document.activeElement).toBe(phoneField);
  });

  it('typing into the meeting link field keeps focus and the full string', async () => {
    renderModal();
    const linkField = screen.getByLabelText(/Meeting link/) as HTMLInputElement;
    await userEvent.type(linkField, 'https://meet.google.com/abc');
    expect(linkField.value).toBe('https://meet.google.com/abc');
    expect(document.activeElement).toBe(linkField);
  });

  it('typing into the address field keeps focus and the full string', async () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('In person'));
    const addressField = screen.getByLabelText(/Address/) as HTMLTextAreaElement;
    await userEvent.type(addressField, 'WeWork, Koramangala');
    expect(addressField.value).toBe('WeWork, Koramangala');
    expect(document.activeElement).toBe(addressField);
  });

  it('removing a middle time row leaves the other rows with their own values', () => {
    // The first two rows are non-removable by design, so "middle" here is row 3
    // of 4 — the smallest case where a later row shifts up past the removed one.
    renderModal();
    fireEvent.click(screen.getByText('Add another time'));
    fireEvent.click(screen.getByText('Add another time'));
    const values = [istFuture(24), istFuture(48), istFuture(72), istFuture(96)];
    for (const [index, value] of values.entries()) {
      fireEvent.change(screen.getByLabelText(`Option ${index + 1}`), { target: { value } });
    }
    fireEvent.click(screen.getByLabelText('Remove option 3'));
    const remaining = [
      (screen.getByLabelText('Option 1') as HTMLInputElement).value,
      (screen.getByLabelText('Option 2') as HTMLInputElement).value,
      (screen.getByLabelText('Option 3') as HTMLInputElement).value,
    ];
    expect(remaining).toEqual([values[0], values[1], values[3]]);
    expect(screen.queryByLabelText('Option 4')).toBeNull();
  });

  it('a network failure keeps every entered time in the form', async () => {
    proposeInterview.mockRejectedValue(new Error('network down'));
    renderModal();
    fillValidForm();
    const enteredFirst = (timeInputs()[0]).value;
    const enteredSecond = (timeInputs()[1]).value;
    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText(/Something went wrong/)).toBeTruthy());
    expect((timeInputs()[0]).value).toBe(enteredFirst);
    expect((timeInputs()[1]).value).toBe(enteredSecond);
    expect((screen.getByLabelText(/Meeting link/) as HTMLInputElement).value).toBe('https://meet.google.com/abc');
  });
});
