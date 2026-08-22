// FILE: tests/components/employer/jobs/new-posting-form.test.tsx
// New posting form: pill toggles, live preview, submit payload, numeric salary.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import EmployerJobsNew from '@/components/employer/jobs/New';
import { ToastProvider } from '@/components/ui/Toast';

const routerPush = vi.fn();
// useSearchParams: Breadcrumbs reads ?from= to root the trail at the origin.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { name: 'Acme Labs', slug: 'acme' } }),
}));
vi.mock('@/lib/from-route', () => ({ getFromRoute: () => '/employer/jobs' }));

const createEmployerPosting = vi.fn();
vi.mock('@/api/employer-jobs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, createEmployerPosting: (...args: unknown[]) => createEmployerPosting(...args) };
});

const DESCRIPTION = 'A long enough description for the backend minimum of fifty characters, easily.';

function fillRequired() {
  fireEvent.change(screen.getByLabelText(/Job title/), { target: { value: 'Backend Engineer' } });
  fireEvent.click(screen.getByText('Hybrid'));
  fireEvent.click(screen.getByText('Full-time'));
  fireEvent.change(screen.getByLabelText(/Location/), { target: { value: 'Bengaluru' } });
  fireEvent.change(screen.getByLabelText(/Job description/), { target: { value: DESCRIPTION } });
}

beforeEach(() => {
  routerPush.mockReset(); createEmployerPosting.mockReset();
  createEmployerPosting.mockResolvedValue({ id: 'p1', title: 'Backend Engineer', status: 'active' });
  cleanup();
  render(<ToastProvider><EmployerJobsNew /></ToastProvider>);
});

describe('New posting form', () => {
  it('workplace pills are one-of: Hybrid deselects Remote and On-site', () => {
    const remote = screen.getByText('Remote').closest('button') as HTMLButtonElement;
    const hybrid = screen.getByText('Hybrid').closest('button') as HTMLButtonElement;
    const onsite = screen.getByText('On-site').closest('button') as HTMLButtonElement;
    fireEvent.click(remote);
    expect(remote.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(hybrid);
    expect(hybrid.getAttribute('aria-pressed')).toBe('true');
    expect(remote.getAttribute('aria-pressed')).toBe('false');
    expect(onsite.getAttribute('aria-pressed')).toBe('false');
  });

  it('the live preview mirrors the title as the user types', () => {
    expect(screen.getByText('Untitled')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Job title/), { target: { value: 'Staff Engineer' } });
    expect(screen.getByText('Staff Engineer')).toBeTruthy();
    expect(screen.queryByText('Untitled')).toBeNull();
    expect(screen.getByText('Acme Labs')).toBeTruthy();
    expect(screen.getByText('Apply now')).toBeTruthy();
  });

  it('the location pill appears only when location is non-empty', () => {
    expect(screen.queryByText('Bengaluru')).toBeNull();
    fireEvent.change(screen.getByLabelText(/Location/), { target: { value: 'Bengaluru' } });
    expect(screen.getByText('Bengaluru')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Location/), { target: { value: '' } });
    expect(screen.queryByText('Bengaluru')).toBeNull();
  });

  it('Create posting sends the exact field values', async () => {
    fillRequired();
    fireEvent.change(screen.getByLabelText('Salary minimum'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Salary maximum'), { target: { value: '18' } });
    fireEvent.click(screen.getByText('Create posting'));
    await waitFor(() => expect(createEmployerPosting).toHaveBeenCalledTimes(1));
    // The deadline keys are ALWAYS sent, both together: clearing a deadline has to
    // reach the server as an explicit null, and auto-close is off without one.
    expect(createEmployerPosting).toHaveBeenCalledWith({
      title: 'Backend Engineer', description: DESCRIPTION, location: 'Bengaluru',
      workplaceType: 'hybrid', employmentType: 'full-time', salaryMin: 12, salaryMax: 18,
      applicationDeadline: null, autoCloseOnDeadline: false,
    });
    expect(routerPush).toHaveBeenCalledWith('/employer/jobs/p1');
  });

  it('salary fields are numeric inputs', () => {
    const min = screen.getByLabelText('Salary minimum') as HTMLInputElement;
    const max = screen.getByLabelText('Salary maximum') as HTMLInputElement;
    expect(min.type).toBe('number');
    expect(max.type).toBe('number');
  });
});
