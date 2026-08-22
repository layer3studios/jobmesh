// FILE: tests/components/apply/ApplyProgress.test.tsx
// The completion indicator. Two things are being protected here: that it never
// opens at "0 of 4", and that it can never block a submit the form would accept.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  // ApplyFormClient reads ?source= to pre-answer the "how did you hear about us" field.
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/api/public-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/public-api')>()),
  submitApplication: vi.fn(),
}));

import ApplyFormClient from '@/components/apply/ApplyFormClient';
import type { PublicAssignment, PublicCompany, PublicJob } from '@/types/public-apply';

const company = { name: 'Acme', slug: 'acme' } as unknown as PublicCompany;
const job = { id: 'job-1', slug: 'dev', title: 'Developer', description: 'Build things.' } as unknown as PublicJob;
// Link-only submission keeps the gate reachable without staging an upload.
const assignment = {
  id: 'asg-1', title: 'Build a rate limiter', estimatedHours: 3,
  publicSummary: 'A small service.', allowedFileTypes: [],
} as unknown as PublicAssignment;

function renderAssignmentPosting() {
  return render(
    <ApplyFormClient
      company={company} job={job} companySlug="acme" jobSlug="dev" assignment={assignment}
    />,
  );
}

function renderPlainPosting() {
  return render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />);
}

/** Type into a labelled field AND blur it — the indicator only commits on blur. */
function fillAndBlur(label: RegExp, value: string) {
  const field = screen.getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

function fillDetails() {
  fillAndBlur(/First name/i, 'Ada');
  fillAndBlur(/Last name/i, 'Lovelace');
  fillAndBlur(/^Email/i, 'ada@example.com');
  fillAndBlur(/Phone/i, '9999999999');
}

function attachResume(container: HTMLElement) {
  const input = container.querySelector('input[type="file"][accept*="pdf"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['x'], 'cv.pdf', { type: 'application/pdf' })] } });
}

function tickConsent() {
  fireEvent.click(screen.getAllByRole('checkbox')[0]);
}

function progressBar(): HTMLElement {
  return screen.getByRole('progressbar');
}

describe('endowed progress', () => {
  it('opens at "Just getting started" and never at "0 of 4"', () => {
    const { container } = renderAssignmentPosting();
    expect(screen.getByText('Just getting started')).toBeTruthy();
    expect(container.textContent).not.toMatch(/0 of \d/);
  });

  it('draws the bar off the floor before anything is complete', () => {
    renderAssignmentPosting();
    const fill = progressBar().firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('15%');
  });

  it('switches to the count once the first section completes', () => {
    renderAssignmentPosting();
    fillDetails();
    expect(screen.getByText('1 of 4 sections complete')).toBeTruthy();
    expect(screen.queryByText('Just getting started')).toBeNull();
  });
});

describe('section counting', () => {
  it('plain posting counts three sections and reaches 3 of 3', () => {
    const { container } = renderPlainPosting();
    fillDetails();
    expect(screen.getByText('1 of 3 sections complete')).toBeTruthy();
    attachResume(container);
    expect(screen.getByText('2 of 3 sections complete')).toBeTruthy();
    tickConsent();
    expect(screen.getByText('3 of 3 sections complete')).toBeTruthy();
  });

  it('assignment posting holds section 3 until the submit gate is met', () => {
    const { container } = renderAssignmentPosting();
    fillDetails();
    attachResume(container);
    tickConsent();
    // Everything but the submission itself.
    expect(screen.getByText('3 of 4 sections complete')).toBeTruthy();

    const link = screen.getByLabelText(/Submission link 1/i);
    fireEvent.change(link, { target: { value: 'https://github.com/ada/take-home' } });
    fireEvent.blur(link);
    expect(screen.getByText('4 of 4 sections complete')).toBeTruthy();
  });

  it('does not count an invalid submission link toward the gate', () => {
    const { container } = renderAssignmentPosting();
    fillDetails();
    attachResume(container);
    tickConsent();
    const link = screen.getByLabelText(/Submission link 1/i);
    fireEvent.change(link, { target: { value: 'not a url' } });
    fireEvent.blur(link);
    expect(screen.getByText('3 of 4 sections complete')).toBeTruthy();
  });
});

describe('accessibility', () => {
  it('exposes role=progressbar with a truthful value range', () => {
    renderAssignmentPosting();
    const bar = progressBar();
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    // 0 even while the bar is drawn at 15% — the visual is framing, the ARIA
    // value is a fact, and a screen reader gets the fact.
    expect(bar.getAttribute('aria-valuenow')).toBe('0');

    fillDetails();
    expect(progressBar().getAttribute('aria-valuenow')).toBe('1');
  });

  it('announces changes politely rather than interrupting', () => {
    renderAssignmentPosting();
    expect(screen.getByText('Just getting started').getAttribute('aria-live')).toBe('polite');
  });

  it('reports a max of 3 on a plain posting', () => {
    renderPlainPosting();
    expect(progressBar().getAttribute('aria-valuemax')).toBe('3');
  });
});

describe('the indicator is informational only', () => {
  it('does not block submit while the indicator still reads as barely started', () => {
    const { container } = renderPlainPosting();
    // The discrete sections are completed FIRST, then the text fields are typed
    // but never blurred. The form has everything it needs; the indicator has not
    // been told about the text yet, so it still reads 2 of 3. Submit must not care.
    attachResume(container);
    tickConsent();
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Lovelace' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'ada@example.com' } });

    expect(screen.getByText('2 of 3 sections complete')).toBeTruthy();
    const submit = screen.getByRole('button', { name: /Submit application/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
  });
});
