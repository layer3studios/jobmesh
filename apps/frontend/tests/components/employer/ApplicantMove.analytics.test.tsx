import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

const moveApplicant = vi.fn(async () => ({}));
vi.mock('@/api/employer-applicants-api', () => ({
  moveApplicant: () => moveApplicant(),
  archiveApplicant: vi.fn(), unarchiveApplicant: vi.fn(), rescoreApplicant: vi.fn(),
  EmployerApplicantsApiError: class extends Error {},
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ postingId: 'post-1' }) }));
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => ({ company: { id: 'comp-1' } }) }));
vi.mock('lucide-react', () => ({ Briefcase: () => null, MapPin: () => null, Clock: () => null }));

type AnyProps = Record<string, unknown> & { children?: ReactNode };
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled }: AnyProps) => <button onClick={onClick as () => void} disabled={disabled as boolean}>{children}</button>,
  Select: ({ value, options, onChange }: AnyProps) => (
    <select value={value as string} onChange={onChange as never}>
      {(options as { value: string; label: string }[]).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ),
  Input: () => <input />, Textarea: () => <textarea />,
  Modal: ({ children, isOpen }: AnyProps) => (isOpen ? <div>{children}</div> : null),
  Alert: ({ children }: AnyProps) => <div>{children}</div>,
  Stack: ({ children }: AnyProps) => <div>{children}</div>,
  Badge: ({ children }: AnyProps) => <span>{children}</span>,
}));

import ApplicantReviewPanel from '@/components/employer/jobs/ApplicantReviewPanel';

describe('Funnel 5 — applicant_moved_stage (select)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires applicant_moved_stage with method "select" after the move resolves', async () => {
    const { container, getByText } = render(
      <ApplicantReviewPanel
        score={null} applicationId="app-1" currentStageId="s1" archived={false}
        stages={[{ id: 's1', text: 'New' }, { id: 's2', text: 'Screen' }] as never}
        reasons={[{ id: 'r1', label: 'x' }] as never} stageChanges={[]} onDone={vi.fn()}
      />,
    );
    fireEvent.change(container.querySelector('select')!, { target: { value: 's2' } });
    fireEvent.click(getByText('Move stage'));
    await waitFor(() => expect(capture).toHaveBeenCalledWith('applicant_moved_stage', {
      applicationId: 'app-1', postingId: 'post-1', companyId: 'comp-1',
      fromStage: 's1', toStage: 's2', method: 'select',
    }));
  });
});
