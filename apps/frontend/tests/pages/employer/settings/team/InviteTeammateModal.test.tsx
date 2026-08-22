import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InviteTeammateModal from '@/app/(employer)/employer/(app)/(onboarded)/settings/team/parts/InviteTeammateModal';

// These tests exercise the real createInvite against a stubbed fetch so the
// component's own error mapping (ALREADY_MEMBER / INVITE_ALREADY_PENDING) is covered.
function stubFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    ok: status >= 200 && status < 300, status, json: async () => body,
  } as unknown as Response)));
}

function renderModal() {
  return render(<InviteTeammateModal onClose={vi.fn()} onCreated={vi.fn()} onCopied={vi.fn()} />);
}

describe('InviteTeammateModal', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('does not offer Founder as a role', () => {
    renderModal();
    expect(screen.getByRole('option', { name: 'Owner' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Member' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Interviewer' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Founder' })).toBeNull();
  });

  it('reveals the two interviewer checkboxes only for the interviewer role', () => {
    renderModal();
    expect(screen.queryByText('Can archive applicants')).toBeNull();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'interviewer' } });
    expect(screen.getByText('Can move applicants between stages')).toBeTruthy();
    expect(screen.getByText('Can archive applicants')).toBeTruthy();
  });

  it('surfaces an inline error on 409 ALREADY_MEMBER', async () => {
    stubFetch(409, { code: 'ALREADY_MEMBER', error: 'already' });
    renderModal();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send invite'));
    await waitFor(() => expect(screen.getByText('This person is already a member of your team.')).toBeTruthy());
  });

  it('offers Revoke and re-invite on 409 INVITE_ALREADY_PENDING', async () => {
    stubFetch(409, { code: 'INVITE_ALREADY_PENDING', existingInviteId: 'i9', error: 'pending' });
    renderModal();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByText('Send invite'));
    await waitFor(() => expect(screen.getByText('Revoke and re-invite')).toBeTruthy());
  });
});
