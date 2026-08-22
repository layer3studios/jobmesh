import { describe, it, expect } from 'vitest';
import {
  needsConfirm, applicantPhrase, buildSwapCopy, buildDetachCopy, buildConfirmCopy,
} from '@/components/employer/jobs/parts/assignment-section-helpers';

describe('needsConfirm', () => {
  it('is false on CREATE even when an assignment is chosen', () => {
    // No posting exists yet, so nobody can have applied to it.
    expect(needsConfirm({ isEdit: false, applicationCount: 0, currentId: null, nextId: 'a1' })).toBe(false);
    // Even a nonsense count cannot make a create form owe a confirm.
    expect(needsConfirm({ isEdit: false, applicationCount: 7, currentId: 'a1', nextId: 'a2' })).toBe(false);
  });

  it('is false when nobody has applied', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 0, currentId: 'a1', nextId: 'a2' })).toBe(false);
    expect(needsConfirm({ isEdit: true, applicationCount: 0, currentId: null, nextId: 'a1' })).toBe(false);
    expect(needsConfirm({ isEdit: true, applicationCount: 0, currentId: 'a1', nextId: null })).toBe(false);
  });

  it('is false when the selection did not change', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 7, currentId: 'a1', nextId: 'a1' })).toBe(false);
    expect(needsConfirm({ isEdit: true, applicationCount: 7, currentId: null, nextId: null })).toBe(false);
  });

  it('is true for a swap on edit with applicants', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 7, currentId: 'a1', nextId: 'a2' })).toBe(true);
  });

  it('is true for a DETACH with applicants', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 7, currentId: 'a1', nextId: null })).toBe(true);
  });

  it('is true for a first attach onto a posting that already has applicants', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 3, currentId: null, nextId: 'a1' })).toBe(true);
  });

  it('is true at exactly one applicant', () => {
    expect(needsConfirm({ isEdit: true, applicationCount: 1, currentId: 'a1', nextId: 'a2' })).toBe(true);
  });
});

describe('applicantPhrase', () => {
  it('agrees subject and verb', () => {
    expect(applicantPhrase(1)).toBe('1 person has applied');
    expect(applicantPhrase(7)).toBe('7 people have applied');
    expect(applicantPhrase(0)).toBe('0 people have applied');
  });
});

describe('buildSwapCopy', () => {
  const copy = buildSwapCopy({
    currentTitle: 'Build a rate limiter', nextTitle: 'Design a schema', applicationCount: 7,
  });

  it('names the count and BOTH assignments', () => {
    expect(copy.body).toContain('7 people have applied');
    expect(copy.body).toContain('Build a rate limiter');
    expect(copy.body).toContain('Design a schema');
  });

  it('states that existing submissions stay reviewable', () => {
    expect(copy.body).toMatch(/stay reviewable/i);
    expect(copy.body).toMatch(/keep that task/i);
  });

  it('labels the button with the action, not "Confirm"', () => {
    expect(copy.confirmLabel).toBe('Change assignment');
    expect(copy.confirmLabel).not.toBe('Confirm');
  });

  it('asks a specific question, never "Are you sure"', () => {
    expect(copy.title).toBe('Change the assignment on this posting?');
    expect(`${copy.title} ${copy.body}`).not.toMatch(/are you sure/i);
  });

  it('is singular at one applicant', () => {
    const single = buildSwapCopy({ currentTitle: 'A', nextTitle: 'B', applicationCount: 1 });
    expect(single.body).toContain('1 person has applied');
    expect(single.body).not.toContain('people');
  });
});

describe('buildDetachCopy', () => {
  const copy = buildDetachCopy({ currentTitle: 'Build a rate limiter', applicationCount: 7 });

  it('says existing submissions stay reviewable — detach is NOT destructive', () => {
    expect(copy.body).toContain('Existing submissions stay reviewable.');
  });

  it('says what new applicants will see', () => {
    expect(copy.body).toContain('New applicants will see the plain apply form.');
  });

  it('names the count and the current assignment', () => {
    expect(copy.body).toContain('7 people have applied');
    expect(copy.body).toContain('Build a rate limiter');
  });

  it('labels the button with the action', () => {
    expect(copy.confirmLabel).toBe('Remove assignment');
  });

  it('never says "Are you sure"', () => {
    expect(`${copy.title} ${copy.body}`).not.toMatch(/are you sure/i);
  });
});

describe('buildConfirmCopy', () => {
  it('routes a null nextTitle to the detach copy', () => {
    const copy = buildConfirmCopy({ currentTitle: 'A', nextTitle: null, applicationCount: 2 });
    expect(copy.confirmLabel).toBe('Remove assignment');
  });

  it('routes a present nextTitle to the swap copy', () => {
    const copy = buildConfirmCopy({ currentTitle: 'A', nextTitle: 'B', applicationCount: 2 });
    expect(copy.confirmLabel).toBe('Change assignment');
  });
});
