// FILE: tests/pages/employer/settings/settings-pages.test.tsx
// The settings sub-pages: Company (careers URL + copy), Roles (role tiles),
// Danger zone (delete section).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import CompanySettingsClient from '@/app/(employer)/employer/(app)/(onboarded)/settings/CompanySettingsClient';
import RolesSettingsPage from '@/app/(employer)/employer/(app)/(onboarded)/settings/roles/page';
import DangerZoneClient from '@/app/(employer)/employer/(app)/(onboarded)/settings/danger/DangerZoneClient';
import type { EmployerCompany } from '@/context/employer/employer-context-types';

const showToast = vi.fn();
const refreshEmployerSession = vi.fn();
const updateEmployerCompany = vi.fn();
const copyToClipboard = vi.fn();

const COMPANY: EmployerCompany = {
  id: 'c1', slug: 'acme', name: 'Acme Labs', tagline: null, about: null, socialLinks: null,
  website: null, logoUrl: null,
  plan: 'free', retentionDays: 180, autoArchiveStaleDays: null,
  privacyPolicyUrl: null, dpoEmail: null,
  createdAt: '2026-01-01T00:00:00Z',
};

let viewerRole: string | null = 'founder';
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }));
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: COMPANY, viewerRole, refreshEmployerSession }),
}));
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return { ...actual, useToast: () => ({ showToast }) };
});
vi.mock('@/api/employer-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-api')>();
  return { ...actual, updateEmployerCompany: (...args: unknown[]) => updateEmployerCompany(...args) };
});
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: () => copyToClipboard() }));

beforeEach(() => {
  showToast.mockReset();
  refreshEmployerSession.mockReset();
  updateEmployerCompany.mockReset().mockResolvedValue(COMPANY);
  copyToClipboard.mockReset().mockResolvedValue(true);
  viewerRole = 'founder';
});

describe('Company settings page', () => {
  it('shows the careers page URL with a working Copy button', async () => {
    render(<CompanySettingsClient />);
    const field = screen.getByLabelText('Careers page URL') as HTMLInputElement;
    expect(field.value).toContain('/apply/acme');
    fireEvent.click(screen.getByRole('button', { name: /Copy/ }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledTimes(1));
    expect(showToast).toHaveBeenCalledWith('success', 'Careers link copied.');
  });

  it('offers a Visit link that opens the careers page in a new tab', () => {
    render(<CompanySettingsClient />);
    const visit = screen.getByRole('link', { name: /Visit/ });
    expect(visit.getAttribute('href')).toContain('/apply/acme');
    expect(visit.getAttribute('target')).toBe('_blank');
  });

  it('saves an edited company name via PATCH and re-syncs the session', async () => {
    render(<CompanySettingsClient />);
    fireEvent.change(screen.getByLabelText(/Company name/), { target: { value: 'Acme Inc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // Name and tagline save together in one PATCH; an untouched empty tagline
    // goes as null rather than '' so the careers page has one falsy case.
    // The whole profile saves in one PATCH. Untouched optional fields go as null
    // so clearing one is indistinguishable from never setting it.
    await waitFor(() => expect(updateEmployerCompany).toHaveBeenCalledWith({
      name: 'Acme Inc', tagline: null, about: null, socialLinks: null,
    }));
    expect(refreshEmployerSession).toHaveBeenCalled();
  });

  it('shows the name read-only for a Member (no edit permission)', () => {
    viewerRole = 'member';
    render(<CompanySettingsClient />);
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    expect(screen.getByText('Only a Founder or Owner can change these.')).toBeTruthy();
  });

  it('shows the DPDP retention note', () => {
    render(<CompanySettingsClient />);
    expect(screen.getByText('Applicant data retained for 180 days per DPDP compliance.')).toBeTruthy();
  });
});

describe('Roles settings page', () => {
  it('renders the four role tiles', () => {
    render(<RolesSettingsPage />);
    for (const role of ['founder', 'owner', 'member', 'interviewer']) {
      const tile = screen.getByTestId(`role-tile-${role}`);
      expect(within(tile).getByTestId('role-dot')).toBeTruthy();
    }
    expect(screen.getByText(/Custom roles are coming soon/)).toBeTruthy();
  });
});

describe('Danger zone page', () => {
  it('shows the delete-company section routed to support (no DELETE endpoint)', () => {
    render(<DangerZoneClient />);
    const card = screen.getByTestId('danger-delete-card');
    expect(within(card).getByText('Delete company')).toBeTruthy();
    const support = within(card).getByRole('link', { name: /Contact support to delete/ });
    expect(support.getAttribute('href')).toContain('mailto:');
  });

  it('hides the request action from roles that cannot manage the company', () => {
    viewerRole = 'interviewer';
    render(<DangerZoneClient />);
    expect(screen.queryByRole('link', { name: /Contact support to delete/ })).toBeNull();
    expect(screen.getByText('Only a Founder or Owner can request company deletion.')).toBeTruthy();
  });
});
