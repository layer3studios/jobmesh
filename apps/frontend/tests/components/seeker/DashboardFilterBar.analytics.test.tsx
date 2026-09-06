import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

import DashboardFilterBar from '@/components/seeker/DashboardFilterBar';

function renderBar() {
  return render(
    <DashboardFilterBar
      roleCategoryFilter="all" experienceBandFilter={[]} workplaceFilter={[]} dateFilter="all"
      roleOptions={[{ value: 'all', label: 'All roles' }]}
      experienceOptions={[{ value: 'all', label: 'All exp' }]} desktopSelectStyle={{}}
      setRoleCategoryFilter={vi.fn()} setExperienceBandFilter={vi.fn()} setWorkplaceFilter={vi.fn()}
      setDateFilter={vi.fn()} setSp={vi.fn()}
      facets={{ techStack: [], cities: [] }}
      locationsFilter={[]} setLocationsFilter={vi.fn()}
      techStackFilter={[]} setTechStackFilter={vi.fn()}
      salaryMinFilter="" salaryMaxFilter="" setSalaryFilter={vi.fn()}
      showNewOnly={false} setShowNewOnly={vi.fn()}
      hideApplied={false} setHideApplied={vi.fn()}
      entryLevelFilter={false} setEntryLevelFilter={vi.fn()}
      newJobsCount={0}
    />,
  );
}

describe('Funnel 2 — jobs_filter_applied', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires action="added" when a posted-date pill is chosen inside More', () => {
    const { getByRole } = renderBar();
    fireEvent.click(getByRole('button', { name: /more/i }));
    fireEvent.click(getByRole('button', { name: 'Last week' }));
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'date', action: 'added' });
  });

  it('fires action="removed" when the date is reset to any time', () => {
    const { getByRole } = renderBar();
    fireEvent.click(getByRole('button', { name: /more/i }));
    fireEvent.click(getByRole('button', { name: 'Any time' }));
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'date', action: 'removed' });
  });
});
