import { describe, it, expect } from 'vitest';
import {
  canInvite, canRemove, canChangeRole, canTransferFounder,
  canMoveApplicant, canArchiveApplicant, canBulkArchive,
  canCreatePosting, canEditPosting, canClosePosting, canRescoreApplicant, canEditCompanySettings,
} from '@/lib/team-permissions';
import type { Role } from '@/types/employer-team';

const NON_INTERVIEWER: Role[] = ['founder', 'owner', 'member'];

describe('canInvite', () => {
  it('is true for Founder/Owner, false for Member/Interviewer', () => {
    expect(canInvite('founder')).toBe(true);
    expect(canInvite('owner')).toBe(true);
    expect(canInvite('member')).toBe(false);
    expect(canInvite('interviewer')).toBe(false);
  });
});

describe('canRemove', () => {
  it('lets Founder/Owner remove non-Founders', () => {
    expect(canRemove('founder', 'owner', false)).toBe(true);
    expect(canRemove('owner', 'member', false)).toBe(true);
  });
  it('allows self-remove for non-Founder roles', () => {
    expect(canRemove('member', 'member', true)).toBe(true);
    expect(canRemove('interviewer', 'interviewer', true)).toBe(true);
  });
  it('never allows removing a Founder, including self', () => {
    expect(canRemove('owner', 'founder', false)).toBe(false);
    expect(canRemove('founder', 'founder', true)).toBe(false);
  });
  it('denies non-owners removing others', () => {
    expect(canRemove('member', 'interviewer', false)).toBe(false);
  });
});

describe('canChangeRole', () => {
  it('is true for Founder/Owner on a non-Founder, non-self target', () => {
    expect(canChangeRole('founder', 'owner', false)).toBe(true);
    expect(canChangeRole('owner', 'member', false)).toBe(true);
  });
  it('is false for self, Founder target, or insufficient role', () => {
    expect(canChangeRole('owner', 'member', true)).toBe(false);
    expect(canChangeRole('owner', 'founder', false)).toBe(false);
    expect(canChangeRole('member', 'interviewer', false)).toBe(false);
  });
});

describe('canTransferFounder', () => {
  it('is true only when self is Founder and target is Owner', () => {
    expect(canTransferFounder('founder', 'owner')).toBe(true);
  });
  it('is false otherwise', () => {
    expect(canTransferFounder('owner', 'owner')).toBe(false);
    expect(canTransferFounder('founder', 'member')).toBe(false);
    expect(canTransferFounder('founder', 'interviewer')).toBe(false);
  });
});

describe('applicant-action gates', () => {
  it('canMoveApplicant: always true for non-Interviewers; flag-gated for Interviewer', () => {
    NON_INTERVIEWER.forEach((role) => {
      expect(canMoveApplicant(role, false)).toBe(true);
      expect(canMoveApplicant(role, true)).toBe(true);
    });
    expect(canMoveApplicant('interviewer', true)).toBe(true);
    expect(canMoveApplicant('interviewer', false)).toBe(false);
  });

  it('canArchiveApplicant / canBulkArchive: same pattern', () => {
    NON_INTERVIEWER.forEach((role) => {
      expect(canArchiveApplicant(role, false)).toBe(true);
      expect(canBulkArchive(role, false)).toBe(true);
    });
    expect(canArchiveApplicant('interviewer', true)).toBe(true);
    expect(canArchiveApplicant('interviewer', false)).toBe(false);
    expect(canBulkArchive('interviewer', true)).toBe(true);
    expect(canBulkArchive('interviewer', false)).toBe(false);
  });
});

describe('posting + settings gates', () => {
  it('canCreatePosting / canEditPosting / canClosePosting / canRescoreApplicant: true for non-Interviewers', () => {
    NON_INTERVIEWER.forEach((role) => {
      expect(canCreatePosting(role)).toBe(true);
      expect(canEditPosting(role)).toBe(true);
      expect(canClosePosting(role)).toBe(true);
      expect(canRescoreApplicant(role)).toBe(true);
    });
    expect(canCreatePosting('interviewer')).toBe(false);
    expect(canEditPosting('interviewer')).toBe(false);
    expect(canClosePosting('interviewer')).toBe(false);
    expect(canRescoreApplicant('interviewer')).toBe(false);
  });

  it('canEditCompanySettings: true only for Founder/Owner', () => {
    expect(canEditCompanySettings('founder')).toBe(true);
    expect(canEditCompanySettings('owner')).toBe(true);
    expect(canEditCompanySettings('member')).toBe(false);
    expect(canEditCompanySettings('interviewer')).toBe(false);
  });
});
