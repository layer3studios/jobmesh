import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

const createEmployerPosting = vi.fn();
vi.mock('@/api/employer-jobs-api', () => ({ createEmployerPosting: (i: unknown) => createEmployerPosting(i) }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// Light stand-ins for the UI primitives New.tsx pulls in.
vi.mock('@/components/ui', () => ({
  Container: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeader: () => <div />,
  useToast: () => ({ showToast: vi.fn() }),
}));

// PostingForm → a button that submits a fake create input.
vi.mock('@/components/employer/jobs/PostingForm', () => ({
  default: ({ onSubmit }: { onSubmit: (i: unknown) => Promise<void> }) => (
    <button onClick={() => void onSubmit({ title: 'Dev' }).catch(() => {})}>submit</button>
  ),
}));

import EmployerJobsNew from '@/components/employer/jobs/New';

describe('Funnel 4 — posting_created', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires posting_created after the create API resolves 2xx', async () => {
    createEmployerPosting.mockResolvedValue({ id: 'p1', title: 'Dev', status: 'active' });
    const { getByText } = render(<EmployerJobsNew />);
    fireEvent.click(getByText('submit'));
    await waitFor(() => expect(capture).toHaveBeenCalledWith('posting_created', {
      postingId: 'p1', isDraft: false, isPublished: true,
    }));
  });

  it('does NOT fire posting_created when the create API rejects', async () => {
    createEmployerPosting.mockRejectedValue(new Error('nope'));
    const { getByText } = render(<EmployerJobsNew />);
    fireEvent.click(getByText('submit'));
    await waitFor(() => expect(createEmployerPosting).toHaveBeenCalled());
    expect(capture).not.toHaveBeenCalledWith('posting_created', expect.anything());
  });
});
