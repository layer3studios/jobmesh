import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));
vi.mock('@/hooks/shared/useViewport', () => ({ useViewport: () => ({ w: 1200 }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  // ApplyFormClient reads ?source= to pre-answer the "how did you hear about us" field.
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/api/public-api', () => ({
  submitApplication: vi.fn(async () => ({ applicationId: 'a1' })),
  PublicApiError: class PublicApiError extends Error {},
}));

import ApplyFormClient from '@/components/apply/ApplyFormClient';
import type { PublicCompany, PublicJob } from '@/types/public-apply';

const company = { name: 'Acme', slug: 'acme' } as unknown as PublicCompany;
const job = { id: 'job-1', slug: 'dev', title: 'Developer' } as unknown as PublicJob;

describe('Funnel 1 — apply_started', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires apply_started on apply-form mount with the public method', () => {
    render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />);
    expect(capture).toHaveBeenCalledWith('apply_started', {
      jobId: 'job-1', companyId: 'acme', applyMethod: 'public', hasAssignment: false,
    });
  });

  // The flag is what splits the two populations for the abandonment ratio — this
  // event is the "form viewed" counter for BOTH, so it has to fire either way.
  it('fires apply_started with hasAssignment true on a take-home posting', () => {
    const assignment = { id: 'asg-1', allowedFileTypes: [] } as never;
    render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" assignment={assignment} />);
    expect(capture).toHaveBeenCalledWith('apply_started', {
      jobId: 'job-1', companyId: 'acme', applyMethod: 'public', hasAssignment: true,
    });
  });
});
