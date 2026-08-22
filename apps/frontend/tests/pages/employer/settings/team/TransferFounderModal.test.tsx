import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TransferFounderModal from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/TransferFounderModal';
import type { TeamMember } from '@/types/employer-team';

vi.mock('@/api/employer-team-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-team-api')>();
  return { ...actual, transferFounder: vi.fn() };
});

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'm1', employerUserId: 'u1', name: 'Owen', email: 'owen@x.io', picture: null,
    role: 'owner', isFounder: false, canMoveApplicants: false, canArchiveApplicants: false,
    invitedByEmployerUserId: null, joinedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

const owners = [member(), member({ id: 'm2', employerUserId: 'u2', name: 'Ola', email: 'ola@x.io' })];

describe('TransferFounderModal', () => {
  it('lists all Owners in the dropdown', () => {
    render(<TransferFounderModal owners={owners} onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByRole('option', { name: /owen@x.io/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /ola@x.io/ })).toBeTruthy();
  });

  it('requires typing the target email to enable Transfer', () => {
    render(<TransferFounderModal owners={owners} onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Transfer Founder' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type owen@x.io/), { target: { value: 'owen@x.io' } });
    expect(button.disabled).toBe(false);
  });

  it('shows a no-Owners message when the list is empty', () => {
    render(<TransferFounderModal owners={[]} onClose={vi.fn()} onSuccess={vi.fn()} onError={vi.fn()} />);
    expect(screen.getByText('There are no Owners to transfer to.')).toBeTruthy();
  });
});
