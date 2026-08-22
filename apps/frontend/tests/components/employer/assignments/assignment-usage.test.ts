import { describe, it, expect } from 'vitest';
import { groupUsageByAssignment } from '@/app/(employer)/employer/(app)/(onboarded)/assignments/parts/assignment-usage';
import type { Posting } from '@/types/employer-jobs';

function posting(overrides: Partial<Posting>): Posting {
  return {
    id: 'j1', slug: 'job', title: 'Backend Engineer', description: '', descriptionPlain: '',
    location: 'Bengaluru', workplaceType: 'remote', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
    assignmentId: null, applicationDeadline: null, autoCloseOnDeadline: false,
    postedAt: null, closedAt: null, createdAt: '', updatedAt: '',
    ...overrides,
  };
}

describe('groupUsageByAssignment', () => {
  it('groups postings under the assignment they reference', () => {
    const usage = groupUsageByAssignment([
      posting({ id: 'j1', title: 'Backend Engineer', assignmentId: 'a1' }),
      posting({ id: 'j2', title: 'Platform Engineer', assignmentId: 'a1', status: 'draft' }),
      posting({ id: 'j3', title: 'Designer', assignmentId: 'a2' }),
    ]);
    expect(usage.a1).toEqual([
      { id: 'j1', title: 'Backend Engineer', status: 'active' },
      { id: 'j2', title: 'Platform Engineer', status: 'draft' },
    ]);
    expect(usage.a2).toHaveLength(1);
  });

  it('skips postings with no assignment attached', () => {
    expect(groupUsageByAssignment([posting({ assignmentId: null })])).toEqual({});
  });

  it('returns an empty map for an empty or missing list', () => {
    expect(groupUsageByAssignment([])).toEqual({});
    expect(groupUsageByAssignment(undefined as unknown as Posting[])).toEqual({});
  });
});
