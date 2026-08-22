import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/ui';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import type { Posting } from '@/types/employer-jobs';

let viewer: { company: { slug: string } | null; viewerRole: string | null };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

const posting = {
  id: 'p1', slug: 'eng', title: 'Engineer', description: 'Build things',
  status: 'active', location: 'Remote', workplaceType: 'remote', employmentType: 'full_time',
  salaryMin: null, salaryMax: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), postedAt: new Date().toISOString(),
} as unknown as Posting;

// Edit/Close moved from DetailSettings to the Overview tab (PostingOverview);
// the gating contract is unchanged.
function renderOverview() {
  return render(<ToastProvider><PostingOverview posting={posting} onReload={async () => {}} /></ToastProvider>);
}

describe('PostingOverview posting gating', () => {
  beforeEach(() => cleanup());

  it('hides Edit + Close posting for an Interviewer', () => {
    viewer = { company: { slug: 'acme' }, viewerRole: 'interviewer' };
    renderOverview();
    expect(screen.queryByLabelText('Edit posting')).toBeNull();
    expect(screen.queryByText('Close posting')).toBeNull();
  });

  it('shows Edit + Close posting for a Member', () => {
    viewer = { company: { slug: 'acme' }, viewerRole: 'member' };
    renderOverview();
    expect(screen.getByLabelText('Edit posting')).toBeTruthy();
    expect(screen.getByText('Close posting')).toBeTruthy();
  });
});
