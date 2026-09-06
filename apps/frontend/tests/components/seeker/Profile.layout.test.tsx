import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ParsedProfile } from '@/types/seeker-profile';

const profile: ParsedProfile = {
  fullName: 'Piyush Kumar', email: 'p@example.com', phone: null,
  currentLocation: { city: 'Mumbai', state: 'Maharashtra' }, linkedinUrl: null,
  summary: 'I like building things that ship, mostly on the web and mostly at night.',
  experience: [{ company: 'Acme', title: 'Engineer', startDate: '2023', endDate: null, isCurrent: true, responsibilities: [], technologies: [] }],
  education: [], skills: [{ name: 'React', category: null, proficiency: null }],
  totalExperienceYears: 2, seniorityLevel: 'Mid', domain: 'Engineering', subDomain: null,
  currentCTC: null, expectedCTC: null, noticePeriod: null, languages: [], certifications: [], projects: [],
  parsedAt: new Date().toISOString(),
};

vi.mock('@/api/seeker-api', () => ({
  fetchProfile: vi.fn(async () => profile),
  patchProfile: vi.fn(),
  getGitHubProfile: vi.fn(async () => ({ connected: false, available: true, data: null })),
  getLeetCodeProfile: vi.fn(async () => ({ connected: false, data: null })),
  SeekerApiError: class extends Error {},
}));
vi.mock('@/api/public-profile-api', () => ({
  fetchProfileSettings: vi.fn(async () => ({
    profileSlug: 'piyush', profilePublic: true, profileViewCount: 3, profileUrl: 'https://jobmesh.in/u/piyush',
    hasResume: true, hasLeetCode: false, hasGitHub: false,
    settings: { headline: 'Software Engineer', openToWork: true, showSkills: true, showExperience: true, showLeetCode: false, showGitHub: false, showResume: true, showEmail: false, showPhone: false },
  })),
  patchProfileSettings: vi.fn(),
  PublicProfileApiError: class extends Error {},
}));
vi.mock('@/context/seeker/SeekerContext', () => ({
  useSeeker: () => ({ currentUser: { name: 'Piyush Kumar', email: 'p@example.com', picture: '', slug: 'piyush' }, todayCount: 0, streak: 0, appliedJobs: [] }),
}));
vi.mock('@/hooks/shared/useViewport', () => ({ useViewport: () => ({ width: 1440, w: 1440, h: 900, isMobile: false, isDesktop: true }) }));
vi.mock('@/hooks/seeker/useResumeReview', () => ({ useResumeReview: () => ({ review: null, status: 'loaded', errorCode: null, errorMessage: null, run: vi.fn(), computeStale: () => false }) }));
vi.mock('@/hooks/seeker/useProfileMarketData', () => ({ useProfileMarketData: () => ({ matchCount: null, salaryBenchmark: null, matchErrorCode: null, salaryErrorCode: null, status: 'loaded' }) }));
vi.mock('@/components/seeker/dashboard/useJobFacets', () => ({ useJobFacets: () => ({ techStack: [], cities: [] }) }));
vi.mock('next/navigation', () => ({ usePathname: () => '/profile', useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/components/ui/Toast', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import Profile from '@/components/seeker/profile/Profile';

describe('Profile — Rightfit layout', () => {
  it('renders the completeness pill, the tab bar, the editor and the live preview', async () => {
    render(<Profile />);
    await waitFor(() => expect(screen.getByRole('tablist', { name: 'Profile sections' })).toBeTruthy());
    // 7 tabs, Basic info open.
    expect(screen.getAllByRole('tab')).toHaveLength(7);
    expect(screen.getByRole('tab', { name: /basic info/i }).getAttribute('aria-selected')).toBe('true');
    // Completeness is a real number out of 10 checks.
    expect(screen.getByRole('button', { name: /% complete/i }).textContent).toMatch(/\d+% complete/);
    // Live preview shows the person as a recruiter would see them.
    const preview = screen.getByRole('complementary', { name: 'Live preview' });
    expect(preview.textContent).toContain('Piyush Kumar');
    expect(preview.textContent).toContain('Software Engineer');
    expect(preview.textContent).toContain('Mumbai');
  });

  it('switches tabs and names the next action from the pill', async () => {
    render(<Profile />);
    await waitFor(() => screen.getByRole('tablist', { name: 'Profile sections' }));
    fireEvent.click(screen.getByRole('tab', { name: /experience/i }));
    expect(screen.getByRole('tab', { name: /experience/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toContain('Acme');
    fireEvent.click(screen.getByRole('button', { name: /% complete/i }));
    expect(screen.getByRole('status').textContent).toMatch(/Next:/);
  });
});
