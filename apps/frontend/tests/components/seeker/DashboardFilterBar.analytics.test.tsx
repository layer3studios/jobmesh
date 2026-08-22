import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

import DashboardFilterBar from '@/components/seeker/DashboardFilterBar';

function renderBar() {
  return render(
    <DashboardFilterBar
      roleCategoryFilter="all" experienceBandFilter={[]} workplaceFilter={[]} dateFilter="all"
      sel="" cos="" roleOptions={[{ value: 'all', label: 'All roles' }]}
      experienceOptions={[{ value: 'all', label: 'All exp' }]} desktopSelectStyle={{}}
      setRoleCategoryFilter={vi.fn()} setExperienceBandFilter={vi.fn()} setWorkplaceFilter={vi.fn()}
      setDateFilter={vi.fn()} setSel={vi.fn()} setCos={vi.fn()} setSp={vi.fn()}
      facets={{ techStack: [], cities: [] }}
      locationsFilter={[]} setLocationsFilter={vi.fn()}
      techStackFilter={[]} setTechStackFilter={vi.fn()}
      salaryMinFilter="" salaryMaxFilter="" setSalaryFilter={vi.fn()}
    />,
  );
}

describe('Funnel 2 — jobs_filter_applied', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires action="added" when a date filter is chosen', () => {
    const { getByDisplayValue } = renderBar();
    fireEvent.change(getByDisplayValue('Any time'), { target: { value: '7d' } });
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'date', action: 'added' });
  });

  it('fires action="removed" when a filter is reset to all', () => {
    const { getByDisplayValue } = renderBar();
    fireEvent.change(getByDisplayValue('Any time'), { target: { value: 'all' } });
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'date', action: 'removed' });
  });
});
